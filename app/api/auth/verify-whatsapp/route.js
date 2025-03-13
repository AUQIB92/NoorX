import { NextResponse } from "next/server";
import { sendRegistrationConfirmation } from "../../../../lib/whatsappApi";
import {
  verifyOTP,
  updateUserAfterVerification,
} from "../../../../lib/otpService";
import { sendWelcomeEmail } from "../../../../lib/emailService";
import jwt from "jsonwebtoken";

// Secret key for JWT token generation
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * API route handler for verifying OTP sent via WhatsApp
 * POST /api/auth/verify-whatsapp
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { mobile, otp, isRegistration, name, address, email } = body;

    // Validate required fields
    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }

    console.log(
      `WhatsApp Verify API - Verifying OTP: ${otp} for mobile: ${mobile}`
    );

    // Verify OTP
    const verificationResult = await verifyOTP(mobile, "whatsapp", otp);

    if (!verificationResult.success) {
      console.log(
        "WhatsApp Verify API - Invalid OTP:",
        verificationResult.error
      );
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

      // Add email to update data if provided
      if (email) {
        updateData.email = email;
      }

      const updateResult = await updateUserAfterVerification(
        mobile,
        "whatsapp",
        updateData
      );

      if (!updateResult.success) {
        console.error(
          "WhatsApp Verify API - Failed to update user:",
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
    console.log(`WhatsApp Verify API - User role: ${userRole}`);

    // Generate JWT token for authentication with the correct role
    const token = jwt.sign(
      {
        id: user._id.toString(),
        mobile,
        role: userRole,
        name: user.name,
        email: user.email, // Include email in token if available
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // If this is a new registration, send a confirmation message
    if (isRegistration) {
      // Get user name from the request or use a default
      const userName = name || "User";

      // Send confirmation message
      await sendRegistrationConfirmation(mobile, userName);
    }

    // Return success response with token and the correct role
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      token,
      role: userRole,
    });
  } catch (error) {
    console.error("WhatsApp OTP verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying OTP" },
      { status: 500 }
    );
  }
}
