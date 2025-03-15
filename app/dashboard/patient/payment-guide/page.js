"use client";

import DashboardLayout from "../../../../components/DashboardLayout";
import { FaArrowLeft, FaCreditCard, FaMobileAlt, FaUniversity, FaWallet, FaInfoCircle, FaShieldAlt, FaQuestionCircle } from "react-icons/fa";
import Link from "next/link";

export default function PaymentGuidePage() {
  return (
    <DashboardLayout role="patient">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <Link href="/dashboard/patient/book" className="inline-flex items-center text-primary-600 hover:text-primary-800">
            <FaArrowLeft className="mr-2" /> Back to Booking
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Online Payment Guide
        </h1>

        <div className="prose max-w-none">
          <p className="text-gray-600">
            We offer multiple secure payment options for your convenience. All payments are processed through Razorpay, a trusted payment gateway that ensures your financial information is protected.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UPI Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaMobileAlt className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3 text-blue-800">UPI Payments</h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                Pay instantly using your preferred UPI app. This is the fastest and most convenient payment method.
              </p>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">How to pay using UPI:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Select "Pay Online" during checkout</li>
                  <li>Choose the UPI option in the payment screen</li>
                  <li>Select your preferred UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.)</li>
                  <li>You'll be redirected to your UPI app to complete the payment</li>
                  <li>Approve the payment in your UPI app</li>
                  <li>Once payment is successful, you'll be redirected back to confirm your appointment</li>
                </ol>
              </div>
              
              <div className="mt-4 flex items-start">
                <FaInfoCircle className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  UPI payments are processed instantly and you'll receive a confirmation immediately after successful payment.
                </p>
              </div>
            </div>

            {/* Card Payments Section */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-100">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <FaCreditCard className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3 text-green-800">Card Payments</h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                Pay securely using your credit or debit card. We accept all major cards including Visa, Mastercard, RuPay, and American Express.
              </p>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">How to pay using card:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Select "Pay Online" during checkout</li>
                  <li>Choose the Card option in the payment screen</li>
                  <li>Enter your card details (card number, expiry date, CVV)</li>
                  <li>For added security, you may be redirected to your bank's 3D Secure page</li>
                  <li>Complete the authentication process</li>
                  <li>Once payment is successful, you'll be redirected back to confirm your appointment</li>
                </ol>
              </div>
              
              <div className="mt-4 flex items-start">
                <FaShieldAlt className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  Your card information is securely processed and not stored on our servers. All transactions are protected with industry-standard encryption.
                </p>
              </div>
            </div>

            {/* Net Banking Section */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaUniversity className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3 text-purple-800">Net Banking</h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                Pay directly from your bank account using net banking. We support all major banks in India.
              </p>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">How to pay using net banking:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Select "Pay Online" during checkout</li>
                  <li>Choose the Net Banking option in the payment screen</li>
                  <li>Select your bank from the list</li>
                  <li>You'll be redirected to your bank's login page</li>
                  <li>Login to your account and authorize the payment</li>
                  <li>Once payment is successful, you'll be redirected back to confirm your appointment</li>
                </ol>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <FaWallet className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold ml-3 text-amber-800">Wallet Payments</h2>
              </div>
              
              <p className="text-gray-700 mb-4">
                Pay using your digital wallet. We support popular wallets like Paytm, Amazon Pay, and more.
              </p>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-800 mb-2">How to pay using wallet:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Select "Pay Online" during checkout</li>
                  <li>Choose the Wallet option in the payment screen</li>
                  <li>Select your preferred wallet</li>
                  <li>You'll be redirected to complete the payment</li>
                  <li>Authorize the payment in your wallet app</li>
                  <li>Once payment is successful, you'll be redirected back to confirm your appointment</li>
                </ol>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaQuestionCircle className="mr-2 text-primary-500" /> Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800">Is it safe to pay online?</h3>
                <p className="text-gray-600 mt-1">
                  Yes, all our online payments are processed through Razorpay, a PCI DSS compliant payment gateway that ensures your payment information is secure and encrypted.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800">What happens if my payment fails?</h3>
                <p className="text-gray-600 mt-1">
                  If your payment fails, no amount will be deducted from your account. You can try again with the same or a different payment method, or choose to pay at the clinic.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800">Will I get a receipt for my payment?</h3>
                <p className="text-gray-600 mt-1">
                  Yes, you will receive a payment confirmation via email and SMS after successful payment. You can also view your payment details in the appointment section of your dashboard.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800">Can I get a refund if I cancel my appointment?</h3>
                <p className="text-gray-600 mt-1">
                  Refund policies depend on when you cancel. Please refer to our cancellation policy for details. Generally, cancellations made at least 24 hours before the appointment are eligible for a full refund.
                </p>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="mt-10 bg-primary-50 p-6 rounded-xl border border-primary-100">
            <h2 className="text-xl font-bold text-primary-800 mb-2">Need Help?</h2>
            <p className="text-gray-700">
              If you encounter any issues with payments or have questions, please contact our support team:
            </p>
            <ul className="mt-3 space-y-2 text-primary-700">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Phone: +91 12345 67890
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email: support@drimranshealthcare.com
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 