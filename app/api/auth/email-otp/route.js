import { NextResponse } from "next/server";
import { sendEmailOTP } from "../../../../lib/emailService";
import { generateAndStoreOTP } from "../../../../lib/otpService";

/**
 * API route handler for sending OTP via Email
 * POST /api/auth/email-otp
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, userName, isLogin, mobile, address } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate mobile format if provided
    if (mobile && mobile.length < 10) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 }
      );
    }

    // Prepare additional data for OTP generation
    const additionalData = {};
    if (mobile) additionalData.mobile = mobile;
    if (address) additionalData.address = address;
    if (userName) additionalData.userName = userName;

    // Generate and store OTP
    const result = await generateAndStoreOTP(
      email,
      "email",
      !isLogin,
      additionalData
    );

    if (!result.success) {
      console.error("Email OTP API - OTP generation failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to generate OTP" },
        { status: 500 }
      );
    }

    const otp = result.otp;
    console.log(`Generated OTP for ${email}: ${otp}`);

    // Send OTP via Email
    const sendResult = await sendEmailOTP(email, userName || "User", otp);

    if (sendResult.success) {
      // Return success response
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully via Email",
        // DEVELOPMENT ONLY: Include OTP in response (remove in production)
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    } else {
      // Return error response
      return NextResponse.json(
        { error: sendResult.error || "Failed to send OTP" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email OTP API error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
