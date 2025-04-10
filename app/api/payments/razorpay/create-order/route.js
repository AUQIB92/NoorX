import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { withAuth } from "../../../../../middleware/auth";
import jwt from "jsonwebtoken";
import User from "../../../../../models/User";

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
async function createOrder(req, context) {
  try {
    // Ensure user is authenticated
    if (!context || !context.user || !context.user.id) {
      console.error("User not found in context");
      return NextResponse.json(
        { error: "Authentication error. Please log in again." },
        { status: 401 }
      );
    }

    // We'll make custom middleware that reads raw request first 
    // and stores it in a different way
    const createOrderRaw = async (rawReq) => {
      // Now directly get the body as a stream
      let body;

      try {
        // Try using the normal json method first
        body = await rawReq.json();
      } catch (jsonError) {
        // Fallback: try to read as text and parse
        try {
          const text = await rawReq.text();
          body = JSON.parse(text);
        } catch (textError) {
          console.error("Failed to parse request body:", textError);
          return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
          );
        }
      }

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
    };

    // Export the raw handler to avoid middleware problems
    return createOrderRaw(req);
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

// A special wrapped version of the handler that doesn't use withAuth
// This is because withAuth is causing problems with req.json()
export async function POST(req) {
  try {
    // First create a copy of the request that we can read multiple times
    const reqCopy = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: await req.text(), // Get the raw text first to preserve it
      duplex: 'half'
    });

    // Apply the authentication manually
    const authHeader = reqCopy.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication token is missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Empty authentication token' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        );
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // Call the createOrder function with our context
      return createOrder(reqCopy, { user });
    } catch (authError) {
      console.error('Token verification error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add additional error handling wrapper
export async function POST_errorHandled(req) {
  try {
    return await POST(req);
  } catch (error) {
    console.error("Unhandled POST error in razorpay/create-order route:", error);
    return NextResponse.json(
      { error: "Internal server error in create-order handler" },
      { status: 500 }
    );
  }
} 