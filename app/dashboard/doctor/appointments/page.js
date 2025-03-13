"use client";

import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaSpinner,
  FaSearch,
  FaUser,
  FaUserMd,
  FaMedkit,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import DashboardLayout from "../../../../components/DashboardLayout";
import { toast } from "react-toastify";
import Link from "next/link";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, statusFilter, dateFilter, searchQuery]);

  const fetchAppointments = async (retryCount = 0) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log(
        "Fetching appointments with token:",
        token ? "Token exists" : "No token"
      );

      const res = await fetch("/api/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      console.log("Appointments API response status:", res.status);
      const data = await res.json();
      console.log("Appointments data received:", data);

      if (res.ok) {
        // Sort appointments by date (newest first)
        const sortedAppointments = data.appointments.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        console.log("Sorted appointments:", sortedAppointments);
        setAppointments(sortedAppointments);
        setFilteredAppointments(sortedAppointments);
        toast.success(
          `Successfully loaded ${sortedAppointments.length} appointments`
        );
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
          toast.info(
            `Connection issue. Retrying in ${delay / 1000} seconds...`
          );

          setTimeout(() => {
            fetchAppointments(retryCount + 1);
          }, delay);
          return;
        }

        console.error("API error response:", data.error);
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
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        toast.info(`Network issue. Retrying in ${delay / 1000} seconds...`);

        setTimeout(() => {
          fetchAppointments(retryCount + 1);
        }, delay);
        return;
      }

      toast.error("Failed to load appointments. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "upcoming") {
      filtered = filtered.filter((app) => new Date(app.date) >= today);
    } else if (dateFilter === "past") {
      filtered = filtered.filter((app) => new Date(app.date) < today);
    } else if (dateFilter === "today") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter(
        (app) => new Date(app.date) >= today && new Date(app.date) < tomorrow
      );
    } else if (dateFilter === "week") {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = filtered.filter(
        (app) => new Date(app.date) >= today && new Date(app.date) < nextWeek
      );
    }

    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          (app.patient_id?.name &&
            app.patient_id.name.toLowerCase().includes(query)) ||
          (app.service_id?.name &&
            app.service_id.name.toLowerCase().includes(query)) ||
          (app.patient_id?.mobile && app.patient_id.mobile.includes(query)) ||
          (app.notes && app.notes.toLowerCase().includes(query))
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      console.log(`Updating appointment ${id} to status: ${newStatus}`);

      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update the appointment in the local state
        setAppointments(
          appointments.map((app) =>
            app._id === id ? { ...app, status: newStatus } : app
          )
        );

        toast.success(`Appointment ${newStatus} successfully`);
      } else {
        console.error("Error response:", data);
        toast.error(
          data.error ||
            `Failed to update appointment: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error(`An error occurred: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAppointmentCountByStatus = (status) => {
    if (status === "all") return appointments.length;
    return appointments.filter((app) => app.status === status).length;
  };

  const getDateFilterLabel = (filter) => {
    switch (filter) {
      case "all":
        return "All Dates";
      case "upcoming":
        return "Upcoming";
      case "past":
        return "Past";
      case "today":
        return "Today";
      case "week":
        return "This Week";
      default:
        return "All Dates";
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge component
  const StatusBadge = ({ status }) => {
    const getStatusBadgeClass = (status) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "confirmed":
          return "bg-green-100 text-green-800 border-green-200";
        case "completed":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "cancelled":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(
          status
        )}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Helper function to check if action is allowed based on status
  const canPerformAction = (action, status) => {
    // Doctors can perform all actions except on cancelled appointments
    if (status === "cancelled") return false;

    // Can't cancel completed appointments
    if (action === "cancel" && status === "completed") return false;

    // Can't complete pending appointments (must be confirmed first)
    if (action === "complete" && status === "pending") return false;

    return true;
  };

  return (
    <DashboardLayout role="doctor">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">My Appointments</h1>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full md:w-80"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search appointments..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchAppointments()}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <FaSpinner
                className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Appointment Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                <FaCalendarAlt className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Appointments
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {getAppointmentCountByStatus("all")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FaClock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getAppointmentCountByStatus("pending")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaCheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getAppointmentCountByStatus("confirmed")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaCheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getAppointmentCountByStatus("completed")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <FaSpinner className="animate-spin h-8 w-8 text-primary-500 mr-2" />
              <p>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <FaUser className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient_id?.name ||
                                "Unknown Patient"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.patient_id?.mobile || "No contact"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <FaMedkit className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.service_id?.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹{appointment.service_id?.price || "0"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <FaCalendarAlt className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(appointment.date)}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <FaClock className="mr-1 h-3 w-3" />{" "}
                              {appointment.time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        {appointment.status === "pending" && (
                          <button
                            onClick={() =>
                              handleStatusChange(appointment._id, "confirmed")
                            }
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Confirm
                          </button>
                        )}

                        {(appointment.status === "pending" ||
                          appointment.status === "confirmed") && (
                          <button
                            onClick={() =>
                              handleStatusChange(appointment._id, "completed")
                            }
                            disabled={isProcessing}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Complete
                          </button>
                        )}

                        {appointment.status !== "cancelled" &&
                          appointment.status !== "completed" && (
                            <button
                              onClick={() =>
                                handleStatusChange(appointment._id, "cancelled")
                              }
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Cancel
                            </button>
                          )}

                        {!canPerformAction("confirm", appointment.status) &&
                          !canPerformAction("complete", appointment.status) &&
                          !canPerformAction("cancel", appointment.status) && (
                            <span className="text-gray-400">
                              No actions available
                            </span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-primary-50 rounded-full p-4 mb-4">
                <FaCalendarAlt className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-500 mb-4">
                {statusFilter !== "all" || dateFilter !== "all" || searchQuery
                  ? "Try changing your filters or search criteria"
                  : "You don't have any appointments yet."}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => fetchAppointments()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FaSpinner
                    className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
