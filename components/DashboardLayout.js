"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaUserMd,
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaBars,
  FaTimes,
  FaMedkit,
  FaHospital,
} from "react-icons/fa";
import { parseJwt } from "../lib/jwt";

export default function DashboardLayout({ children, role }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Parse token to get user info
    const decoded = parseJwt(token);
    if (!decoded || decoded.role !== role) {
      // Redirect if user doesn't have the correct role
      localStorage.removeItem("token");
      router.push("/auth/login");
      return;
    }

    setUser(decoded);
  }, [router, role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    switch (role) {
      case "admin":
        return [
          {
            href: "/dashboard/admin",
            label: "Dashboard",
            icon: <FaHome className="mr-2" />,
          },
          {
            href: "/dashboard/admin/doctors",
            label: "Manage Doctors",
            icon: <FaUserMd className="mr-2" />,
          },
          {
            href: "/dashboard/admin/patients",
            label: "Manage Patients",
            icon: <FaUser className="mr-2" />,
          },
          {
            href: "/dashboard/admin/appointments",
            label: "Appointments",
            icon: <FaCalendarAlt className="mr-2" />,
          },
          {
            href: "/dashboard/admin/slots",
            label: "Manage Slots",
            icon: <FaCalendarAlt className="mr-2" />,
          },
          {
            href: "/dashboard/admin/services",
            label: "Manage Services",
            icon: <FaMedkit className="mr-2" />,
          },
        ];
      case "doctor":
        return [
          {
            href: "/dashboard/doctor",
            label: "Dashboard",
            icon: <FaHome className="mr-2" />,
          },
          {
            href: "/dashboard/doctor/appointments",
            label: "My Appointments",
            icon: <FaCalendarAlt className="mr-2" />,
          },
          {
            href: "/dashboard/doctor/availability",
            label: "Set Availability",
            icon: <FaCalendarAlt className="mr-2" />,
          },
        ];
      case "patient":
        return [
          {
            href: "/dashboard/patient",
            label: "Dashboard",
            icon: <FaHome className="mr-2" />,
          },
          {
            href: "/dashboard/patient/appointments",
            label: "My Appointments",
            icon: <FaCalendarAlt className="mr-2" />,
          },
          {
            href: "/dashboard/patient/book",
            label: "Book Appointment",
            icon: <FaCalendarAlt className="mr-2" />,
          },
        ];
      default:
        return [];
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-primary-600 text-white">
        <div className="p-4 flex flex-col items-center">
          <div className="flex items-center">
            <FaHospital className="h-8 w-8 mr-2" />
            <span className="text-xl font-bold">Dr. Imran's Healthcare</span>
          </div>
          <span className="text-sm text-primary-200 mt-1">By ArwaaLabs</span>
        </div>

        <div className="p-4 border-t border-primary-500">
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-primary-200">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {getNavLinks().map((link, index) => (
              <li key={index}>
                <Link
                  href={link.href}
                  className="flex items-center py-2 px-4 rounded hover:bg-primary-700"
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-primary-500">
          <button
            onClick={handleLogout}
            className="flex items-center py-2 px-4 rounded hover:bg-primary-700 w-full"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-primary-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center">
              <FaHospital className="h-6 w-6 mr-2" />
              <span className="font-bold">Dr. Imran's Healthcare</span>
            </div>
            <span className="text-xs text-primary-200 ml-8">By ArwaaLabs</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded hover:bg-primary-700"
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="mt-4">
            <div className="py-2 border-b border-primary-500">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-primary-200">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            </div>

            <nav className="py-2">
              <ul className="space-y-1">
                {getNavLinks().map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="flex items-center py-2 rounded hover:bg-primary-700"
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="pt-2 border-t border-primary-500">
              <button
                onClick={handleLogout}
                className="flex items-center py-2 rounded hover:bg-primary-700 w-full"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
