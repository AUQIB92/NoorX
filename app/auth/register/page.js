"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUser,
  FaMobile,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaLock,
  FaHospital,
  FaWhatsapp,
  FaEnvelope,
  FaSms,
  FaHome,
  FaHeart,
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP verification
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    mobile: "",
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contactMethod, setContactMethod] = useState("email"); // Default to email
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.name ||
      !formData.address ||
      !formData.email ||
      !formData.mobile
    ) {
      toast.error("All fields are required");
      return;
    }

    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!formData.mobile || formData.mobile.length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setIsLoading(true);

    try {
      // Always use email verification endpoint
      const endpoint = "/api/auth/email-otp";
      const requestData = {
        email: formData.email,
        userName: formData.name,
        mobile: formData.mobile, // Always include mobile number
        address: formData.address,
        contactMethod: "email",
      };

      console.log("Sending request to:", endpoint);
      console.log("Request data:", JSON.stringify(requestData, null, 2));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));

      if (response.ok) {
        toast.success(`OTP sent to your email address (${formData.email})`);
        setStep(2);
      } else {
        // Display specific error message based on the error
        const errorMessage = data.error || "Registration failed";

        // Check if the error is about duplicate email or mobile
        if (
          errorMessage.includes("email address") ||
          errorMessage.includes("mobile number")
        ) {
          toast.error(errorMessage, {
            autoClose: 8000, // Keep the message visible longer
          });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      // Always use email verification endpoint
      const endpoint = "/api/auth/verify-email";
      const requestData = {
        email: formData.email,
        otp,
        isRegistration: true,
        name: formData.name,
        address: formData.address,
        mobile: formData.mobile, // Include mobile number
      };

      console.log("Sending verification request to:", endpoint);
      console.log(
        "Verification request data:",
        JSON.stringify(requestData, null, 2)
      );

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      console.log("Verification response status:", res.status);
      const data = await res.json();
      console.log("Verification response data:", JSON.stringify(data, null, 2));

      if (res.ok) {
        const { token } = data;

        // Store token in localStorage
        localStorage.setItem("token", token);

        // Redirect to patient dashboard
        router.push("/dashboard/patient");

        toast.success("Registration successful");
      } else {
        // Display specific error message based on the error
        const errorMessage = data.error || "Invalid OTP";

        // Check if the error is about duplicate email or mobile
        if (
          errorMessage.includes("email address") ||
          errorMessage.includes("mobile number")
        ) {
          toast.error(errorMessage, {
            autoClose: 8000, // Keep the message visible longer
          });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get contact method display text
  const getContactMethodText = () => {
    switch (contactMethod) {
      case "email":
        return `email address (${formData.email})`;
      case "whatsapp":
        return `WhatsApp number (${formData.mobile})`;
      default:
        return `mobile number (${formData.mobile})`;
    }
  };

  // Function to get contact method icon for OTP screen
  const getContactMethodIcon = () => {
    switch (contactMethod) {
      case "email":
        return <FaEnvelope className="text-primary-500 mr-1" />;
      case "whatsapp":
        return <FaWhatsapp className="text-green-500 mr-1" />;
      default:
        return <FaMobile className="text-primary-500 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-primary-700 to-primary-500 py-6 px-6">
          <div className="flex items-center justify-center mb-4">
            <FaHospital className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            Dr. Imran's Healthcare
          </h2>
          <p className="text-primary-100 text-center text-sm">
            Healthcare & Diagnostic Centre
          </p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex justify-end">
                <Link
                  href="/"
                  className="flex items-center text-primary-600 hover:text-primary-800 font-semibold"
                >
                  <FaHome className="mr-1" /> Home
                </Link>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-primary-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Preferred Contact Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-not-allowed opacity-70 ${
                      contactMethod === "sms"
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-300"
                    }`}
                    onClick={() => toast.info("SMS verification coming soon!")}
                  >
                    <div className="relative">
                      <FaSms className={`h-6 w-6 mb-2 text-gray-500`} />
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded-full">
                        Soon
                      </div>
                    </div>
                    <span className="text-sm font-medium">SMS</span>
                  </div>
                  <div
                    className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-not-allowed opacity-70 ${
                      contactMethod === "whatsapp"
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-300"
                    }`}
                    onClick={() =>
                      toast.info("WhatsApp verification coming soon!")
                    }
                  >
                    <div className="relative">
                      <FaWhatsapp className={`h-6 w-6 mb-2 text-gray-500`} />
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded-full">
                        Soon
                      </div>
                    </div>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </div>
                  <div
                    className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all ${
                      contactMethod === "email"
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-300 hover:border-primary-300 hover:bg-primary-50"
                    }`}
                    onClick={() => setContactMethod("email")}
                  >
                    <FaEnvelope
                      className={`h-6 w-6 mb-2 ${
                        contactMethod === "email"
                          ? "text-primary-600"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                </div>
              </div>

              {/* Always show email field since we're only allowing email registration */}
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="primary-email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-primary-500" />
                  </div>
                  <input
                    type="email"
                    id="primary-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your email will be used for appointment reminders and updates
                </p>
              </div>

              {/* Mobile number field */}
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="mobile"
                >
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMobile className="h-5 w-5 text-primary-500" />
                  </div>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your mobile number will be used for appointment reminders and
                  updates
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="address"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-5 w-5 text-primary-500" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24"
                    placeholder="Enter your address"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 ease-in-out"
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Register"}
                </button>
              </div>

              <div className="text-center text-sm">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary-600 hover:text-primary-800 font-semibold"
                  >
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center text-primary-600 hover:text-primary-800"
                >
                  <FaArrowLeft className="mr-1" /> Back
                </button>

                <Link
                  href="/"
                  className="flex items-center text-primary-600 hover:text-primary-800 font-semibold"
                >
                  <FaHome className="mr-1" /> Home
                </Link>
              </div>

              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  We've sent a 6-digit OTP to your {getContactMethodText()}
                </p>
                <div className="mt-2 flex items-center justify-center text-sm">
                  {getContactMethodIcon()}
                  <span>
                    {contactMethod === "email"
                      ? "Check your email inbox (and spam folder)"
                      : contactMethod === "whatsapp"
                      ? "Check your WhatsApp messages"
                      : "Check your SMS messages"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  For testing purposes, use OTP: 123456
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="otp"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Enter OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-primary-500" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 ease-in-out"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Verifying..."
                    : "Verify & Complete Registration"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mb-4">
        <p className="flex items-center justify-center">
          Developed with <FaHeart className="text-red-500 mx-1" /> by{" "}
          <span className="font-semibold ml-1">Arwaalabs</span>
        </p>
      </div>
    </div>
  );
}
