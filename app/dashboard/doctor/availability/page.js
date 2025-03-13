"use client";

import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import DashboardLayout from "../../../../components/DashboardLayout";
import { toast } from "react-toastify";

export default function DoctorAvailability() {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [formData, setFormData] = useState({
    day: "",
    date: "",
    start_time: "",
    end_time: "",
    duration: 30,
    is_recurring: false,
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/doctors/availability", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("API response:", data); // Debug log

      if (res.ok && Array.isArray(data.availability)) {
        // Process the availability data to flatten the structure
        const processedSlots = data.availability.flatMap((avail) => {
          // Each availability has a day and an array of slots
          return (avail.slots || []).map((slot) => ({
            _id: avail._id, // Keep the availability ID
            doctor_id: avail.doctor_id,
            day: avail.day,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: avail.is_available,
          }));
        });

        setSlots(processedSlots);
      } else {
        console.error("Invalid availability data received:", data);
        setSlots([]);
        toast.error(data.error || "Failed to fetch availability slots");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      day: "",
      date: "",
      start_time: "",
      end_time: "",
      duration: 30,
      is_recurring: false,
    });
    setShowAddForm(false);
    setEditingSlotId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const { start_time, end_time, duration, is_recurring, day, date } =
        formData;

      // Create the payload in the format expected by the API
      const payload = {
        doctor_id: localStorage.getItem("userId"), // Assuming userId is stored in localStorage
        slots: [
          {
            start_time,
            end_time,
          },
        ],
        is_available: true,
      };

      // Add day or date based on whether it's recurring
      if (is_recurring) {
        payload.day = day;
      } else {
        payload.date = date;
      }

      const url = editingSlotId
        ? `/api/doctors/availability/${editingSlotId}`
        : "/api/doctors/availability";

      const method = editingSlotId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          editingSlotId
            ? "Availability slot updated successfully"
            : "Availability slot added successfully"
        );
        resetForm();
        fetchSlots();
      } else {
        toast.error(data.error || "Failed to save availability slot");
      }
    } catch (error) {
      console.error("Error saving slot:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slotId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this availability slot? Any appointments booked during this time will need to be rescheduled."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/doctors/availability/${slotId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Availability slot deleted successfully");
        fetchSlots();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete availability slot");
      }
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleEdit = (slot) => {
    // For editing, we need to set the form data based on the slot
    setFormData({
      day: slot.day || "",
      date: slot.date ? new Date(slot.date).toISOString().split("T")[0] : "",
      start_time: slot.start_time || "",
      end_time: slot.end_time || "",
      duration: 30, // Default duration
      is_recurring: Boolean(slot.day && !slot.date), // If it has a day but no date, it's recurring
    });
    setEditingSlotId(slot._id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Group slots by day for recurring slots and by date for one-time slots
  const groupedSlots = Array.isArray(slots)
    ? slots.reduce((acc, slot) => {
        const key = slot.date
          ? new Date(slot.date).toISOString().split("T")[0]
          : slot.day;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(slot);
        return acc;
      }, {})
    : {};

  // Sort slots by start time
  Object.keys(groupedSlots).forEach((key) => {
    if (Array.isArray(groupedSlots[key])) {
      groupedSlots[key].sort((a, b) => {
        const timeA = a.start_time.split(":").map(Number);
        const timeB = b.start_time.split(":").map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
    }
  });

  // Format time for display (24h to 12h)
  const formatTime = (time24h) => {
    if (!time24h || typeof time24h !== "string") {
      return "Invalid time";
    }

    try {
      const [hours, minutes] = time24h.split(":");
      const hour = parseInt(hours, 10);
      if (isNaN(hour)) return "Invalid time";

      const period = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${period}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) {
      return "Invalid date";
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <DashboardLayout role="doctor">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">
            Manage Availability
          </h1>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              <FaPlus className="mr-2" /> Add Availability
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingSlotId ? "Edit Availability" : "Add New Availability"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurring Slot
                  </label>
                  <div className="relative">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="is_recurring"
                        checked={formData.is_recurring}
                        onChange={handleChange}
                        className="form-checkbox h-5 w-5 text-primary-600"
                      />
                      <span className="ml-2 text-gray-700">
                        This is a weekly recurring slot
                      </span>
                    </label>
                  </div>
                </div>

                {formData.is_recurring ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Week
                    </label>
                    <div className="relative">
                      <select
                        name="day"
                        value={formData.day}
                        onChange={handleChange}
                        required
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select Day</option>
                        {daysOfWeek.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split("T")[0]}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Duration (minutes)
                  </label>
                  <div className="relative">
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {isSubmitting && <FaSpinner className="animate-spin mr-2" />}
                  {editingSlotId ? "Update Availability" : "Add Availability"}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-primary-500" />
          </div>
        ) : (
          <div>
            {/* Weekly Recurring Slots */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Weekly Recurring Slots
              </h2>
              {Object.entries(groupedSlots).filter(([key]) =>
                daysOfWeek.includes(key)
              ).length > 0 ? (
                <div className="space-y-6">
                  {daysOfWeek
                    .filter((day) => groupedSlots[day])
                    .map((day) => (
                      <div key={day} className="border-b pb-4 last:border-b-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          {day}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupedSlots[day].map((slot) => (
                            <div
                              key={slot._id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center text-gray-900 font-medium">
                                    <FaClock className="mr-2 text-primary-500" />
                                    {formatTime(slot.start_time)} -{" "}
                                    {formatTime(slot.end_time)}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {slot.duration} minute appointments
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEdit(slot)}
                                    className="text-primary-600 hover:text-primary-800"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(slot._id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    No recurring availability slots set up yet
                  </p>
                </div>
              )}
            </div>

            {/* Specific Date Slots */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Specific Date Availability
              </h2>
              {Object.entries(groupedSlots).filter(
                ([key]) => !daysOfWeek.includes(key)
              ).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedSlots)
                    .filter(([key]) => !daysOfWeek.includes(key))
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, dateSlots]) => (
                      <div key={date} className="border-b pb-4 last:border-b-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          {formatDate(date)}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dateSlots.map((slot) => (
                            <div
                              key={slot._id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center text-gray-900 font-medium">
                                    <FaClock className="mr-2 text-primary-500" />
                                    {formatTime(slot.start_time)} -{" "}
                                    {formatTime(slot.end_time)}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {slot.duration} minute appointments
                                  </p>
                                  {slot.booked_by && (
                                    <p className="text-sm text-red-600 mt-1">
                                      <FaTimes className="inline mr-1" /> Booked
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEdit(slot)}
                                    className="text-primary-600 hover:text-primary-800"
                                    disabled={slot.booked_by}
                                  >
                                    <FaEdit
                                      className={
                                        slot.booked_by ? "text-gray-400" : ""
                                      }
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(slot._id)}
                                    className="text-red-600 hover:text-red-800"
                                    disabled={slot.booked_by}
                                  >
                                    <FaTrash
                                      className={
                                        slot.booked_by ? "text-gray-400" : ""
                                      }
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    No specific date availability slots set up yet
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
