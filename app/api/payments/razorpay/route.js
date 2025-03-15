import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { withAuth } from "../../../../middleware/auth";
import Appointment from "../../../../models/Appointment";
import { sendBookingConfirmation } from "../../../../lib/twilio";
import { sendBookingConfirmationEmail } from "../../../../lib/emailService";

// Initialize Razorpay with your keys from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Log Razorpay initialization for debugging
console.log("Razorpay initialized with key_id:", process.env.RAZORPAY_KEY_ID);

/**
 * Create a Razorpay order
 * POST /api/payments/razorpay/create-order
 */
async function createOrder(req) {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, appointmentData } = body;

    console.log("Creating Razorpay order with data:", { amount, appointmentData });

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Create a Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
      notes: {
        appointmentId: appointmentData?.id || "",
        patientName: appointmentData?.patientName || "",
        doctorName: appointmentData?.doctorName || "",
        service: appointmentData?.service || "",
        date: appointmentData?.date || "",
        time: appointmentData?.time || "",
      },
    };

    console.log("Razorpay order options:", options);

    try {
      const order = await razorpay.orders.create(options);
      console.log("Razorpay order created:", order);
      
      return NextResponse.json({
        success: true,
        order,
        key_id: razorpay.key_id,
      });
    } catch (razorpayError) {
      console.error("Razorpay order creation error:", razorpayError);
      return NextResponse.json(
        { 
          error: "Failed to create payment order", 
          details: razorpayError.message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { 
        error: "Failed to create payment order",
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Verify a Razorpay payment
 * PUT /api/payments/razorpay/verify-payment
 */
async function verifyPayment(req) {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      appointmentId,
    } = body;

    console.log("Verifying Razorpay payment:", {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      appointmentId,
    });

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment details" },
        { status: 400 }
      );
    }

    // Verify the payment signature
    const generated_signature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("Invalid payment signature", {
        generated: generated_signature,
        received: razorpay_signature,
      });
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    console.log("Payment signature verified successfully");

    // If signature is valid, update the appointment status
    if (appointmentId) {
      try {
        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) {
          return NextResponse.json(
            { error: "Appointment not found" },
            { status: 404 }
          );
        }

        console.log("Found appointment to update:", appointment._id);

        // Update appointment payment status
        appointment.payment_status = "completed";
        appointment.payment_date = new Date();
        appointment.payment_id = razorpay_payment_id;
        appointment.status = "confirmed"; // Auto-confirm appointment after payment
        
        await appointment.save();
        console.log("Appointment updated with payment details");

        // Send confirmation SMS and email
        try {
          // Prepare data for the SMS
          const smsData = {
            patientName: appointment.patient_name,
            doctorName: appointment.doctor_name,
            date: appointment.date,
            time: appointment.time,
            serviceName: appointment.service_name,
            amount: appointment.payment_amount,
            status: appointment.status,
          };

          // Send SMS to patient's mobile number
          if (appointment.patient_mobile) {
            await sendBookingConfirmation(appointment.patient_mobile, smsData);
            console.log("Booking confirmation SMS sent");
          }

          // Send email if patient has an email
          if (appointment.patient_email) {
            const emailData = {
              appointmentId: appointment._id,
              doctorName: appointment.doctor_name,
              serviceName: appointment.service_name,
              date: appointment.date,
              time: appointment.time,
              amount: appointment.payment_amount,
              paymentMethod: appointment.payment_method,
              paymentId: razorpay_payment_id,
              notes: appointment.notes || 'None'
            };
            
            await sendBookingConfirmationEmail(appointment.patient_email, emailData);
            console.log("Booking confirmation email sent");
          }
        } catch (notificationError) {
          // Just log the error but don't fail the payment verification
          console.error("Error sending notifications:", notificationError);
        }
      } catch (appointmentError) {
        console.error("Error updating appointment:", appointmentError);
        return NextResponse.json(
          { 
            error: "Failed to update appointment",
            details: appointmentError.message
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify payment",
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Export the route handlers with authentication middleware
export const POST = withAuth(createOrder);
export const PUT = withAuth(verifyPayment);

// Add a specific handler for create-order endpoint
export async function POST_createOrder(req) {
  return withAuth(createOrder)(req);
} 