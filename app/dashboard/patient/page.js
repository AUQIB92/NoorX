"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaCalendarTimes,
  FaUserMd,
} from "react-icons/fa";
import DashboardLayout from "../../../components/DashboardLayout";
import DashboardCard from "../../../components/DashboardCard";
import AppointmentCard from "../../../components/AppointmentCard";
import { toast } from "react-toastify";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      const data = await res.json();

      if (res.ok) {
        setAppointments(data.appointments);

        // Calculate stats
        const total = data.appointments.length;
        const upcoming = data.appointments.filter(
          (app) =>
            (app.status === "pending" || app.status === "confirmed") &&
            new Date(app.date) >= new Date()
        ).length;
        const completed = data.appointments.filter(
          (app) => app.status === "completed"
        ).length;
        const cancelled = data.appointments.filter(
          (app) => app.status === "cancelled"
        ).length;

        setStats({ total, upcoming, completed, cancelled });
      } else {
        // Check if it's a connection error that we should retry
        if (
          data.error &&
          (data.error.includes("Connection reset") ||
            data.error.includes("Database connection failed") ||
            data.error.includes("timed out")) &&
          retryCount < 3
        ) {
          // Wait for a bit before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(
            `Connection issue. Retrying in ${delay / 1000} seconds...`
          );

          setTimeout(() => {
            fetchAppointments(retryCount + 1);
          }, delay);
          return;
        }

        toast.error(data.error || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);

      // Retry on network errors
      if (
        (error.name === "AbortError" ||
          error.name === "TypeError" ||
          error.message.includes("fetch")) &&
        retryCount < 3
      ) {
        // Wait for a bit before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log(`Connection issue. Retrying in ${delay / 1000} seconds...`);

        setTimeout(() => {
          fetchAppointments(retryCount + 1);
        }, delay);
        return;
      }

      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setAppointments(
      appointments.map((app) =>
        app._id === id ? { ...app, status: newStatus } : app
      )
    );

    // Update stats
    const newStats = { ...stats };
    if (newStatus === "cancelled") {
      newStats.cancelled += 1;
      newStats.upcoming -= 1;
    }
    setStats(newStats);
  };

  // Get upcoming appointments (sorted by date)
  const upcomingAppointments = appointments
    .filter(
      (app) =>
        (app.status === "pending" || app.status === "confirmed") &&
        new Date(app.date) >= new Date()
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3); // Show only the next 3 appointments

  return (
    <DashboardLayout role="patient">
      <div>
        <h1 className="text-2xl font-bold mb-6">Patient Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Total Appointments"
            value={stats.total}
            icon={<FaCalendarAlt />}
            color="primary"
          />
          <DashboardCard
            title="Upcoming Appointments"
            value={stats.upcoming}
            icon={<FaCalendarAlt />}
            color="secondary"
          />
          <DashboardCard
            title="Completed"
            value={stats.completed}
            icon={<FaCalendarCheck />}
            color="success"
          />
          <DashboardCard
            title="Cancelled"
            value={stats.cancelled}
            icon={<FaCalendarTimes />}
            color="danger"
          />
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
            <Link
              href="/dashboard/patient/appointments"
              className="text-primary-600 hover:text-primary-800"
            >
              View All
            </Link>
          </div>

          {isLoading ? (
            <p>Loading appointments...</p>
          ) : upcomingAppointments.length > 0 ? (
            <div>
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  userRole="patient"
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500">No upcoming appointments</p>
              <Link
                href="/dashboard/patient/book"
                className="btn-primary inline-block mt-4"
              >
                Book an Appointment
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/patient/book"
              className="bg-primary-50 hover:bg-primary-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <FaCalendarAlt className="text-3xl text-primary-500 mb-2" />
              <h3 className="font-medium">Book Appointment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Schedule a new appointment with a doctor
              </p>
            </Link>

            <Link
              href="/dashboard/patient/appointments"
              className="bg-primary-50 hover:bg-primary-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <FaCalendarCheck className="text-3xl text-primary-500 mb-2" />
              <h3 className="font-medium">My Appointments</h3>
              <p className="text-sm text-gray-600 mt-1">
                View and manage your appointments
              </p>
            </Link>

            <Link
              href="/dashboard/patient/doctors"
              className="bg-primary-50 hover:bg-primary-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <FaUserMd className="text-3xl text-primary-500 mb-2" />
              <h3 className="font-medium">Find Doctors</h3>
              <p className="text-sm text-gray-600 mt-1">
                Browse and search for doctors
              </p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
