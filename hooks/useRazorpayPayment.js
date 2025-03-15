'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for Razorpay payment integration
 * @returns {Object} - Hook methods and state
 */
const useRazorpayPayment = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script on component mount
  useEffect(() => {
    console.log("useRazorpayPayment hook initialized");
    
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log("Razorpay already loaded in window object");
      setIsScriptLoaded(true);
      return;
    }

    console.log("Loading Razorpay script...");
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      setIsScriptLoaded(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Razorpay script:', error);
      setIsScriptLoaded(false);
    };
    
    document.body.appendChild(script);
    console.log("Razorpay script added to document body");
    
    // Cleanup function
    return () => {
      // Only remove the script if it was added by this hook
      if (document.body.contains(script)) {
        console.log("Cleaning up Razorpay script");
        document.body.removeChild(script);
      }
    };
  }, []);

  /**
   * Create a Razorpay order
   * @param {Object} orderData - Order data
   * @param {number} orderData.amount - Amount in INR
   * @param {Object} orderData.appointmentData - Appointment data
   * @param {string} token - JWT token for authentication
   * @returns {Promise<Object>} - Razorpay order
   */
  const createOrder = async (orderData, token) => {
    console.log("createOrder called with data:", JSON.stringify(orderData));
    
    try {
      if (!token) {
        console.error("No authentication token provided for createOrder");
        throw new Error("Authentication token is required");
      }
      
      console.log("Making API request to create Razorpay order...");
      const response = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
        // Add cache control to prevent caching
        cache: 'no-store'
      });
      
      console.log("Order API response status:", response.status);
      
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", contentType);
        // Try to get the text response to see what's being returned
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error("Server returned an invalid response format. Please try again later.");
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Order API response data:", JSON.stringify(data));
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Failed to parse server response. Please try again later.");
      }
      
      if (!response.ok) {
        console.error("Failed to create order:", data);
        throw new Error(data.error || data.details || 'Failed to create payment order');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  /**
   * Verify a Razorpay payment
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
   * @param {string} paymentData.razorpay_order_id - Razorpay order ID
   * @param {string} paymentData.razorpay_signature - Razorpay signature
   * @param {string} paymentData.appointmentId - Appointment ID
   * @param {string} token - JWT token for authentication
   * @returns {Promise<Object>} - Verification result
   */
  const verifyPayment = async (paymentData, token) => {
    console.log("verifyPayment called with data:", JSON.stringify(paymentData));
    
    try {
      if (!token) {
        console.error("No authentication token provided for verifyPayment");
        throw new Error("Authentication token is required");
      }
      
      if (!paymentData.razorpay_payment_id || !paymentData.razorpay_order_id || !paymentData.razorpay_signature) {
        console.error("Missing required payment verification data:", paymentData);
        throw new Error("Missing required payment verification data");
      }
      
      console.log("Making API request to verify Razorpay payment...");
      const response = await fetch('/api/payments/razorpay/verify-payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData),
        // Add cache control to prevent caching
        cache: 'no-store'
      });
      
      console.log("Verify payment API response status:", response.status);
      
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", contentType);
        // Try to get the text response to see what's being returned
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error("Server returned an invalid response format. Please try again later.");
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Verify payment API response data:", JSON.stringify(data));
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Failed to parse server response. Please try again later.");
      }
      
      if (!response.ok) {
        console.error("Failed to verify payment:", data);
        throw new Error(data.error || data.details || 'Payment verification failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      throw error;
    }
  };

  /**
   * Process a payment using Razorpay
   * @param {Object} options - Payment options
   * @param {Object} options.appointment - Appointment data
   * @param {Object} options.doctorDetails - Doctor details
   * @param {Object} options.serviceDetails - Service details
   * @param {string} options.date - Appointment date
   * @param {string} options.time - Appointment time
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onError - Error callback
   * @param {Function} options.onCancel - Cancel callback
   */
  const processPayment = async ({
    appointment,
    doctorDetails,
    serviceDetails,
    date,
    time,
    onSuccess,
    onError,
    onCancel
  }) => {
    console.log("processPayment called with appointment:", JSON.stringify(appointment));
    console.log("Doctor details:", JSON.stringify(doctorDetails));
    console.log("Service details:", JSON.stringify(serviceDetails));
    
    try {
      setIsProcessing(true);
      
      // Check if Razorpay script is loaded
      if (!isScriptLoaded) {
        console.error("Razorpay script not loaded");
        throw new Error("Razorpay script not loaded. Please refresh the page and try again.");
      }
      
      // Check if Razorpay is available in window
      if (!window.Razorpay) {
        console.error("Razorpay not available in window object");
        throw new Error("Razorpay not available. Please refresh the page and try again.");
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found in localStorage");
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      // Validate required data
      if (!appointment || !appointment._id) {
        console.error("Invalid appointment data:", appointment);
        throw new Error("Invalid appointment data. Please try again.");
      }
      
      if (!doctorDetails || !doctorDetails.name) {
        console.error("Invalid doctor details:", doctorDetails);
        throw new Error("Invalid doctor details. Please try again.");
      }
      
      if (!serviceDetails || !serviceDetails.price || !serviceDetails.name) {
        console.error("Invalid service details:", serviceDetails);
        throw new Error("Invalid service details. Please try again.");
      }
      
      // Create order data
      const orderData = {
        amount: serviceDetails.price,
        appointmentData: {
          id: appointment._id,
          patientName: appointment.patient_name || "Patient",
          doctorName: doctorDetails.name,
          service: serviceDetails.name,
          date,
          time
        }
      };
      
      console.log("Creating Razorpay order with data:", JSON.stringify(orderData));
      
      // Create order
      let orderResponse;
      try {
        orderResponse = await createOrder(orderData, token);
        console.log("Order created successfully:", JSON.stringify(orderResponse));
      } catch (orderError) {
        console.error("Failed to create order:", orderError);
        throw new Error(orderError.message || "Failed to create payment order. Please try again later.");
      }
      
      if (!orderResponse.order || !orderResponse.order.id) {
        console.error("Invalid order response:", orderResponse);
        throw new Error("Failed to create payment order. Invalid response from server.");
      }
      
      // Configure Razorpay options
      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: "Dr. Imran's Healthcare",
        description: `Payment for ${serviceDetails.name} with Dr. ${doctorDetails.name}`,
        order_id: orderResponse.order.id,
        handler: async function(response) {
          console.log("Payment successful, handler called with response:", JSON.stringify(response));
          
          try {
            // Verify payment
            const verificationData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appointment._id
            };
            
            console.log("Verifying payment with data:", JSON.stringify(verificationData));
            
            let verificationResponse;
            try {
              verificationResponse = await verifyPayment(verificationData, token);
              console.log("Payment verified successfully:", JSON.stringify(verificationResponse));
            } catch (verifyError) {
              console.error("Error verifying payment:", verifyError);
              throw new Error(verifyError.message || "Payment verification failed. Please contact support.");
            }
            
            // Call success callback
            if (onSuccess) {
              onSuccess(verificationResponse);
            }
          } catch (error) {
            console.error("Error in payment handler:", error);
            if (onError) {
              onError(error);
            }
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: appointment.patient_name || "Patient",
          email: appointment.patient_email || "",
          contact: appointment.patient_phone || ""
        },
        theme: {
          color: "#4f46e5"
        },
        // Add specific payment method configuration
        config: {
          display: {
            // Show preferred payment methods first
            preferences: {
              show_default_blocks: true, // Show all payment blocks by default
              // Set the order of payment methods
              sequence: ["block.upi", "block.wallet", "block.netbanking", "block.card"],
              // Make blocks expanded by default
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [
                    {
                      method: "upi",
                      // Use intent flow for better UPI app selection
                      flow: "intent",
                      // Explicitly list popular UPI apps
                      apps: ["google_pay", "phonepe", "paytm", "bhim", "amazon_pay"]
                    }
                  ]
                },
                banks: {
                  name: "Pay via Net Banking",
                  instruments: [
                    {
                      method: "netbanking"
                    }
                  ]
                },
                wallets: {
                  name: "Pay via Wallet",
                  instruments: [
                    {
                      method: "wallet"
                    }
                  ]
                },
                cards: {
                  name: "Pay via Card",
                  instruments: [
                    {
                      method: "card"
                    }
                  ]
                }
              }
            }
          }
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal dismissed by user");
            if (onCancel) {
              onCancel();
            }
            setIsProcessing(false);
          }
        }
      };
      
      console.log("Initializing Razorpay with options:", JSON.stringify(options));
      
      // Initialize Razorpay
      try {
        const razorpay = new window.Razorpay(options);
        console.log("Razorpay instance created");
        
        // Open Razorpay checkout
        console.log("Opening Razorpay checkout...");
        razorpay.open();
      } catch (razorpayError) {
        console.error("Error initializing Razorpay:", razorpayError);
        throw new Error("Failed to initialize payment gateway. Please try again later.");
      }
      
    } catch (error) {
      console.error("Error processing payment:", error);
      if (onError) {
        onError(error);
      }
      setIsProcessing(false);
    }
  };

  return {
    isScriptLoaded,
    isProcessing,
    processPayment
  };
};

export default useRazorpayPayment; 