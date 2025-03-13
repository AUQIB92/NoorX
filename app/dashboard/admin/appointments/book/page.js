"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../../../components/layouts/AdminLayout";
import {
  FaCalendarAlt,
  FaUserMd,
  FaUser,
  FaClock,
  FaSpinner,
  FaMedkit,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaPlus,
  FaSearch,
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function AdminBookAppointment() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Select Patient, 2: Select Doctor, 3: Select Service, 4: Select Slot, 5: Confirm
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientMobile, setNewPatientMobile] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientAddress, setNewPatientAddress] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Get tomorrow's date as the minimum date for booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()); // Admins can book for today
  const minDate = tomorrow.toISOString().split("T")[0];

  // Get date 90 days from now as the maximum date for booking (admins can book further)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  useEffect(() => {
    // Don't fetch all patients initially
    setIsLoadingPatients(false);
    fetchDoctors();
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient);
    } else {
      setPatientDetails(null);
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorAvailability(selectedDoctor);
      fetchDoctorDetails(selectedDoctor);
    } else {
      setDoctorAvailability([]);
      setDoctorDetails(null);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedService) {
      fetchServiceDetails(selectedService);
    } else {
      setServiceDetails(null);
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      checkAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, selectedDate, doctorAvailability]);

  // Add a debug effect to log availableSlots when it changes
  useEffect(() => {
    console.log("Available slots state updated:", availableSlots);
  }, [availableSlots]);

  const fetchPatients = async (search = "") => {
    // If no search term provided, don't fetch any patients
    if (!search.trim()) {
      setPatients([]);
      setIsLoadingPatients(false);
      setIsSearching(false);
      return;
    }

    try {
      setIsLoadingPatients(true);
      const token = localStorage.getItem("token");
      const url = `/api/patients?search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setPatients(data.patients);
      } else {
        toast.error(data.error || "Failed to fetch patients");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoadingPatients(false);
      setIsSearching(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setPatientDetails(data.patient);
      } else {
        toast.error(data.error || "Failed to fetch patient details");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.error || "Failed to fetch doctors");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setServices(data.services.filter((service) => service.isActive));
      } else {
        toast.error(data.error || "Failed to fetch services");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/doctors/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setDoctorDetails(data.doctor);
      } else {
        toast.error(data.error || "Failed to fetch doctor details");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchServiceDetails = async (serviceId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setServiceDetails(data.service);
      } else {
        toast.error(data.error || "Failed to fetch service details");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchDoctorAvailability = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/doctors/availability?doctor_id=${doctorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setDoctorAvailability(data.availability);
      } else {
        toast.error(data.error || "Failed to fetch doctor availability");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const checkAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) {
      setIsCheckingSlots(false);
      return;
    }

    setIsCheckingSlots(true);
    console.log("Checking available slots for date:", selectedDate);

    try {
      // Fetch all slots for this doctor and date directly from the API
      // The API now handles filtering out booked slots
      const token = localStorage.getItem("token");
      const slotsRes = await fetch(
        `/api/doctors/${selectedDoctor}/slots?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let availableTimeSlots = [];

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        console.log("Slots data received:", slotsData);

        // Process all slots (both regular weekly and admin-added)
        // The API now returns only available slots
        availableTimeSlots = slotsData.slots
          .filter((slot) => slot.is_available && !slot.booked_by)
          .map((slot) => {
            // Convert 24-hour format to 12-hour format for display
            const [hours, minutes] = slot.start_time.split(":");
            const hour = parseInt(hours);
            const minute = parseInt(minutes);
            const ampm = hour >= 12 ? "PM" : "AM";
            const formattedHour = hour % 12 || 12;

            // Create a slot object with additional metadata
            return {
              id: slot._id,
              time: `${formattedHour}:${minute
                .toString()
                .padStart(2, "0")} ${ampm}`,
              rawTime: `${hours}:${minutes}`,
              isAdminAdded: slot.date !== null,
              period:
                hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening",
            };
          });

        // Sort slots by time
        availableTimeSlots.sort((a, b) => {
          const timeA = a.rawTime.split(":");
          const timeB = b.rawTime.split(":");
          const hourA = parseInt(timeA[0]);
          const hourB = parseInt(timeB[0]);
          if (hourA !== hourB) return hourA - hourB;
          return parseInt(timeA[1]) - parseInt(timeB[1]);
        });

        console.log("Final available time slots:", availableTimeSlots);
        setAvailableSlots(availableTimeSlots);
      } else {
        console.error("Failed to fetch slots from API");
        toast.error("Failed to load available slots");
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error checking available slots:", error);
      toast.error("Failed to load available slots");
      setAvailableSlots([]);
    } finally {
      setIsCheckingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedPatient ||
      !selectedDoctor ||
      !selectedService ||
      !selectedDate ||
      !selectedTime
    ) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, verify that the slot is still available (hasn't been booked by someone else)
      const token = localStorage.getItem("token");
      const verifyRes = await fetch(
        `/api/appointments?doctor=${selectedDoctor}&date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!verifyRes.ok) {
        throw new Error("Failed to verify slot availability");
      }

      const verifyData = await verifyRes.json();
      const bookedTimes = verifyData.appointments
        .filter((app) => app.status === "pending" || app.status === "confirmed")
        .map((app) => app.time);

      // Check if the selected time is now booked
      if (bookedTimes.includes(selectedTime)) {
        toast.error(
          "This slot has just been booked by someone else. Please select another time."
        );
        // Refresh available slots
        checkAvailableSlots();
        setIsSubmitting(false);
        return;
      }

      // Proceed with booking
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: selectedPatient, // Admin books for a patient
          doctor_id: selectedDoctor,
          service_id: selectedService,
          date: selectedDate,
          time: selectedTime,
          notes,
          payment_method: "cash", // Default to cash for admin bookings
          payment_amount: serviceDetails?.price || 0,
          booked_by: "admin", // Indicate this was booked by admin
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Appointment booked successfully");
        router.push("/dashboard/admin/appointments");
      } else {
        toast.error(data.error || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateAvailable = (dateStr) => {
    // If we have slots available, the date is available
    if (availableSlots && availableSlots.length > 0) {
      return true;
    }

    // If we're still checking slots, don't show the error
    if (isCheckingSlots) {
      return true;
    }

    // If we've checked and there are no slots, the date is not available
    if (selectedDate && !isCheckingSlots && availableSlots.length === 0) {
      return false;
    }

    // Default to true to avoid showing the error unnecessarily
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedPatient) {
      toast.error("Please select a patient");
      return;
    }

    if (step === 2 && !selectedDoctor) {
      toast.error("Please select a doctor");
      return;
    }

    if (step === 3 && !selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (step === 4 && (!selectedDate || !selectedTime)) {
      toast.error("Please select a date and time");
      return;
    }

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleCreateNewPatient = async () => {
    // Validate input
    if (!newPatientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }

    if (!newPatientMobile || newPatientMobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    // Validate mobile number format (Indian mobile)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(newPatientMobile)) {
      toast.error(
        "Invalid mobile number format. Please enter a valid Indian mobile number starting with 6-9"
      );
      return;
    }

    setIsCreatingPatient(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPatientName,
          mobile: newPatientMobile,
          email: newPatientEmail || `${newPatientMobile}@placeholder.com`,
          address: newPatientAddress || "Address not provided",
          role: "patient",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Patient created successfully");

        // Set the newly created patient as the selected patient
        setSelectedPatient(data.patient._id);
        setPatientDetails({
          _id: data.patient._id,
          name: data.patient.name,
          mobile: data.patient.mobile,
        });

        // Add the new patient to the patients list
        setPatients((prev) => [data.patient, ...prev]);

        // Move to the next step
        setStep(2);

        // Reset form
        setShowNewPatientForm(false);
        setNewPatientName("");
        setNewPatientMobile("");
        setNewPatientEmail("");
        setNewPatientAddress("");
      } else {
        toast.error(data.error || "Failed to create patient");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsCreatingPatient(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    fetchPatients(searchQuery);
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1: // Select Patient
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 1: Select a Patient
            </h2>

            {!showNewPatientForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-md text-gray-700 font-medium">
                    Select Existing Patient
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(true)}
                    className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
                  >
                    <FaPlus className="mr-1" /> Add New Patient
                  </button>
                </div>

                {/* Search input */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by mobile number"
                      className="flex-grow px-4 py-2 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-primary-600 text-white px-4 py-2 hover:bg-primary-700"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <FaSpinner className="animate-spin h-5 w-5" />
                      ) : (
                        <>
                          <FaSearch className="mr-1" /> Search
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {isLoadingPatients ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="animate-spin h-8 w-8 text-primary-500" />
                  </div>
                ) : patients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patients.map((patient) => (
                      <div
                        key={patient._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPatient === patient._id
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 hover:border-primary-300"
                        }`}
                        onClick={() => setSelectedPatient(patient._id)}
                      >
                        <div className="flex items-center">
                          <div className="bg-primary-100 p-3 rounded-full">
                            <FaUser className="h-6 w-6 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-gray-600">
                              {patient.mobile}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? (
                      <p>
                        No patients found matching "{searchQuery}". Try a
                        different search or add a new patient.
                      </p>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex flex-col items-center">
                          <FaSearch className="h-12 w-12 text-blue-500 mb-4" />
                          <h3 className="text-lg font-medium text-blue-800 mb-2">
                            Search for a Patient
                          </h3>
                          <p className="text-blue-600 text-center mb-4">
                            Enter a patient's mobile number in the search box
                            above to find them.
                          </p>
                          <p className="text-sm text-blue-500">
                            Or click "Add New Patient" to create a new patient
                            record.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      selectedPatient
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!selectedPatient}
                  >
                    Next <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-800">
                    Add New Patient
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Stunning Patient Form */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg mb-6 border border-blue-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FaUser className="text-blue-600 text-xl" />
                    </div>
                    <h4 className="ml-3 text-lg font-medium text-blue-800">
                      Patient Information
                    </h4>
                  </div>
                  <p className="text-sm text-blue-600 mb-4">
                    Please fill in the patient details
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label
                        htmlFor="patientName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Patient Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="patientName"
                          value={newPatientName}
                          onChange={(e) => setNewPatientName(e.target.value)}
                          className="w-full pl-10 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter full name"
                          required
                        />
                        <FaUser className="absolute left-3 top-3.5 text-gray-400" />
                      </div>
                    </div>

                    <div className="col-span-1">
                      <label
                        htmlFor="patientMobile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="patientMobile"
                          value={newPatientMobile}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow only digits and restrict to 10 digits
                            if (/^\d*$/.test(value) && value.length <= 10) {
                              setNewPatientMobile(value);
                              setMobileError("");
                            }

                            // Validate as they type
                            if (value.length > 0 && value.length !== 10) {
                              setMobileError("Mobile number must be 10 digits");
                            } else {
                              setMobileError("");
                            }
                          }}
                          className={`w-full pl-10 py-3 border ${
                            mobileError ? "border-red-500" : "border-gray-300"
                          } rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all`}
                          placeholder="10-digit mobile number"
                          required
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      {mobileError && (
                        <p className="text-red-500 text-xs mt-1">
                          {mobileError}
                        </p>
                      )}
                    </div>

                    <div className="col-span-1">
                      <label
                        htmlFor="patientEmail"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="patientEmail"
                          value={newPatientEmail || ""}
                          onChange={(e) => setNewPatientEmail(e.target.value)}
                          className="w-full pl-10 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="patient@example.com"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label
                        htmlFor="patientAddress"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address
                      </label>
                      <div className="relative">
                        <textarea
                          id="patientAddress"
                          value={newPatientAddress || ""}
                          onChange={(e) => setNewPatientAddress(e.target.value)}
                          className="w-full pl-10 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Enter patient's address"
                          rows="2"
                        ></textarea>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewPatientForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewPatient}
                    className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-md"
                    disabled={isCreatingPatient || mobileError}
                  >
                    {isCreatingPatient ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Creating...
                      </>
                    ) : (
                      <>
                        <FaPlus className="mr-2" /> Create & Continue
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Select Doctor
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 2: Select a Doctor
            </h2>

            {patientDetails && (
              <div className="bg-primary-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-primary-800">
                  Selected Patient
                </h3>
                <div className="flex items-center mt-2">
                  <FaUser className="h-5 w-5 text-primary-600 mr-2" />
                  <span>
                    {patientDetails.name} - {patientDetails.mobile}
                  </span>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <FaSpinner className="animate-spin h-8 w-8 text-primary-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDoctor === doctor._id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                    onClick={() => setSelectedDoctor(doctor._id)}
                  >
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-3 rounded-full">
                        <FaUserMd className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                disabled={!selectedDoctor}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 3: // Select Service
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 3: Select a Service
            </h2>

            <div className="bg-primary-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-primary-800">
                Appointment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div className="flex items-center">
                  <FaUser className="h-5 w-5 text-primary-600 mr-2" />
                  <span>{patientDetails?.name}</span>
                </div>
                <div className="flex items-center">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-2" />
                  <span>
                    {doctorDetails?.name} - {doctorDetails?.specialization}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedService === service._id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                  onClick={() => setSelectedService(service._id)}
                >
                  <div className="flex items-center">
                    <div className="bg-primary-100 p-3 rounded-full">
                      <FaMedkit className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{service.name}</h3>
                        <span className="font-medium text-primary-600">
                          ₹{service.price}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {service.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Duration: {service.duration} minutes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                disabled={!selectedService}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 4: // Select Date and Time
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 4: Select Date and Time
            </h2>

            {/* Appointment Details - Redesigned with cards */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl mb-6 shadow-sm border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Appointment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 transform transition-transform hover:scale-105">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaUser className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Patient</p>
                    <p className="font-medium text-gray-800">
                      {patientDetails?.name}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 transform transition-transform hover:scale-105">
                  <div className="bg-green-100 p-2 rounded-full">
                    <FaUserMd className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Doctor</p>
                    <p className="font-medium text-gray-800">
                      {doctorDetails?.name}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 transform transition-transform hover:scale-105">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <FaMedkit className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Service</p>
                    <p className="font-medium text-gray-800">
                      {serviceDetails?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {serviceDetails?.duration} min · ₹{serviceDetails?.price}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date and Time Selection - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Select Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    min={minDate}
                    max={maxDateStr}
                    className="w-full p-3 pl-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                  />
                </div>

                {selectedDate && (
                  <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {selectedDoctor &&
                  !isDateAvailable(selectedDate) &&
                  selectedDate && (
                    <div className="mt-3 bg-red-50 p-3 rounded-lg flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-red-700 text-sm font-medium">
                        Doctor is not available on this day
                      </p>
                    </div>
                  )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Select Time
                </label>

                {isCheckingSlots ? (
                  <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center">
                      <FaSpinner className="animate-spin h-8 w-8 text-blue-500 mb-2" />
                      <p className="text-sm text-gray-500">
                        Checking available slots...
                      </p>
                    </div>
                  </div>
                ) : selectedDate && availableSlots.length > 0 ? (
                  <div className="space-y-5">
                    {/* Morning slots */}
                    {availableSlots.some(
                      (slot) => slot.period === "morning"
                    ) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="bg-yellow-100 p-1.5 rounded-full mr-2 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-yellow-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          Morning Slots
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots
                            .filter((slot) => slot.period === "morning")
                            .map((slot) => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedTime(slot.time)}
                                className={`relative p-3 text-sm font-medium rounded-lg transition-all transform ${
                                  selectedTime === slot.time
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105 hover:from-blue-600 hover:to-blue-700"
                                    : "bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                } ${
                                  slot.isAdminAdded
                                    ? "before:absolute before:w-1 before:h-full before:bg-green-500 before:left-0 before:top-0 before:rounded-l-lg"
                                    : ""
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon slots */}
                    {availableSlots.some(
                      (slot) => slot.period === "afternoon"
                    ) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="bg-orange-100 p-1.5 rounded-full mr-2 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-orange-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12A6 6 0 0010 4zm2 6a2 2 0 11-4 0 2 2 0 014 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                          Afternoon Slots
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots
                            .filter((slot) => slot.period === "afternoon")
                            .map((slot) => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedTime(slot.time)}
                                className={`relative p-3 text-sm font-medium rounded-lg transition-all transform ${
                                  selectedTime === slot.time
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105 hover:from-orange-600 hover:to-orange-700"
                                    : "bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                                } ${
                                  slot.isAdminAdded
                                    ? "before:absolute before:w-1 before:h-full before:bg-green-500 before:left-0 before:top-0 before:rounded-l-lg"
                                    : ""
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Evening slots */}
                    {availableSlots.some(
                      (slot) => slot.period === "evening"
                    ) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="bg-indigo-100 p-1.5 rounded-full mr-2 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-indigo-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                          </span>
                          Evening Slots
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots
                            .filter((slot) => slot.period === "evening")
                            .map((slot) => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedTime(slot.time)}
                                className={`relative p-3 text-sm font-medium rounded-lg transition-all transform ${
                                  selectedTime === slot.time
                                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg scale-105 hover:from-indigo-600 hover:to-indigo-700"
                                    : "bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                                } ${
                                  slot.isAdminAdded
                                    ? "before:absolute before:w-1 before:h-full before:bg-green-500 before:left-0 before:top-0 before:rounded-l-lg"
                                    : ""
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Legend for special slots */}
                    {availableSlots.some((slot) => slot.isAdminAdded) && (
                      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 flex items-center">
                          <span className="w-3 h-3 bg-green-500 rounded-sm mr-2"></span>
                          Special slots added by admin
                        </p>
                      </div>
                    )}
                  </div>
                ) : selectedDate ? (
                  <div className="flex flex-col items-center justify-center h-40 bg-red-50 rounded-lg p-6 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-red-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-red-700 font-medium">
                      No available slots for this date
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Please select another date
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-600">Please select a date first</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes Section - Redesigned */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                placeholder="Any specific concerns or information you want to share with the doctor"
              ></textarea>
            </div>

            {/* Navigation Buttons - Redesigned */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 font-medium transition-all hover:bg-gray-50 hover:border-gray-400"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className={`flex items-center px-6 py-2.5 rounded-lg shadow-md font-medium transition-all transform hover:scale-105 ${
                  !selectedDate || !selectedTime
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                }`}
                disabled={!selectedDate || !selectedTime}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 5: // Confirm
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 5: Confirm Appointment
            </h2>

            <div className="bg-primary-50 p-6 rounded-lg">
              <h3 className="font-medium text-primary-800 text-lg mb-4">
                Appointment Summary
              </h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FaUser className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Patient</p>
                    <p>
                      {patientDetails?.name} - {patientDetails?.mobile}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p>
                      {doctorDetails?.name} - {doctorDetails?.specialization}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaMedkit className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Service</p>
                    <p>{serviceDetails?.name}</p>
                    <p className="text-sm text-gray-600">
                      {serviceDetails?.description}
                    </p>
                    <p className="text-sm font-medium">
                      Price: ₹{serviceDetails?.price}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaCalendarAlt className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p>
                      {formatDate(selectedDate)} at {selectedTime}
                    </p>
                  </div>
                </div>

                {notes && (
                  <div className="flex items-start">
                    <FaCalendarAlt className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Additional Notes</p>
                      <p className="text-sm">{notes}</p>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This appointment will be marked as
                    confirmed and payment will be handled at the clinic.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" /> Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Book Appointment for Patient
        </h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "Select Patient", icon: FaUser },
              { step: 2, label: "Select Doctor", icon: FaUserMd },
              { step: 3, label: "Select Service", icon: FaMedkit },
              { step: 4, label: "Choose Slot", icon: FaCalendarAlt },
              { step: 5, label: "Confirm", icon: FaCheckCircle },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex flex-col items-center ${
                  step >= item.step ? "text-primary-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                    step >= item.step
                      ? "bg-primary-100 text-primary-600"
                      : "bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
            <div
              className="absolute top-0 left-0 h-1 bg-primary-500 transition-all"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </AdminLayout>
  );
}
