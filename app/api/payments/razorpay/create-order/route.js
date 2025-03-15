import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { withAuth } from "../../../../../middleware/auth";

// Initialize Razorpay with your keys from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Log Razorpay initialization for debugging
console.log("Razorpay create-order endpoint initialized with key_id:", process.env.RAZORPAY_KEY_ID);

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

// Export the route handler with authentication middleware
export const POST = withAuth(createOrder); 