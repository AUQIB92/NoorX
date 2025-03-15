"use client";

import { useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { FaArrowRight, FaCreditCard, FaMobileAlt, FaWallet } from "react-icons/fa";

export default function PaymentGuide() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout role="patient">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Online Payment Guide
        </h1>

        <div className="mb-6">
          <div className="flex border-b">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "overview"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "cards"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("cards")}
            >
              Card Payments
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "upi"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("upi")}
            >
              UPI
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === "netbanking"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("netbanking")}
            >
              Netbanking
            </button>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                About Online Payments
              </h2>
              <p className="text-blue-700">
                We use Razorpay, a secure payment gateway, to process online payments. 
                You can pay for your appointments using credit/debit cards, UPI, or netbanking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <FaCreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-medium ml-2">Card Payments</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Pay using your credit or debit card. All major cards are accepted.
                </p>
                <button
                  className="mt-3 text-primary-600 flex items-center text-sm font-medium"
                  onClick={() => setActiveTab("cards")}
                >
                  Learn more <FaArrowRight className="ml-1 h-3 w-3" />
                </button>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <FaMobileAlt className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium ml-2">UPI Payments</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Pay using any UPI app like Google Pay, PhonePe, or Paytm.
                </p>
                <button
                  className="mt-3 text-primary-600 flex items-center text-sm font-medium"
                  onClick={() => setActiveTab("upi")}
                >
                  Learn more <FaArrowRight className="ml-1 h-3 w-3" />
                </button>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaWallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium ml-2">Netbanking</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Pay directly from your bank account using netbanking.
                </p>
                <button
                  className="mt-3 text-primary-600 flex items-center text-sm font-medium"
                  onClick={() => setActiveTab("netbanking")}
                >
                  Learn more <FaArrowRight className="ml-1 h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg mt-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Testing Payments
              </h2>
              <p className="text-yellow-700 mb-2">
                For testing purposes, you can use the following test credentials:
              </p>
              <ul className="list-disc pl-5 text-yellow-700">
                <li>Card Number: 4111 1111 1111 1111</li>
                <li>Expiry: Any future date</li>
                <li>CVV: Any 3 digits</li>
                <li>UPI: success@razorpay</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "cards" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Card Payments
            </h2>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-4">How to pay with a card</h3>
              
              <ol className="space-y-4">
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium">Select "Pay Online" during checkout</p>
                    <p className="text-sm text-gray-600 mt-1">
                      When confirming your appointment, choose the "Pay Online" option.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium">Enter your card details</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter your card number, expiry date, and CVV code. Your data is securely processed by Razorpay.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium">Complete 3D Secure verification</p>
                    <p className="text-sm text-gray-600 mt-1">
                      If your bank requires it, you'll be redirected to complete 3D Secure verification.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium">Confirmation</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Once payment is successful, you'll receive a confirmation and be redirected back to the appointment page.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium mb-2">Test Card Details</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Card Type</th>
                    <th className="p-2 text-left">Card Number</th>
                    <th className="p-2 text-left">Expiry</th>
                    <th className="p-2 text-left">CVV</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Visa</td>
                    <td className="p-2">4111 1111 1111 1111</td>
                    <td className="p-2">Any future date</td>
                    <td className="p-2">Any 3 digits</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Mastercard</td>
                    <td className="p-2">5267 3181 8797 5449</td>
                    <td className="p-2">Any future date</td>
                    <td className="p-2">Any 3 digits</td>
                  </tr>
                  <tr>
                    <td className="p-2">RuPay</td>
                    <td className="p-2">6062 8205 0000 0009</td>
                    <td className="p-2">Any future date</td>
                    <td className="p-2">Any 3 digits</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "upi" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              UPI Payments
            </h2>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-4">How to pay with UPI</h3>
              
              <ol className="space-y-4">
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium">Select "Pay Online" during checkout</p>
                    <p className="text-sm text-gray-600 mt-1">
                      When confirming your appointment, choose the "Pay Online" option.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium">Select UPI as your payment method</p>
                    <p className="text-sm text-gray-600 mt-1">
                      In the Razorpay payment window, select UPI as your payment method.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium">Enter your UPI ID or scan QR code</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter your UPI ID (e.g., name@upi) or scan the QR code with your UPI app.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium">Approve the payment in your UPI app</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Open your UPI app and approve the payment request.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">5</span>
                  <div>
                    <p className="font-medium">Confirmation</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Once payment is successful, you'll receive a confirmation and be redirected back to the appointment page.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium mb-2">Test UPI Details</h3>
              <p className="mb-2">For testing, use the following UPI ID:</p>
              <div className="bg-white p-3 border rounded font-mono">success@razorpay</div>
              <p className="text-sm text-gray-600 mt-2">
                This will simulate a successful payment without actually charging any money.
              </p>
            </div>
          </div>
        )}

        {activeTab === "netbanking" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Netbanking Payments
            </h2>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-4">How to pay with Netbanking</h3>
              
              <ol className="space-y-4">
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium">Select "Pay Online" during checkout</p>
                    <p className="text-sm text-gray-600 mt-1">
                      When confirming your appointment, choose the "Pay Online" option.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium">Select Netbanking as your payment method</p>
                    <p className="text-sm text-gray-600 mt-1">
                      In the Razorpay payment window, select Netbanking as your payment method.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium">Select your bank</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose your bank from the list of available banks.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium">Log in to your bank's website</p>
                    <p className="text-sm text-gray-600 mt-1">
                      You'll be redirected to your bank's website to log in and authorize the payment.
                    </p>
                  </div>
                </li>
                
                <li className="flex">
                  <span className="bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">5</span>
                  <div>
                    <p className="font-medium">Confirmation</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Once payment is successful, you'll receive a confirmation and be redirected back to the appointment page.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium mb-2">Test Netbanking</h3>
              <p className="mb-2">For testing, select any bank from the list in the Razorpay payment window.</p>
              <p className="text-sm text-gray-600">
                In test mode, selecting any bank will simulate a successful payment without actually charging any money.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 