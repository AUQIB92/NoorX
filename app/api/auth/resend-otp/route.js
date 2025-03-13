import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { generateOTP } from "../../../../lib/utils";
import { sendOTP } from "../../../../lib/twilio";

export async function POST(request) {
  try {
    const { userId, contactMethod } = await request.json();

    await connectToDatabase();

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate new OTP
    const otp = generateOTP(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP based on contact method
    if (contactMethod === "email") {
      await sendOTP(user.email, otp, "email");
    } else if (contactMethod === "whatsapp") {
      await sendOTP(user.phone, otp, "whatsapp");
    } else {
      await sendOTP(user.phone, otp, "sms");
    }

    return NextResponse.json({
      message: "OTP has been resent",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
