"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaTimes,
  FaEdit,
  FaTrash,
  FaUserMd,
  FaFlask,
  FaClock,
  FaUser,
  FaPlus,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "../../../../components/DashboardLayout";

// Create LoadingSpinner component inline
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );
}

export default function LabAppointmentsManagement() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [labId, setLabId] = useState(null);
  const [appointmentFormData, setAppointmentFormData] = useState({
    status: "",
    date: "",
    time: "",
    doctorId: "",
    serviceId: "",
    patientName: "",
    patientEmail: "",
    patientPhone: "",
  });

  // Initialize labId from localStorage
  useEffect(() => {
    const storedLabId = localStorage.getItem("labId");
    if (!storedLabId) {
      toast.error("Please log in to access this page");
      router.push("/auth/login");
      return;
    }
    setLabId(storedLabId);
  }, []);

  // Fetch doctors for the lab
  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      if (!token || !labId) {
        toast.error("Please log in to access this page");
        return;
      }

      const response = await fetch(`/api/labs/${labId}/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch doctors");
      }

      const data = await response.json();
      console.log("Fetched doctors:", data); // Debug log
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to fetch doctors");
      setDoctors([]);
    }
  };

  // Fetch services for the lab
  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch(`/api/labs/${labId}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(data.services);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    }
  };

  // Fetch appointments for the lab
  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentLabId = localStorage.getItem("labId");

      if (!token || !currentLabId) {
        console.error("Missing authentication token or lab ID");
        toast.error("Please log in again");
        router.push("/auth/login");
        return;
      }

      // Construct URL with URLSearchParams for proper encoding
      const params = new URLSearchParams();
      params.append('labId', currentLabId);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);

      const url = `/api/appointments?${params.toString()}`;
      console.log('Fetching appointments from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("labId");
          toast.error("Session expired. Please log in again");
          router.push("/auth/login");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.appointments)) {
        console.error('Invalid appointments data:', data);
        throw new Error('Invalid response format');
      }

      setAppointments(data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error(error.message || 'Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data and set up auto-refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentLabId = localStorage.getItem("labId");

    if (!token || !currentLabId) {
      toast.error("Please log in to access this page");
      router.push("/auth/login");
      return;
    }

    // Fetch initial data
    fetchDoctors();
    fetchServices();
    fetchAppointments();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [filterStatus, filterDate]);

  // Handle booking new appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...appointmentFormData,
          lab_id: labId,
          booked_by: "labAdmin",
          status: "confirmed", // Set default status for lab-booked appointments
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      toast.success("Appointment booked successfully");
      setShowBookModal(false);
      setAppointmentFormData({
        status: "",
        date: "",
        time: "",
        doctorId: "",
        serviceId: "",
        patientName: "",
        patientEmail: "",
        patientPhone: "",
      });
      fetchAppointments();
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(error.message || "Failed to book appointment");
    }
  };

  // Handle appointment status update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/appointments/${selectedAppointment._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(appointmentFormData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update appointment");
      }

      toast.success("Appointment updated successfully");
      setShowEditModal(false);
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error(error.message || "Failed to update appointment");
    }
  };

  // Handle appointment deletion
  const handleDeleteAppointment = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/appointments/${selectedAppointment._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete appointment");
      }

      toast.success("Appointment deleted successfully");
      setShowDeleteModal(false);
      fetchAppointments();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error(error.message || "Failed to delete appointment");
    }
  };

  // Filter appointments based on search term, status, and date
  const filteredAppointments = appointments.filter((appointment) => {
    // Check if patient name exists and matches search
    const matchesSearch = searchTerm
      ? (appointment.patient_id?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    // Check if status matches filter
    const matchesStatus = filterStatus
      ? appointment.status === filterStatus
      : true;

    // Check if date matches filter
    const matchesDate = filterDate
      ? new Date(appointment.date).toISOString().split('T')[0] === filterDate
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <DashboardLayout role="labAdmin">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Appointments Management
        </h1>
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">View and manage all lab appointments</p>
          <button
            onClick={() => router.push("/dashboard/lab/appointments/book")}
            className="inline-flex items-center px-4 py-2 bg-teal-600 border border-transparent 
              rounded-md text-sm font-medium text-white hover:bg-teal-700 focus:outline-none 
              focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <FaPlus className="mr-2" /> Book New Appointment
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <input
                type="date"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No appointments found.</p>
            </div>
          ) : (
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
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <FaUser className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient_id?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.patient_id?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.service?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{appointment.service?.price}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.doctor_id?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.doctor_id?.specialization}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : appointment.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setAppointmentFormData({
                              ...appointment,
                              doctorId: appointment.doctor_id?._id,
                              serviceId: appointment.service?._id,
                            });
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Book Appointment Modal */}
        {showBookModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative mx-auto p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg">
              <button
                onClick={() => setShowBookModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <FaTimes className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <FaCalendarAlt className="h-8 w-8 text-teal-600" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                  Book New Appointment
                </h2>
              </div>

              <form onSubmit={handleBookAppointment} className="mt-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      name="patientName"
                      value={appointmentFormData.patientName}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          patientName: e.target.value,
                        })
                      }
                      className="w-full h-12 px-4 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Email
                    </label>
                    <input
                      type="email"
                      name="patientEmail"
                      value={appointmentFormData.patientEmail}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          patientEmail: e.target.value,
                        })
                      }
                      className="w-full h-12 px-4 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Phone
                    </label>
                    <input
                      type="tel"
                      name="patientPhone"
                      value={appointmentFormData.patientPhone}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          patientPhone: e.target.value,
                        })
                      }
                      className="w-full h-12 px-4 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor
                    </label>
                    <select
                      name="doctorId"
                      value={appointmentFormData.doctorId}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          doctorId: e.target.value,
                        })
                      }
                      className="w-full h-12 px-4 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a Doctor</option>
                      {doctors && doctors.length > 0 ? (
                        doctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            Dr. {doctor.name} - {doctor.specialization}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No doctors available</option>
                      )}
                    </select>
                    {doctors.length === 0 && (
                      <p className="mt-1 text-sm text-red-500">
                        No doctors found. Please add doctors to your lab first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Service
                    </label>
                    <select
                      name="serviceId"
                      value={appointmentFormData.serviceId}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          serviceId: e.target.value,
                        })
                      }
                      className="w-full h-12 px-4 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a Service</option>
                      {services.map((service) => (
                        <option key={service._id} value={service._id}>
                          {service.name} - ₹{service.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={appointmentFormData.date}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          date: e.target.value,
                        })
                      }
                      className="w-full h-12 px-4 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={appointmentFormData.time}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          time: e.target.value,
                        })
                      }
                      className="w-full h-12 px-4 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700"
                  >
                    Book Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Appointment Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative mx-auto p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <FaTimes className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaCalendarAlt className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                  Update Appointment
                </h2>
              </div>

              <form onSubmit={handleUpdateStatus} className="mt-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={appointmentFormData.status}
                      onChange={(e) =>
                        setAppointmentFormData({
                          ...appointmentFormData,
                          status: e.target.value,
                        })
                      }
                      className="w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Update Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative mx-auto p-8 w-full max-w-md bg-white rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
              <p className="mb-4">
                Are you sure you want to delete this appointment? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAppointment}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </DashboardLayout>
  );
} 