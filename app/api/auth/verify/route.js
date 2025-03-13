import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  verifyOTP,
  updateUserAfterVerification,
} from "../../../../lib/otpService";
import { sendWelcomeEmail } from "../../../../lib/emailService";

// Secret key for JWT token generation
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * API route handler for verifying OTP sent via SMS
 * POST /api/auth/verify
 */
export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    console.log("Verify API - Request body:", JSON.stringify(body, null, 2));

    const { mobile, email, otp, isRegistration, name, address } = body;

    // Validate required fields - either mobile or email must be provided
    if ((!mobile && !email) || !otp) {
      console.log("Verify API - Missing required fields");
      return NextResponse.json(
        { error: "Either mobile number or email, and OTP are required" },
        { status: 400 }
      );
    }

    // Determine identifier and type based on what was provided
    const identifier = mobile || email;
    const identifierType = mobile ? "sms" : "email";

    console.log(
      `Verify API - Verifying OTP: ${otp} for ${identifierType}: ${identifier}`
    );

    // Verify OTP
    const verificationResult = await verifyOTP(identifier, identifierType, otp);

    if (!verificationResult.success) {
      console.log("Verify API - Invalid OTP:", verificationResult.error);
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
      };

      // Add email to update data if provided and not used as identifier
      if (email && identifierType !== "email") {
        updateData.email = email;
      }

      const updateResult = await updateUserAfterVerification(
        identifier,
        identifierType,
        updateData
      );

      if (!updateResult.success) {
        console.error(
          "Verify API - Failed to update user:",
          updateResult.error
        );
        return NextResponse.json(
          { error: updateResult.error || "Failed to update user information" },
          { status: 500 }
        );
      }

      // If this is a registration and user has an email, send welcome email
      if (email) {
        try {
          await sendWelcomeEmail(email, name || "User");
          console.log(`Welcome email sent to ${email}`);
        } catch (emailError) {
          // Just log the error but don't fail the verification
          console.error("Error sending welcome email:", emailError);
        }
      }
    }

    // Get the user's role from the database
    const userRole = user.role || "patient";
    console.log(`Verify API - User role: ${userRole}`);

    // Generate JWT token for authentication with the correct role
    const token = jwt.sign(
      {
        id: user._id.toString(),
        mobile: user.mobile,
        email: user.email,
        role: userRole,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return success response with token and the correct role
    const response = {
      success: true,
      message: "OTP verified successfully",
      token,
      role: userRole,
    };

    console.log("Verify API - Response:", JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying OTP" },
      { status: 500 }
    );
  }
}
