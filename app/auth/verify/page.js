"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaHospital,
  FaLock,
  FaArrowLeft,
  FaHome,
  FaHeart,
} from "react-icons/fa";
import { toast } from "react-toastify";

const VerifyPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const contactMethod = searchParams.get("method") || "phone";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User ID is missing");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Save token to localStorage
      localStorage.setItem("token", data.token);

      toast.success("Verification successful");

      // Redirect to dashboard or home
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, contactMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      toast.success("OTP has been resent");
    } catch (error) {
      toast.error(error.message);
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
          <div className="flex justify-end mb-4">
            <Link
              href="/"
              className="flex items-center text-primary-600 hover:text-primary-800 font-semibold"
            >
              <FaHome className="mr-1" /> Home
            </Link>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Verify Your Account
          </h3>
          <p className="text-center text-sm text-gray-600 mb-6">
            Please enter the verification code sent to your {contactMethod}
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-primary-500" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>

          <div className="text-sm text-center mt-4">
            <button
              onClick={handleResendOTP}
              className="font-medium text-primary-600 hover:text-primary-500"
              disabled={isLoading}
            >
              Resend verification code
            </button>
          </div>

          <div className="text-sm text-center mt-4">
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              <span className="flex items-center justify-center">
                <FaArrowLeft className="mr-1" /> Back to login
              </span>
            </Link>
          </div>
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
};

export default VerifyPage;
