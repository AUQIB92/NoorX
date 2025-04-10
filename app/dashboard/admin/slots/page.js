"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../../components/layouts/AdminLayout";
import { toast } from "react-toastify";
import { formatTime } from "../../../../utils/slotGenerator";
import {
  FaCalendarAlt,
  FaUserMd,
  FaLock,
  FaLockOpen,
  FaCheck,
  FaTimes,
  FaSync,
  FaPlus,
  FaFilter,
  FaEdit,
  FaClock,
  FaCalendarDay,
  FaCalendarWeek,
  FaEye,
  FaEyeSlash,
  FaSlidersH,
  FaTrash,
  FaCopy,
  FaSave,
} from "react-icons/fa";
import { BiTimeFive } from "react-icons/bi";
import {
  MdOutlineMoreTime,
  MdAccessTime,
  MdWbSunny,
  MdOutlineWbTwilight,
  MdNightsStay,
} from "react-icons/md";
import SlotCalendar from "../../../../components/SlotCalendar";

export default function SlotManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: "Monday",
    start_time: "09:00",
    end_time: "09:15",
    duration: 15,
    is_admin_only: false,
  });

  // New state variables for enhanced UI
  const [viewMode, setViewMode] = useState("list"); // list, calendar, timeline
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [timeRangeFilter, setTimeRangeFilter] = useState("all"); // all, morning, afternoon, evening
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSlot, setEditingSlot] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"];
  const timeRanges = [
    { id: "all", label: "All Hours", icon: MdAccessTime },
    { id: "morning", label: "Morning (6:30 AM - 12:00 PM)", icon: MdWbSunny },
    {
      id: "afternoon",
      label: "Afternoon (12:00 PM - 4:00 PM)",
      icon: MdOutlineWbTwilight,
    },
    { id: "evening", label: "Evening (4:00 PM - 7:00 PM)", icon: MdNightsStay },
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchSlots(selectedDoctor);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDoctors(data.doctors || []);
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctor(data.doctors[0]._id);
        }
      } else {
        toast.error(data.error || "Failed to fetch doctors");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("An error occurred while fetching doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots?doctor_id=${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.slots && data.slots.length > 0) {
          setSlots(data.slots);
        } else {
          setSlots([]);
          toast.info("No slots found for this doctor");
        }
      } else {
        toast.error(data.error || "Failed to fetch slots");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("An error occurred while fetching slots");
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSlots = async () => {
    if (!selectedDoctor) {
      toast.error("Please select a doctor first");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctor_id: selectedDoctor }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Default slots generated successfully");
        fetchSlots(selectedDoctor);
      } else {
        toast.error(data.error || "Failed to generate slots");
      }
    } catch (error) {
      console.error("Error generating slots:", error);
      toast.error("An error occurred while generating slots");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminOnly = async (slot) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots/${slot._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_admin_only: !slot.is_admin_only,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the slot in the local state
        setSlots((prevSlots) =>
          prevSlots.map((s) =>
            s._id === slot._id
              ? { ...s, is_admin_only: !slot.is_admin_only }
              : s
          )
        );
        toast.success(
          `Slot ${
            slot.is_admin_only ? "opened to all" : "restricted to admin only"
          }`
        );
      } else {
        toast.error(data.error || "Failed to update slot");
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      toast.error("An error occurred while updating the slot");
    }
  };

  const toggleAvailability = async (slot) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots/${slot._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_available: !slot.is_available,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the slot in the local state
        setSlots((prevSlots) =>
          prevSlots.map((s) =>
            s._id === slot._id ? { ...s, is_available: !slot.is_available } : s
          )
        );
        toast.success(
          `Slot ${
            slot.is_available ? "marked as unavailable" : "marked as available"
          }`
        );
      } else {
        toast.error(data.error || "Failed to update slot");
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      toast.error("An error occurred while updating the slot");
    }
  };

  const handleNewSlotChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSlot({
      ...newSlot,
      [name]: type === "checkbox" ? checked : value,
    });

    // If changing start time or duration, update end time
    if (name === "start_time" || name === "duration") {
      try {
        // Get the current start time or the new one if that's what changed
        const startTimeValue =
          name === "start_time" ? value : newSlot.start_time;

        // Ensure we have a valid start time before continuing
        if (!startTimeValue || !startTimeValue.includes(":")) {
          console.warn("Invalid start time format for calculation");
          return;
        }

        // Parse start time components
        const [hours, minutes] = startTimeValue.split(":").map(Number);

        // Ensure we have valid numbers
        if (isNaN(hours) || isNaN(minutes)) {
          console.warn("Invalid time components for calculation");
          return;
        }

        // Calculate total minutes
        const startMinutes = hours * 60 + minutes;

        // Get duration (either the new value or existing)
        const duration =
          name === "duration" ? parseInt(value) : parseInt(newSlot.duration);

        if (isNaN(duration)) {
          console.warn("Invalid duration for calculation");
          return;
        }

        // Calculate end time in minutes
        const endMinutes = startMinutes + duration;

        // Convert back to hours and minutes
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;

        // Handle time wrapping past midnight
        const adjustedHours = endHours >= 24 ? endHours - 24 : endHours;

        // Format as HH:MM
        const endTime = `${adjustedHours.toString().padStart(2, "0")}:${endMins
          .toString()
          .padStart(2, "0")}`;

        setNewSlot((prev) => ({
          ...prev,
          end_time: endTime,
        }));
      } catch (error) {
        console.error("Error calculating end time:", error);
      }
    }
  };

  const addSlot = async () => {
    if (!selectedDoctor) {
      toast.error("Please select a doctor first");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const slotData = {
        doctor_id: selectedDoctor,
        day: newSlot.day,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        duration: parseInt(newSlot.duration),
        is_admin_only: newSlot.is_admin_only,
        is_available: true,
        date: null, // Explicitly set date to null
      };

      const response = await fetch("/api/slots/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(slotData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Slot added successfully");
        fetchSlots(selectedDoctor);
        setShowAddForm(false);
        // Reset the new slot form
        setNewSlot({
          day: "Monday",
          start_time: "09:00",
          end_time: "09:15",
          duration: "15",
          is_admin_only: false,
        });
      } else {
        // Handle specific error for overlapping slots
        if (data.error && data.error.includes("overlaps")) {
          const conflictingSlot = data.conflictingSlot;
          let errorMessage = data.error;

          if (conflictingSlot) {
            const formattedDate = conflictingSlot.date
              ? new Date(conflictingSlot.date).toLocaleDateString()
              : "weekly";

            errorMessage += `: ${conflictingSlot.day} (${formattedDate}) from ${conflictingSlot.start_time} to ${conflictingSlot.end_time}`;
          }

          toast.error(errorMessage, {
            autoClose: 5000, // Show longer for detailed error
          });
        } else {
          toast.error(data.error || "Failed to add slot");
        }
      }
    } catch (error) {
      console.error("Error adding slot:", error);
      toast.error("An error occurred while adding the slot");
    } finally {
      setLoading(false);
    }
  };

  // Filter slots by day
  const filteredSlots =
    selectedDay === "All"
      ? slots
      : slots.filter((slot) => slot.day === selectedDay);

  // Group slots by day
  const slotsByDay = days.reduce((acc, day) => {
    acc[day] = filteredSlots.filter((slot) => slot.day === day);
    return acc;
  }, {});

  // New helper functions for enhanced UI
  const toggleSlotSelection = useCallback((slotId) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  }, []);

  const selectAllSlotsInDay = useCallback(
    (day) => {
      const daySlotIds = slotsByDay[day].map((slot) => slot._id);
      setSelectedSlots((prev) => {
        const allSelected = daySlotIds.every((id) => prev.includes(id));
        if (allSelected) {
          // Deselect all slots in this day
          return prev.filter((id) => !daySlotIds.includes(id));
        } else {
          // Select all slots in this day
          const newSelection = [...prev];
          daySlotIds.forEach((id) => {
            if (!newSelection.includes(id)) {
              newSelection.push(id);
            }
          });
          return newSelection;
        }
      });
    },
    [slotsByDay]
  );

  const handleBulkAction = useCallback(
    async (action) => {
      if (selectedSlots.length === 0) {
        toast.warning("No slots selected.");
        return;
      }

      setIsLoadingAction(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/slots/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slotIds: selectedSlots,
            action,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(
            `Successfully ${action}ed ${selectedSlots.length} slots`
          );
          fetchSlots(selectedDoctor);
          setSelectedSlots([]);
          setShowBulkActions(false);
        } else {
          toast.error(data.error || `Failed to ${action} slots`);
        }
      } catch (error) {
        console.error(`Error ${action}ing slots:`, error);
        toast.error(`An error occurred while ${action}ing slots`);
      } finally {
        setIsLoadingAction(false);
      }
    },
    [selectedSlots, selectedDoctor]
  );

  const handleDeleteSlot = useCallback(async () => {
    if (!slotToDelete) return;

    setIsLoadingAction(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots/${slotToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Slot deleted successfully");
        fetchSlots(selectedDoctor);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete slot");
      }
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("An error occurred while deleting the slot");
    } finally {
      setIsLoadingAction(false);
      setSlotToDelete(null);
      setShowDeleteConfirm(false);
    }
  }, [slotToDelete, selectedDoctor]);

  const duplicateSlot = useCallback(
    async (slot) => {
      setIsLoadingAction(true);
      try {
        const token = localStorage.getItem("token");
        const slotData = {
          doctor_id: selectedDoctor,
          day: slot.day,
          start_time: slot.start_time,
          end_time: slot.end_time,
          duration: slot.duration,
          is_admin_only: slot.is_admin_only,
        };

        const response = await fetch("/api/slots/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(slotData),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Slot duplicated successfully");
          fetchSlots(selectedDoctor);
        } else {
          toast.error(data.error || "Failed to duplicate slot");
        }
      } catch (error) {
        console.error("Error duplicating slot:", error);
        toast.error("An error occurred while duplicating the slot");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [selectedDoctor]
  );

  const editSlot = useCallback((slot) => {
    setEditingSlot(slot);
    setNewSlot({
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration: slot.duration,
      is_admin_only: slot.is_admin_only,
    });
    setShowAddForm(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingSlot(null);
    setNewSlot({
      day: "Monday",
      start_time: "09:00",
      end_time: "09:15",
      duration: 15,
      is_admin_only: false,
    });
  }, []);

  const updateSlot = useCallback(async () => {
    if (!editingSlot) return;

    setIsLoadingAction(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/slots/${editingSlot._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day: newSlot.day,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          duration: parseInt(newSlot.duration),
          is_admin_only: newSlot.is_admin_only,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Slot updated successfully");
        fetchSlots(selectedDoctor);
        setShowAddForm(false);
        setEditingSlot(null);
      } else {
        toast.error(data.error || "Failed to update slot");
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      toast.error("An error occurred while updating the slot");
    } finally {
      setIsLoadingAction(false);
    }
  }, [editingSlot, newSlot, selectedDoctor]);

  // Apply time range filter
  const applyTimeFilter = (slots) => {
    if (timeRangeFilter === "all") return slots;

    return slots.filter((slot) => {
      const hour = parseInt(slot.start_time.split(":")[0]);

      if (timeRangeFilter === "morning" && hour >= 6 && hour < 12) return true;
      if (timeRangeFilter === "afternoon" && hour >= 12 && hour < 16)
        return true;
      if (timeRangeFilter === "evening" && hour >= 16 && hour < 19) return true;

      return false;
    });
  };

  // Apply search filter
  const applySearchFilter = (slots) => {
    if (!searchQuery.trim()) return slots;

    const query = searchQuery.toLowerCase();
    return slots.filter((slot) => {
      return (
        formatTime(slot.start_time).toLowerCase().includes(query) ||
        formatTime(slot.end_time).toLowerCase().includes(query) ||
        slot.day.toLowerCase().includes(query)
      );
    });
  };

  // Apply all filters
  const fullFilteredSlots = applySearchFilter(applyTimeFilter(filteredSlots));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Slot Management
            </h1>
            <p className="text-sm text-gray-600">
              Create and manage appointment slots for doctors
            </p>
          </div>

          {/* Doctor Selection & Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4">
            <div className="w-full md:w-1/3">
              <label
                htmlFor="doctor"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Doctor
              </label>
              <select
                id="doctor"
                value={selectedDoctor}
                onChange={(e) => {
                  setSelectedDoctor(e.target.value);
                  if (e.target.value) {
                    fetchSlots(e.target.value);
                  } else {
                    setSlots([]);
                  }
                }}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-grow flex flex-wrap gap-2 items-end">
              {selectedDoctor && (
                <>
                  <button
                    onClick={() => {
                      generateDefaultSlots();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaCalendarWeek className="mr-2" /> Generate Default Slots
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setEditingSlot(null);
                      setNewSlot({
                        day: "Monday",
                        start_time: "09:00",
                        end_time: "09:15",
                        duration: 15,
                        is_admin_only: false,
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <MdOutlineMoreTime className="mr-2" /> Add Slot
                  </button>
                  {slots.length > 0 && (
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaSlidersH className="mr-2" /> Bulk Actions{" "}
                      {showBulkActions ? "↑" : "↓"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Bulk Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction("enable")}
                  disabled={isLoadingAction || selectedSlots.length === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <FaEye className="mr-1" /> Enable All
                </button>
                <button
                  onClick={() => handleBulkAction("disable")}
                  disabled={isLoadingAction || selectedSlots.length === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  <FaEyeSlash className="mr-1" /> Disable All
                </button>
                <button
                  onClick={() => handleBulkAction("setadmin")}
                  disabled={isLoadingAction || selectedSlots.length === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  Set Admin Only
                </button>
                <button
                  onClick={() => handleBulkAction("unsetadmin")}
                  disabled={isLoadingAction || selectedSlots.length === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Unset Admin Only
                </button>
                <button
                  onClick={() => {
                    if (
                      selectedSlots.length > 0 &&
                      confirm(`Delete ${selectedSlots.length} selected slots?`)
                    ) {
                      handleBulkAction("delete");
                    }
                  }}
                  disabled={isLoadingAction || selectedSlots.length === 0}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <FaTrash className="mr-1" /> Delete All
                </button>
                {selectedSlots.length > 0 && (
                  <span className="text-xs text-gray-500 self-center ml-2">
                    {selectedSlots.length} slot
                    {selectedSlots.length !== 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Filters and View Mode */}
          {slots.length > 0 && selectedDoctor && (
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              {/* View Mode Switcher */}
              <div className="md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Mode
                </label>
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex-1 px-3 py-2 text-sm font-medium ${
                      viewMode === "list"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode("day")}
                    className={`flex-1 px-3 py-2 text-sm font-medium ${
                      viewMode === "day"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    By Day
                  </button>
                  <button
                    onClick={() => setViewMode("timeline")}
                    className={`flex-1 px-3 py-2 text-sm font-medium ${
                      viewMode === "timeline"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Timeline
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="md:w-1/3">
                <label
                  htmlFor="dayFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Day
                </label>
                <select
                  id="dayFilter"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="All">All Days</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="md:w-1/3">
                <label
                  htmlFor="timeFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Time of Day
                </label>
                <select
                  id="timeFilter"
                  value={timeRangeFilter}
                  onChange={(e) => setTimeRangeFilter(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All Times</option>
                  {timeRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Search */}
          {slots.length > 0 && selectedDoctor && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search slots by time or day..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <FaFilter className="absolute left-3 top-2.5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Add/Edit Slot Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editingSlot ? "Edit Slot" : "Add New Slot"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <select
                    name="day"
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={newSlot.day}
                    onChange={handleNewSlotChange}
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="start_time"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={newSlot.start_time}
                      onChange={handleNewSlotChange}
                      min="06:30"
                      max="19:00"
                    />
                    <MdAccessTime className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    From 6:30 AM to 7:00 PM
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <div className="relative">
                    <select
                      name="duration"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={newSlot.duration}
                      onChange={handleNewSlotChange}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                    <FaClock className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    15-minute slots recommended
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Level
                  </label>
                  <div className="relative">
                    <div className="flex items-center h-10 relative border border-gray-300 rounded-md shadow-sm px-3 py-2">
                      <input
                        type="checkbox"
                        id="is_admin_only"
                        name="is_admin_only"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={newSlot.is_admin_only}
                        onChange={handleNewSlotChange}
                      />
                      <label
                        htmlFor="is_admin_only"
                        className="ml-2 block text-sm text-gray-700 cursor-pointer"
                      >
                        Admin Only
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only admins can see admin-only slots
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-md">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Slot Time Summary
                  </h3>
                  <div className="flex items-center">
                    <MdAccessTime className="text-gray-500 mr-1" />
                    <span className="text-md font-medium text-gray-800">
                      {formatTime(newSlot.start_time || "")} -{" "}
                      {formatTime(newSlot.end_time || "")}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({newSlot.duration} minutes)
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      cancelEdit();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={editingSlot ? updateSlot : addSlot}
                    disabled={isLoadingAction}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoadingAction ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {editingSlot ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        {editingSlot ? "Update Slot" : "Add Slot"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Slots Display Section */}
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : !selectedDoctor ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Select a Doctor
              </h3>
              <p className="text-gray-500">
                Please select a doctor to manage their slots
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No Slots Found
              </h3>
              <p className="text-gray-500 mb-4">
                There are no slots created for this doctor yet.
              </p>
              <button
                onClick={generateDefaultSlots}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaCalendarWeek className="mr-2" /> Generate Default Slots
              </button>
            </div>
          ) : (
            <div>
              {/* List View */}
              {viewMode === "list" && (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={
                                  selectedSlots.length ===
                                    fullFilteredSlots.length &&
                                  fullFilteredSlots.length > 0
                                }
                                onChange={() => {
                                  if (
                                    selectedSlots.length ===
                                    fullFilteredSlots.length
                                  ) {
                                    setSelectedSlots([]);
                                  } else {
                                    setSelectedSlots(
                                      fullFilteredSlots.map((slot) => slot._id)
                                    );
                                  }
                                }}
                              />
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Day
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Duration
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Access
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fullFilteredSlots.map((slot) => (
                          <tr key={slot._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  checked={selectedSlots.includes(slot._id)}
                                  onChange={() => toggleSlotSelection(slot._id)}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FaCalendarDay className="text-gray-500 mr-2" />
                                <span className="text-sm text-gray-900">
                                  {slot.day}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatTime(slot.start_time)} -{" "}
                                {formatTime(slot.end_time)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {slot.duration} mins
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  slot.is_available
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {slot.is_available ? "Available" : "Disabled"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  slot.is_admin_only
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {slot.is_admin_only
                                  ? "Admin Only"
                                  : "All Users"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() =>
                                    toggleAvailability(
                                      slot._id,
                                      !slot.is_available
                                    )
                                  }
                                  className="text-gray-400 hover:text-gray-500"
                                  title={
                                    slot.is_available ? "Disable" : "Enable"
                                  }
                                >
                                  {slot.is_available ? (
                                    <FaEyeSlash />
                                  ) : (
                                    <FaEye />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    toggleAdminOnly(
                                      slot._id,
                                      !slot.is_admin_only
                                    )
                                  }
                                  className="text-gray-400 hover:text-gray-500"
                                  title={
                                    slot.is_admin_only
                                      ? "Make Public"
                                      : "Make Admin Only"
                                  }
                                >
                                  {slot.is_admin_only ? (
                                    <FaEye />
                                  ) : (
                                    <FaEyeSlash />
                                  )}
                                </button>
                                <button
                                  onClick={() => editSlot(slot)}
                                  className="text-blue-400 hover:text-blue-500"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => duplicateSlot(slot)}
                                  className="text-green-400 hover:text-green-500"
                                  title="Duplicate"
                                >
                                  <FaCopy />
                                </button>
                                <button
                                  onClick={() => {
                                    setSlotToDelete(slot._id);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="text-red-400 hover:text-red-500"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Day View */}
              {viewMode === "day" && (
                <SlotCalendar 
                  slots={fullFilteredSlots} 
                  onSlotSelect={(slot) => toggleSlotSelection(slot._id)}
                  selectedSlot={selectedSlots.length === 1 ? slots.find(s => s._id === selectedSlots[0]) : null}
                  onEditSlot={editSlot}
                  onDeleteSlot={(slot) => {
                                          setSlotToDelete(slot._id);
                                          setShowDeleteConfirm(true);
                                        }}
                />
              )}

              {/* Timeline View */}
              {viewMode === "timeline" && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col space-y-8">
                      {days.map((day) => {
                        const daySlots = slotsByDay[day] || [];
                        const filteredDaySlots = applySearchFilter(
                          applyTimeFilter(daySlots)
                        );

                        if (selectedDay !== "All" && day !== selectedDay)
                          return null;
                        if (filteredDaySlots.length === 0) return null;

                        // Sort slots by start time
                        const sortedSlots = [...filteredDaySlots].sort(
                          (a, b) => {
                            return a.start_time.localeCompare(b.start_time);
                          }
                        );

                        return (
                          <div key={day} className="relative">
                            <div className="flex items-center mb-4">
                              <FaCalendarDay className="text-blue-500 mr-2" />
                              <h3 className="text-lg font-medium text-gray-900">
                                {day}
                              </h3>
                              <button
                                onClick={() => selectAllSlotsInDay(day)}
                                className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                              >
                                {daySlots.every((slot) =>
                                  selectedSlots.includes(slot._id)
                                )
                                  ? "Deselect All"
                                  : "Select All"}
                              </button>
                            </div>

                            <div className="ml-6 relative">
                              {/* Timeline axis */}
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                              <div className="space-y-4">
                                {sortedSlots.map((slot) => {
                                  const startHour = parseInt(
                                    slot.start_time.split(":")[0]
                                  );
                                  let timeIcon;

                                  if (startHour < 12) {
                                    timeIcon = (
                                      <MdWbSunny className="text-yellow-500" />
                                    );
                                  } else if (startHour < 16) {
                                    timeIcon = (
                                      <MdOutlineWbTwilight className="text-orange-500" />
                                    );
                                  } else {
                                    timeIcon = (
                                      <MdNightsStay className="text-blue-800" />
                                    );
                                  }

                                  return (
                                    <div
                                      key={slot._id}
                                      className={`relative pl-8 py-3 pr-4 rounded-r-lg ${
                                        selectedSlots.includes(slot._id)
                                          ? "bg-blue-50 border-l-4 border-blue-500"
                                          : "hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300"
                                      }`}
                                    >
                                      {/* Timeline dot */}
                                      <div className="absolute left-[-5px] top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-500"></div>

                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                          <div className="flex flex-col">
                                            <div className="flex items-center">
                                              <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                                                checked={selectedSlots.includes(
                                                  slot._id
                                                )}
                                                onChange={() =>
                                                  toggleSlotSelection(slot._id)
                                                }
                                              />
                                              <div className="w-6">
                                                {timeIcon}
                                              </div>
                                              <span className="ml-2 font-medium text-gray-900">
                                                {formatTime(slot.start_time)} -{" "}
                                                {formatTime(slot.end_time)}
                                              </span>
                                              <span className="ml-2 text-sm text-gray-500">
                                                ({slot.duration} mins)
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                          <div className="flex space-x-1">
                                            <span
                                              className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                                                slot.is_available
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-yellow-100 text-yellow-800"
                                              }`}
                                            >
                                              {slot.is_available
                                                ? "Available"
                                                : "Disabled"}
                                            </span>
                                            {slot.is_admin_only && (
                                              <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                Admin
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() =>
                                                toggleAvailability(
                                                  slot._id,
                                                  !slot.is_available
                                                )
                                              }
                                              className="text-gray-400 hover:text-gray-600"
                                              title={
                                                slot.is_available
                                                  ? "Disable"
                                                  : "Enable"
                                              }
                                            >
                                              {slot.is_available ? (
                                                <FaEyeSlash />
                                              ) : (
                                                <FaEye />
                                              )}
                                            </button>
                                            <button
                                              onClick={() =>
                                                toggleAdminOnly(
                                                  slot._id,
                                                  !slot.is_admin_only
                                                )
                                              }
                                              className="text-gray-400 hover:text-gray-600"
                                              title={
                                                slot.is_admin_only
                                                  ? "Make Public"
                                                  : "Make Admin Only"
                                              }
                                            >
                                              {slot.is_admin_only ? (
                                                <FaEye />
                                              ) : (
                                                <FaEyeSlash />
                                              )}
                                            </button>
                                            <button
                                              onClick={() => editSlot(slot)}
                                              className="text-blue-400 hover:text-blue-600"
                                              title="Edit"
                                            >
                                              <FaEdit />
                                            </button>
                                            <button
                                              onClick={() => duplicateSlot(slot)}
                                              className="text-green-400 hover:text-green-600"
                                              title="Duplicate"
                                            >
                                              <FaCopy />
                                            </button>
                                            <button
                                              onClick={() => {
                                                setSlotToDelete(slot._id);
                                                setShowDeleteConfirm(true);
                                              }}
                                              className="text-red-400 hover:text-red-600"
                                              title="Delete"
                                            >
                                              <FaTrash />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
              <div className="relative mx-auto p-5 w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <FaTrash className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    Delete Slot
                  </h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this slot? This action
                      cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-center gap-4 px-4 py-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSlot}
                      disabled={isLoadingAction}
                      className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {isLoadingAction ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
