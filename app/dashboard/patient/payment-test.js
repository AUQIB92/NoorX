"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { toast } from "react-toastify";
import useRazorpayPayment from "../../../hooks/useRazorpayPayment";

export default function PaymentTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { isScriptLoaded } = useRazorpayPayment();

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

  return (
    <DashboardLayout role="patient">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Razorpay Payment Test
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

          <div className="flex justify-center">
            <button
              onClick={testRazorpayConnection}
              disabled={isLoading}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
            >
              {isLoading ? "Testing..." : "Test Razorpay Connection"}
            </button>
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
                Ensure that the appointment data being passed to the payment
                processor is valid.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 