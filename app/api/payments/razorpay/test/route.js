import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay with your keys from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Log Razorpay initialization for debugging
console.log("Razorpay test endpoint initialized with key_id:", process.env.RAZORPAY_KEY_ID);

/**
 * Test Razorpay integration
 * GET /api/payments/razorpay/test
 */
export async function GET(req) {
  try {
    // Test Razorpay connection by fetching orders
    const orders = await razorpay.orders.all({
      count: 1,
    });

    return NextResponse.json({
      success: true,
      message: "Razorpay integration is working correctly",
      razorpay_key_id: razorpay.key_id,
      test_order_count: orders.count,
    });
  } catch (error) {
    console.error("Razorpay test error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Razorpay integration test failed",
      error_message: error.message,
      error_stack: error.stack,
    }, { status: 500 });
  }
} 