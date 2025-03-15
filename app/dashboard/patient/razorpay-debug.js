"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { toast } from "react-toastify";

export default function RazorpayDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [amount, setAmount] = useState(100); // Default amount: ₹100

  // Load Razorpay script on component mount
  useEffect(() => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setIsScriptLoaded(false);
    };
    
    document.body.appendChild(script);
    
    // Cleanup function
    return () => {
      // Only remove the script if it was added by this hook
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const testRazorpayConnection = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/payments/razorpay/test", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast.success("Razorpay integration test successful!");
      } else {
        toast.error(`Razorpay integration test failed: ${data.error_message}`);
      }
    } catch (error) {
      console.error("Razorpay test error:", error);
      setTestResult({
        success: false,
        error: "Failed to test Razorpay integration",
        error_message: error.message,
      });
      toast.error("Failed to test Razorpay integration");
    } finally {
      setIsLoading(false);
    }
  };

  const createDirectOrder = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Create a test order
      const orderResponse = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          appointmentData: {
            id: "test_appointment_" + Date.now(),
            patientName: "Test Patient",
            doctorName: "Test Doctor",
            service: "Test Service",
            date: new Date().toISOString().split("T")[0],
            time: "10:00 AM",
          },
        }),
      });

      const orderData = await orderResponse.json();
      console.log("Order creation response:", orderData);

      if (!orderResponse.ok) {
        toast.error(orderData.error || "Failed to create order");
        setIsLoading(false);
        return;
      }

      // Open Razorpay checkout
      if (isScriptLoaded && window.Razorpay) {
        const options = {
          key: orderData.key_id,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Dr. Imran's Healthcare",
          description: "Test Payment",
          order_id: orderData.order.id,
          handler: function (response) {
            console.log("Payment successful:", response);
            toast.success("Payment successful!");
            setTestResult({
              success: true,
              payment_response: response,
            });
          },
          prefill: {
            name: "Test Patient",
            email: "test@example.com",
            contact: "9999999999",
          },
          theme: {
            color: "#4f46e5",
          },
          modal: {
            ondismiss: function () {
              console.log("Payment modal dismissed");
              toast.info("Payment cancelled");
              setIsLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error("Razorpay script not loaded");
      }
    } catch (error) {
      console.error("Error creating direct order:", error);
      toast.error("Failed to create order: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Razorpay Debug Tool
        </h1>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Razorpay Script Status
            </h2>
            <p className="text-blue-700">
              Razorpay script is{" "}
              {isScriptLoaded ? (
                <span className="text-green-600 font-medium">loaded</span>
              ) : (
                <span className="text-red-600 font-medium">not loaded</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-center">
              <button
                onClick={testRazorpayConnection}
                disabled={isLoading}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
              >
                {isLoading ? "Testing..." : "Test Razorpay Connection"}
              </button>
            </div>

            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <label htmlFor="amount" className="mr-2 text-gray-700">
                  Amount (₹):
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  max="10000"
                  className="border border-gray-300 rounded-md px-3 py-1 w-24"
                />
              </div>
              <button
                onClick={createDirectOrder}
                disabled={isLoading || !isScriptLoaded}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isLoading ? "Processing..." : "Create Test Order"}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-lg ${
                testResult.success ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-2 ${
                  testResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                Test Result
              </h2>
              <pre
                className={`whitespace-pre-wrap text-sm ${
                  testResult.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg mt-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Troubleshooting
            </h2>
            <ul className="list-disc pl-5 text-yellow-700 space-y-2">
              <li>
                Make sure Razorpay API keys are correctly configured in your
                environment variables.
              </li>
              <li>
                Check if the Razorpay script is loading correctly (see status
                above).
              </li>
              <li>
                Verify that your network connection allows requests to Razorpay
                servers.
              </li>
              <li>
                Check browser console for any JavaScript errors.
              </li>
              <li>
                Ensure that the server API endpoints are correctly implemented.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 