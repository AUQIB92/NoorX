"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaMobile,
  FaLock,
  FaArrowLeft,
  FaHospital,
  FaEnvelope,
  FaWhatsapp,
  FaSms,
  FaHome,
  FaHeart,
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: Contact entry, 2: OTP verification
  const [formData, setFormData] = useState({
    mobile: "",
    email: "",
  });
  const [notificationMethod, setNotificationMethod] = useState("email"); // Default to email
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    // Validate based on notification method
    if (
      notificationMethod !== "email" &&
      (!formData.mobile || formData.mobile.length < 10)
    ) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    if (notificationMethod === "email" && !formData.email) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Use different API endpoints based on notification method
      let endpoint = "/api/auth/login";
      let requestData = {
        mobile: formData.mobile,
        email: formData.email,
        method: notificationMethod,
      };

      // For email, use the dedicated email-otp endpoint
      if (notificationMethod === "email") {
        endpoint = "/api/auth/email-otp";
        requestData = {
          email: formData.email,
          userName: "User", // Generic name for login
          isLogin: true,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `OTP sent via ${
            notificationMethod === "whatsapp"
              ? "WhatsApp"
              : notificationMethod === "sms"
              ? "SMS"
              : "Email"
          }`
        );
        setStep(2);
      } else {
        // Display specific error message based on the error
        const errorMessage = data.error || "Failed to send OTP";

        // Check if the error is about user not found
        if (errorMessage.includes("User not found")) {
          if (notificationMethod === "email") {
            toast.error(
              `No account found with this email address. Please register first.`,
              {
                autoClose: 8000,
              }
            );
          } else {
            toast.error(
              `No account found with this mobile number. Please register first.`,
              {
                autoClose: 8000,
              }
            );
          }
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
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
      // Use different API endpoints based on notification method
      let endpoint = "/api/auth/verify";
      let requestData = {
        mobile: formData.mobile,
        email: formData.email,
        otp,
      };

      // For email, use the dedicated verify-email endpoint
      if (notificationMethod === "email") {
        endpoint = "/api/auth/verify-email";
        requestData = {
          email: formData.email,
          otp,
          isRegistration: false,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();

      if (res.ok) {
        const { token, role } = data;

        // Store token in localStorage
        localStorage.setItem("token", token);

        // Redirect based on role
        if (role === "admin") {
          router.push("/dashboard/admin");
        } else if (role === "doctor") {
          router.push("/dashboard/doctor");
        } else {
          router.push("/dashboard/patient");
        }

        toast.success("Login successful");
      } else {
        // Display specific error message based on the error
        const errorMessage = data.error || "Invalid OTP";

        // Check if the error is about OTP expiry or invalid OTP
        if (errorMessage.includes("expired")) {
          toast.error("OTP has expired. Please request a new OTP.", {
            autoClose: 8000,
          });
        } else if (errorMessage.includes("Invalid OTP")) {
          toast.error("The OTP you entered is incorrect. Please try again.", {
            autoClose: 5000,
          });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
            <form onSubmit={handleContactSubmit}>
              <div className="mb-4 flex justify-end">
                <Link
                  href="/"
                  className="flex items-center text-primary-600 hover:text-primary-800 font-semibold"
                >
                  <FaHome className="mr-1" /> Home
                </Link>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Verification Method
                </label>
                <div className="flex space-x-4 mb-4">
                  <div
                    className={`flex-1 p-3 border rounded-md cursor-not-allowed opacity-70 flex flex-col items-center justify-center ${
                      notificationMethod === "whatsapp"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-300"
                    }`}
                    onClick={() =>
                      toast.info("WhatsApp verification coming soon!")
                    }
                  >
                    <div className="relative">
                      <FaWhatsapp className="h-6 w-6 text-gray-400" />
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded-full">
                        Soon
                      </div>
                    </div>
                    <span className="mt-1 text-sm">WhatsApp</span>
                  </div>

                  <div
                    className={`flex-1 p-3 border rounded-md cursor-not-allowed opacity-70 flex flex-col items-center justify-center ${
                      notificationMethod === "sms"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => toast.info("SMS verification coming soon!")}
                  >
                    <div className="relative">
                      <FaSms className="h-6 w-6 text-gray-400" />
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded-full">
                        Soon
                      </div>
                    </div>
                    <span className="mt-1 text-sm">SMS</span>
                  </div>

                  <div
                    className={`flex-1 p-3 border rounded-md cursor-pointer flex flex-col items-center justify-center hover:bg-primary-50 transition-colors ${
                      notificationMethod === "email"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setNotificationMethod("email")}
                  >
                    <FaEnvelope
                      className={`h-6 w-6 ${
                        notificationMethod === "email"
                          ? "text-primary-500"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="mt-1 text-sm">Email</span>
                  </div>
                </div>

                {/* Always show email field since we're only allowing email login */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 ease-in-out"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Sending OTP..."
                    : `Send OTP via ${
                        notificationMethod === "whatsapp"
                          ? "WhatsApp"
                          : notificationMethod === "sms"
                          ? "SMS"
                          : "Email"
                      }`}
                </button>
              </div>

              <div className="text-center text-sm">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary-600 hover:text-primary-800 font-semibold"
                  >
                    Register here
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
                  We've sent a 6-digit OTP via{" "}
                  {notificationMethod === "whatsapp"
                    ? "WhatsApp"
                    : notificationMethod === "sms"
                    ? "SMS"
                    : "Email"}{" "}
                  to{" "}
                  {notificationMethod === "email"
                    ? formData.email
                    : `your mobile number ending with ${formData.mobile.slice(
                        -4
                      )}`}
                </p>
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
                  {isLoading ? "Verifying..." : "Verify & Login"}
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
