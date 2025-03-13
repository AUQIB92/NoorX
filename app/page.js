"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaUserMd,
  FaHospital,
  FaFlask,
  FaHeartbeat,
  FaStethoscope,
  FaSignInAlt,
  FaHeart,
} from "react-icons/fa";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-md">
                <FaHospital className="h-12 w-12 text-primary-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold tracking-tight">
                  Dr. Imran's
                </div>
                <div className="text-sm font-medium text-primary-100">
                  Healthcare & Diagnostic Centre
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-500 transition-colors duration-200 flex items-center border border-primary-400"
                >
                  <FaSignInAlt className="mr-2" /> Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white text-primary-600 hover:bg-primary-50 transition-colors duration-200 shadow-md"
                >
                  Register
                </Link>
              </div>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-500 focus:outline-none transition-colors duration-200"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden border-t border-primary-500">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/auth/login"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-500 transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="block px-3 py-2 rounded-md text-base font-medium bg-white text-primary-600 hover:bg-primary-50 transition-colors duration-200"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
              Your Health Is Our Priority
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base sm:text-lg md:mt-5 md:text-xl">
              Book appointments with Dr. Imran's Healthcare and Diagnostic
              Centre for quality healthcare services.
            </p>
            <div className="mt-10">
              <Link
                href="/auth/register"
                className="bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-3 rounded-md shadow-md font-medium"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Dr. Imran's Healthcare Centre?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive healthcare services under one roof
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center bg-primary-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <FaUserMd className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">
                  Expert Doctors
                </h3>
                <p className="mt-2 text-base text-gray-600 text-center">
                  Experienced specialists across multiple disciplines providing
                  quality care.
                </p>
              </div>

              <div className="flex flex-col items-center bg-primary-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <FaFlask className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">
                  Advanced Diagnostics
                </h3>
                <p className="mt-2 text-base text-gray-600 text-center">
                  State-of-the-art diagnostic facilities for accurate and timely
                  results.
                </p>
              </div>

              <div className="flex flex-col items-center bg-primary-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <FaCalendarAlt className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">
                  Easy Appointments
                </h3>
                <p className="mt-2 text-base text-gray-600 text-center">
                  Book appointments online with our user-friendly system, saving
                  your time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-8">
              Our Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaStethoscope className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                General Consultations
              </h3>
              <p className="text-gray-600">
                Comprehensive health check-ups and consultations for all age
                groups.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaHeartbeat className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Specialized Care</h3>
              <p className="text-gray-600">
                Expert care in cardiology, orthopedics, pediatrics, and more.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <FaFlask className="h-10 w-10 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Diagnostic Services
              </h3>
              <p className="text-gray-600">
                Comprehensive lab tests, imaging services, and health
                screenings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="block">Ready to prioritize your health?</span>
            <span className="block text-primary-200">
              Book an appointment today.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/auth/register"
                className="bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-3 rounded-md shadow-md font-medium"
              >
                Register
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/auth/login"
                className="bg-primary-500 text-white hover:bg-primary-700 text-lg px-8 py-3 rounded-md shadow-md font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <FaHospital className="h-8 w-8 text-primary-300 mr-2" />
                <span className="text-xl font-bold">
                  Dr. Imran's Healthcare
                </span>
              </div>
              <p className="text-gray-400">
                Providing quality healthcare services with a focus on patient
                comfort and care.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-gray-400 mb-2">123 Medical Plaza, Dhaka</p>
              <p className="text-gray-400 mb-2">Phone: +880 1234-567890</p>
              <p className="text-gray-400">
                Email: info@drimranshealthcare.com
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Working Hours</h3>
              <p className="text-gray-400 mb-2">
                Monday - Friday: 6:30 AM - 7:00 PM
              </p>
              <p className="text-gray-400 mb-2">Saturday: 8:00 AM - 5:00 PM</p>
              <p className="text-gray-400">Sunday: 9:00 AM - 2:00 PM</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Dr. Imran's Healthcare and
              Diagnostic Centre. All rights reserved.
            </p>
            <p className="flex items-center justify-center mt-2">
              Developed with <FaHeart className="text-red-500 mx-1" /> by{" "}
              <span className="font-semibold ml-1">ArwaaLabs</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
