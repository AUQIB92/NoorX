// lib/twilio.js

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

// Mock Twilio functions for development
const mockTwilio = {
  generateOTP: () => {
    // Generate a random 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  sendOTP: async (mobile, otp) => {
    // In development, just log the OTP instead of sending it
    console.log(`[MOCK SMS] Sending OTP ${otp} to ${mobile}`);
    return { success: true, message: "OTP sent successfully (mock)" };
  },
  sendBookingConfirmation: async (mobile, data) => {
    // In development, just log the booking details instead of sending
    console.log(`[MOCK SMS] Sending booking confirmation to ${mobile}`);
    console.log(`Booking Details:`, data);
    return {
      success: true,
      message: "Booking confirmation sent successfully (mock)",
    };
  },
};

// Real Twilio implementation for production
const realTwilio = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  console.log("Twilio Configuration:");
  console.log(
    "- TWILIO_ACCOUNT_SID:",
    accountSid ? `${accountSid.substring(0, 5)}...` : "❌ Not set"
  );
  console.log(
    "- TWILIO_AUTH_TOKEN:",
    authToken ? "✅ Set (hidden)" : "❌ Not set"
  );
  console.log("- TWILIO_PHONE_NUMBER:", twilioPhone || "❌ Not set");

  // Only initialize Twilio if credentials are properly set
  let twilioClient = null;
  let initializationError = null;

  if (accountSid && authToken) {
    if (!accountSid.startsWith("AC")) {
      initializationError =
        "TWILIO_ACCOUNT_SID should start with 'AC'. Please check your .env.local file.";
      console.error("❌ " + initializationError);
    } else {
      try {
        const twilio = require("twilio");
        twilioClient = twilio(accountSid, authToken);
        console.log("✅ Twilio client initialized successfully!");
      } catch (error) {
        initializationError = `Failed to initialize Twilio client: ${error.message}`;
        console.error("❌ " + initializationError);
      }
    }
  } else {
    initializationError =
      "Missing Twilio credentials. Please check your .env.local file.";
    console.warn("⚠️ " + initializationError);
  }

  // Validate phone number format
  if (twilioPhone && !twilioPhone.startsWith("+")) {
    console.warn(
      "⚠️ TWILIO_PHONE_NUMBER should start with '+' (e.g., +12345678901). SMS may not work correctly."
    );
  }

  return {
    generateOTP: () => {
      // Generate a random 6-digit OTP
      return Math.floor(100000 + Math.random() * 900000).toString();
    },
    sendOTP: async (mobile, otp) => {
      try {
        if (initializationError) {
          // If in development, we can still proceed with a mock
          if (isDev) {
            console.log(`[DEV MODE] Would send OTP ${otp} to ${mobile}`);
            return {
              success: true,
              message: "OTP sent successfully (dev mode)",
            };
          }

          throw new Error(initializationError);
        }

        if (!twilioClient) {
          throw new Error("Twilio client not initialized");
        }

        // Format the mobile number if needed
        const formattedMobile = formatPhoneNumber(mobile);

        console.log(`📱 Sending OTP ${otp} to ${formattedMobile}`);

        // Send SMS via Twilio
        const message = await twilioClient.messages.create({
          body: `Your Sehat verification code is: ${otp}`,
          from: twilioPhone,
          to: formattedMobile,
        });

        console.log(`✅ SMS sent successfully! Message SID: ${message.sid}`);

        return {
          success: true,
          message: "OTP sent successfully",
          sid: message.sid,
        };
      } catch (error) {
        console.error("❌ Twilio error:", error);

        // Provide more detailed error information for debugging
        let errorDetails = error.message;
        if (error.code) {
          errorDetails += ` (Twilio Error Code: ${error.code})`;
        }

        // Log common Twilio error codes with explanations
        if (error.code === 21211) {
          console.error("❌ Invalid 'To' phone number format");
        } else if (error.code === 21608) {
          console.error(
            "❌ The 'From' phone number is not a valid, SMS-capable Twilio phone number"
          );
        } else if (error.code === 20003) {
          console.error(
            "❌ Authentication error - check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
          );
        } else if (error.code === 20404) {
          console.error(
            "❌ Resource not found - your Twilio configuration might be incorrect"
          );
        }

        return {
          success: false,
          message: error.message,
          details: error.code ? `Twilio Error Code: ${error.code}` : undefined,
        };
      }
    },
    sendBookingConfirmation: async (mobile, data) => {
      try {
        if (initializationError) {
          // If in development, we can still proceed with a mock
          if (isDev) {
            console.log(
              `[DEV MODE] Would send booking confirmation to ${mobile}`
            );
            console.log(`Booking Details:`, data);
            return {
              success: true,
              message: "Booking confirmation sent successfully (dev mode)",
            };
          }

          throw new Error(initializationError);
        }

        if (!twilioClient) {
          throw new Error("Twilio client not initialized");
        }

        // Format the mobile number if needed
        const formattedMobile = formatPhoneNumber(mobile);

        // Format date and time nicely
        const appointmentDate = new Date(data.date);
        const formattedDate = appointmentDate.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Construct a customized message with all booking details
        const message =
          `Dear ${data.patientName},\n\n` +
          `Your appointment with Dr. ${data.doctorName} has been ${data.status}.\n\n` +
          `📅 Date: ${formattedDate}\n` +
          `⏰ Time: ${data.time}\n` +
          `🩺 Service: ${data.serviceName}\n` +
          `💰 Amount: ₹${data.amount}\n\n` +
          `Please arrive 10 minutes before your appointment time. For cancellations, please contact us at least 4 hours before.\n\n` +
          `Thank you for choosing Sehat.`;

        console.log(`📱 Sending booking confirmation to ${formattedMobile}`);

        // Send SMS via Twilio
        const smsResult = await twilioClient.messages.create({
          body: message,
          from: twilioPhone,
          to: formattedMobile,
        });

        console.log(
          `✅ Booking confirmation SMS sent successfully! Message SID: ${smsResult.sid}`
        );

        return {
          success: true,
          message: "Booking confirmation sent successfully",
          sid: smsResult.sid,
        };
      } catch (error) {
        console.error("❌ Twilio error:", error);

        // Provide more detailed error information for debugging
        let errorDetails = error.message;
        if (error.code) {
          errorDetails += ` (Twilio Error Code: ${error.code})`;
        }

        // Log common Twilio error codes with explanations
        if (error.code === 21211) {
          console.error("❌ Invalid 'To' phone number format");
        } else if (error.code === 21608) {
          console.error(
            "❌ The 'From' phone number is not a valid, SMS-capable Twilio phone number"
          );
        } else if (error.code === 20003) {
          console.error(
            "❌ Authentication error - check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
          );
        } else if (error.code === 20404) {
          console.error(
            "❌ Resource not found - your Twilio configuration might be incorrect"
          );
        }

        return {
          success: false,
          message: error.message,
          details: error.code ? `Twilio Error Code: ${error.code}` : undefined,
        };
      }
    },
  };
};

// Helper function to format phone numbers
function formatPhoneNumber(phoneNumber) {
  // If number doesn't start with +, assume it's an Indian number
  if (phoneNumber && !phoneNumber.startsWith("+")) {
    // Remove any non-digit characters
    const digits = phoneNumber.replace(/\D/g, "");

    // If 10 digits, add India country code
    if (digits.length === 10) {
      return `+91${digits}`;
    }

    // If the number already has country code without +
    if (digits.length === 12 && digits.startsWith("91")) {
      return `+${digits}`;
    }
  }

  return phoneNumber; // Return as is if already formatted
}

// Determine which implementation to use
let twilioService;
if (isDev) {
  console.log("🚨 Using MOCK Twilio service (Development Mode)");
  twilioService = mockTwilio;
} else {
  console.log("🚀 Using REAL Twilio service (Production Mode)");
  twilioService = realTwilio();
}

export const generateOTP = twilioService.generateOTP;
export const sendOTP = twilioService.sendOTP;
export const sendBookingConfirmation = twilioService.sendBookingConfirmation;
