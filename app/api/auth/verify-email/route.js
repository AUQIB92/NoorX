import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "../../../../lib/emailService";
import {
  verifyOTP,
  updateUserAfterVerification,
} from "../../../../lib/otpService";
import jwt from "jsonwebtoken";

// Secret key for JWT token generation
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * API route handler for verifying OTP sent via Email
 * POST /api/auth/verify-email
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, otp, isRegistration, name, address, mobile } = body;

    // Validate required fields
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    console.log(`Email Verify API - Verifying OTP: ${otp} for email: ${email}`);

    // Verify OTP
    const verificationResult = await verifyOTP(email, "email", otp);

    if (!verificationResult.success) {
      console.log("Email Verify API - Invalid OTP:", verificationResult.error);
      return NextResponse.json(
        { error: verificationResult.error || "Invalid OTP" },
        { status: 400 }
      );
    }

    // Get the user from the verification result
    const user = verificationResult.user;

    // If this is a registration, update user information
    if (isRegistration) {
      const updateData = {
        name: name || "User",
        address: address || "Address",
        verified: true,
      };

      // Include mobile if provided
      if (mobile) {
        updateData.mobile = mobile;
      }

      const updateResult = await updateUserAfterVerification(
        email,
        "email",
        updateData
      );

      if (!updateResult.success) {
        console.error(
          "Email Verify API - Failed to update user:",
          updateResult.error
        );
        return NextResponse.json(
          { error: updateResult.error || "Failed to update user information" },
          { status: 500 }
        );
      }
    }

    // Get the user's role from the database
    const userRole = user.role || "patient";
    console.log(`Email Verify API - User role: ${userRole}`);

    // Generate JWT token for authentication with the correct role
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email,
        mobile: user.mobile,
        role: userRole,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // If this is a new registration, send a welcome email
    if (isRegistration) {
      // Get user name from the request or use a default
      const userName = name || "User";

      // Send welcome email
      await sendWelcomeEmail(email, userName);
    }

    // Return success response with token and the correct role
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      token,
      role: userRole,
    });
  } catch (error) {
    console.error("Email OTP verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying OTP" },
      { status: 500 }
    );
  }
}
