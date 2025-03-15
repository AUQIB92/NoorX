"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../../components/DashboardLayout";
import { FaCheckCircle, FaCalendarAlt, FaUserMd, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaInfoCircle, FaArrowLeft } from "react-icons/fa";

export default function AppointmentConfirmation() {
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get appointment details from localStorage
    const storedDetails = localStorage.getItem("appointmentDetails");
    if (storedDetails) {
      try {
        const details = JSON.parse(storedDetails);
        setAppointmentDetails(details);
      } catch (error) {
        console.error("Error parsing appointment details:", error);
      }
    }
    setLoading(false);
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string' && dateString.includes('T')) {
        // ISO format
        date = new Date(dateString);
      } else if (typeof dateString === 'string' && dateString.includes('-')) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        // Try direct parsing
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "Invalid Date";
      }
      
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error("Error formatting date:", error, "Date string:", dateString);
      return dateString || "Invalid Date";
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center">
          <FaCheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Appointment Confirmed</h1>
          <p className="text-indigo-100 mt-2">Thank you for booking with Dr. Imran's Healthcare</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading appointment details...</p>
          </div>
        ) : appointmentDetails ? (
          <>
            {/* Appointment Details */}
            <div className="p-8 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Appointment Details</h2>
              <div className="space-y-4 divide-y divide-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <FaUserMd className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Doctor:</p>
                      <p className="font-medium text-gray-800">{appointmentDetails.doctorName || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Service:</p>
                      <p className="font-medium text-gray-800">{appointmentDetails.serviceName || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <FaCalendarAlt className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date:</p>
                      <p className="font-medium text-gray-800">{formatDate(appointmentDetails.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <FaClock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time:</p>
                      <p className="font-medium text-gray-800">{appointmentDetails.time || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <FaMoneyBillWave className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount:</p>
                      <p className="font-medium text-gray-800">₹{appointmentDetails.amount || "0"}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method:</p>
                      <p className="font-medium text-gray-800">{appointmentDetails.paymentMethod === "online" ? "Online (Paid)" : "Cash (Pay at clinic)"}</p>
                    </div>
                  </div>
                </div>

                <div className="py-3">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Appointment ID:</p>
                      <p className="font-medium text-gray-800">{appointmentDetails.id || "Not available"}</p>
                    </div>
                  </div>
                </div>

                {appointmentDetails.paymentId && (
                  <div className="py-3">
                    <div className="flex items-center">
                      <div className="bg-teal-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment ID:</p>
                        <p className="font-medium text-gray-800">{appointmentDetails.paymentId}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Important Information */}
            <div className="p-8 border-t border-gray-200">
              <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center mb-3">
                  <FaInfoCircle className="mr-2" /> Important Information
                </h3>
                <ul className="space-y-3 text-blue-700">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Please arrive 15 minutes before your appointment time.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Bring any relevant medical records or test results.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    If you need to cancel or reschedule, please do so at least 24 hours in advance.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Wear a mask and follow COVID-19 safety protocols during your visit.
                  </li>
                </ul>
              </div>
            </div>

            {/* Location */}
            <div className="p-8 bg-green-50 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-green-800 flex items-center mb-4">
                <FaMapMarkerAlt className="mr-2" /> Location
              </h3>
              <div className="text-green-700">
                <p className="font-medium">Dr. Imran's Healthcare Center</p>
                <p>123 Medical Avenue, Srinagar</p>
                <p>Jammu & Kashmir, India</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 flex flex-wrap gap-4 justify-center border-t border-gray-200">
              <Link href="/dashboard/patient/appointments" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <FaCalendarAlt className="mr-2" /> View All Appointments
              </Link>
              <Link href="/dashboard/patient" className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                <FaArrowLeft className="mr-2" /> Back to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-500 inline-block mx-auto text-left">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Appointment Details Found</h2>
              <p className="text-yellow-700">We couldn't find details for your recent appointment.</p>
              <div className="mt-4">
                <Link href="/dashboard/patient/appointments" className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-md shadow-sm hover:bg-yellow-700">
                  <FaCalendarAlt className="mr-2" /> View Your Appointments
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 