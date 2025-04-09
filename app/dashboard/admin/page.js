"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaUserMd,
  FaUser,
  FaPlus,
  FaMedkit,
  FaChartLine,
  FaClock,
  FaHospital,
  FaStethoscope,
  FaHeartbeat,
} from "react-icons/fa";
import DashboardLayout from "../../../components/DashboardLayout";
import DashboardCard from "../../../components/DashboardCard";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0,
    pendingAppointments: 0,
    services: 0,
    activeServices: 0,
    todayAppointments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sample data for healthcare metrics (replace with real data from API)
  const [healthcareMetrics, setHealthcareMetrics] = useState({
    averageWaitTime: "18 min",
    patientSatisfaction: "92%",
    appointmentCompletionRate: "87%",
    specialtyDistribution: [
      { name: "Cardiology", count: 32 },
      { name: "Orthopedics", count: 28 },
      { name: "Pediatrics", count: 45 },
      { name: "Neurology", count: 19 },
      { name: "Dermatology", count: 23 },
    ],
    revenueByService: [
      { name: "Consultations", amount: "₹125,000" },
      { name: "Diagnostics", amount: "₹98,500" },
      { name: "Procedures", amount: "₹215,000" },
      { name: "Therapy", amount: "₹76,800" },
    ],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      // Fetch all dashboard data from the centralized endpoint
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
        // In the future, you can fetch real healthcare metrics from the API
        // setHealthcareMetrics(data.healthcareMetrics);
      } else {
        toast.error(data.error || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Healthcare Dashboard</h1>
          <Link
            href="/dashboard/admin/doctors/add"
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" /> Add Doctor
          </Link>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Total Doctors"
            value={isLoading ? "..." : stats.doctors}
            icon={<FaUserMd />}
            color="primary"
          />
          <DashboardCard
            title="Total Patients"
            value={isLoading ? "..." : stats.patients}
            icon={<FaUser />}
            color="secondary"
          />
          <DashboardCard
            title="Total Appointments"
            value={isLoading ? "..." : stats.appointments}
            icon={<FaCalendarAlt />}
            color="success"
          />
          <DashboardCard
            title="Total Services"
            value={isLoading ? "..." : stats.services}
            icon={<FaMedkit />}
            color="info"
          />
        </div>

        {/* Healthcare Specific Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Healthcare Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FaClock className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Wait Time</p>
                <p className="text-xl font-bold">
                  {healthcareMetrics.averageWaitTime}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FaHeartbeat className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Patient Satisfaction</p>
                <p className="text-xl font-bold">
                  {healthcareMetrics.patientSatisfaction}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-xl font-bold">
                  {healthcareMetrics.appointmentCompletionRate}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
              <div className="rounded-full bg-orange-100 p-3 mr-4">
                <FaStethoscope className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Appointments</p>
                <p className="text-xl font-bold">
                  {isLoading ? "..." : stats.todayAppointments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Specialty Distribution */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">
              Appointments by Specialty
            </h3>
            <div className="space-y-4">
              {healthcareMetrics.specialtyDistribution.map(
                (specialty, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        {specialty.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {specialty.count} patients
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full"
                        style={{
                          width: `${
                            (specialty.count /
                              Math.max(
                                ...healthcareMetrics.specialtyDistribution.map(
                                  (s) => s.count
                                )
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Revenue by Service */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">
              Revenue by Service Type
            </h3>
            <div className="space-y-4">
              {healthcareMetrics.revenueByService.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border-b"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full bg-primary-${
                        (index + 5) * 100
                      } mr-3`}
                    ></div>
                    <span>{service.name}</span>
                  </div>
                  <span className="font-semibold">{service.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/admin/doctors/add">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-full mb-4">
                  <FaUserMd size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Add Doctor</h3>
                <p className="text-gray-600">Add a new doctor to the system</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/labs">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-full mb-4">
                  <FaHospital size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Labs</h3>
                <p className="text-gray-600">Add and manage diagnostic labs</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/doctors">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-full mb-4">
                  <FaUserMd size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Doctors</h3>
                <p className="text-gray-600">View and manage all doctors</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/slots">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-full mb-4">
                  <FaClock size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Slots</h3>
                <p className="text-gray-600">
                  Configure doctor appointment slots
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
