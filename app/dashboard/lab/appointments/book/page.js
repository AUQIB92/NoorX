"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../../components/DashboardLayout";
import {
  FaCalendarAlt,
  FaUserMd,
  FaUser,
  FaClock,
  FaSpinner,
  FaFlask,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaPlus,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import TimeSlotPicker from "../../../../../components/TimeSlotPicker";

export default function LabBookAppointment() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Select Patient, 2: Select Doctor, 3: Select Service, 4: Select Slot, 5: Confirm
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Get tomorrow's date as the minimum date for booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate());
  const minDate = tomorrow.toISOString().split("T")[0];

  // Get date 30 days from now as the maximum date for booking
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Add a slots cache to prevent redundant API calls
  const [slotsCache, setSlotsCache] = useState({});

  // Add cache for patient search results
  const [patientSearchCache, setPatientSearchCache] = useState({});
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchLabDoctors();
    fetchLabServices();
    
    // Cleanup function to run on unmount
    return () => {
      // Clear any pending timeouts
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);
  
  useEffect(() => {
    let isMounted = true;
    
    if (selectedDate && selectedDoctor) {
      checkAvailableSlots()
        .then(() => {
          // Only update state if component is still mounted
          if (!isMounted) return;
        })
        .catch(error => {
          if (!isMounted) return;
          console.error("Error checking slots:", error);
        });
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedDoctor]);

  // Fetch doctors for this lab
  const fetchLabDoctors = async () => {
    // Don't fetch if we already have doctors data
    if (doctors.length > 0) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      if (!token || !labId) {
        toast.error("Please log in to access this page");
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/labs/${labId}/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'default' // Allow caching since doctor data doesn't change frequently
      });

      if (!response.ok) {
        throw new Error("Failed to fetch doctors");
      }

      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error(error.message || "Failed to fetch doctors");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch services for this lab
  const fetchLabServices = async () => {
    // Don't fetch if we already have services data
    if (services.length > 0) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      if (!token || !labId) {
        return;
      }

      const response = await fetch(`/api/labs/${labId}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'default' // Allow caching since service data doesn't change frequently
      });

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error(error.message || "Failed to fetch services");
    }
  };

  // Search for patients by mobile with debouncing and caching
  const searchPatients = async (query) => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }

    // Check cache first
    if (patientSearchCache[query]) {
      console.log("Using cached patient search results");
      setPatients(patientSearchCache[query]);
      setIsLoadingPatients(false);
      setIsSearching(false);
      return;
    }

    try {
      setIsLoadingPatients(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error("Failed to search patients");
      }

      const data = await response.json();
      const results = data.patients || [];
      
      // Cache the results
      setPatientSearchCache(prev => ({
        ...prev,
        [query]: results
      }));
      
      setPatients(results);
    } catch (error) {
      console.error("Error searching patients:", error);
      toast.error(error.message || "Failed to search patients");
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Only search if at least 3 characters
    if (query.length >= 3) {
      setIsSearching(true);
      
      // Set a new timeout to delay the API call
      const newTimeout = setTimeout(() => {
        searchPatients(query);
      }, 300); // 300ms debounce delay
      
      setSearchTimeout(newTimeout);
    } else {
      setPatients([]);
      setIsSearching(false);
    }
  };

  // Create a new patient
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!newPatientData.name || !newPatientData.mobile) {
        toast.error("Name and mobile number are required");
        return;
      }

      // Validate mobile number format (10 digits)
      if (!/^\d{10}$/.test(newPatientData.mobile)) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }

      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPatientData.name,
          mobile: newPatientData.mobile,
          email: newPatientData.email,
          address: newPatientData.address,
          role: "patient"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create patient");
      }

      toast.success("Patient created successfully");
      setSelectedPatient(data.patient);
      setShowNewPatientForm(false);
      setStep(2); // Move to doctor selection step
      
      // Reset the form
      setNewPatientData({
        name: "",
        mobile: "",
        email: "",
        address: ""
      });
    } catch (error) {
      console.error("Error creating patient:", error);
      toast.error(error.message || "Failed to create patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle patient form input change
  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatientData({
      ...newPatientData,
      [name]: value,
    });
  };

  // Handle patient selection
  const selectPatient = (patient) => {
    if (selectedPatient && selectedPatient._id === patient._id) return; // Prevent redundant updates
    setSelectedPatient(patient);
    setSearchQuery("");
    setPatients([]);
    setStep(2); // Move to doctor selection
  };

  // Handle doctor selection
  const selectDoctor = (doctor) => {
    if (selectedDoctor && selectedDoctor._id === doctor._id) return; // Prevent redundant updates
    setSelectedDoctor(doctor);
    
    // Reset date and time when doctor changes
    setSelectedDate("");
    setSelectedTime("");
    setSelectedSlotId("");
    setAvailableSlots([]);
    
    setStep(3); // Move to service selection
  };

  // Handle service selection
  const selectService = (service) => {
    if (selectedService && selectedService._id === service._id) return; // Prevent redundant updates
    setSelectedService(service);
    setStep(4); // Move to time slot selection
  };

  // Handle date selection - update to use checkAvailableSlots
  const handleDateChange = (e) => {
    const date = e.target.value;
    if (date === selectedDate) return; // Prevent redundant updates
    
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
    setSelectedSlotId(""); // Reset slot ID when date changes
    
    if (date && selectedDoctor) {
      checkAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  };

  // Handle time selection with memoization to prevent re-renders
  const handleTimeSelection = useCallback((time, slotId) => {
    if (time === selectedTime) return; // Prevent redundant updates
    console.log("Selected time:", time, "Selected slot ID:", slotId);
    setSelectedTime(time);
    setSelectedSlotId(slotId);
  }, [selectedTime]);

  // Check available slots - replacing the simplified version with the same approach as admin
  const checkAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) {
      setAvailableSlots([]);
      return Promise.resolve();
    }

    // Check if we have cached results for this doctor/date combination
    const cacheKey = `${selectedDoctor._id}_${selectedDate}`;
    if (slotsCache[cacheKey]) {
      console.log("Using cached slots data");
      setAvailableSlots(slotsCache[cacheKey]);
      return Promise.resolve();
    }

    setIsCheckingSlots(true);
    // Clear available slots while checking to prevent displaying old data
    setAvailableSlots([]);
    console.log("Checking available slots for date:", selectedDate);

    try {
      // First, get all booked appointments for this date and doctor
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");
      
      if (!labId) {
        toast.error("Lab ID not found. Please log in again.");
        return Promise.reject(new Error("Lab ID not found"));
      }
      
      const bookingsRes = await fetch(
        `/api/appointments?doctor=${selectedDoctor._id}&date=${selectedDate}&labId=${labId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let bookedTimes = [];
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        // Extract booked times in 24h format (HH:MM)
        bookedTimes = bookingsData.appointments
          .filter(app => app.status === "pending" || app.status === "confirmed")
          .map(app => app.time.split(':').slice(0, 2).join(':'));
        
        console.log("Booked time slots:", bookedTimes);
      }

      // Fetch all slots for this doctor and date directly from the API
      const slotsRes = await fetch(
        `/api/doctors/${selectedDoctor._id}/slots?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // Add cache control headers
          cache: 'no-store'
        }
      );

      let availableTimeSlots = [];

      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        console.log("Slots data received:", slotsData);

        // Process all slots (both regular weekly and admin-added)
        availableTimeSlots = slotsData.slots
          .filter((slot) => {
            // Check if the slot is available and not already booked
            const slotTime = slot.start_time.split(':').slice(0, 2).join(':');
            const isAvailable = slot.is_available && !slot.booked_by;
            const isNotBooked = !bookedTimes.includes(slotTime);
            return isAvailable && isNotBooked;
          })
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
              time: `${formattedHour}:${minute.toString().padStart(2, "0")} ${ampm}`,
              rawTime: `${hours}:${minutes}`,
              isAdminAdded: slot.date !== null,
              period: hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening",
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
        
        // Deduplicate slots by time
        const uniqueSlotsMap = new Map();
        availableTimeSlots.forEach(slot => {
          if (!uniqueSlotsMap.has(slot.time)) {
            uniqueSlotsMap.set(slot.time, slot);
          }
        });
        
        const uniqueTimeSlots = Array.from(uniqueSlotsMap.values());

        console.log("Final available time slots:", uniqueTimeSlots);
        
        // Cache the results
        setSlotsCache(prev => ({
          ...prev,
          [cacheKey]: uniqueTimeSlots
        }));
        
        setAvailableSlots(uniqueTimeSlots);
      } else {
        console.error("Failed to fetch slots from API");
        toast.error("Failed to load available slots");
        setAvailableSlots([]);
      }

      // Return a resolved promise at the end
      return Promise.resolve();
    } catch (error) {
      console.error("Error checking available slots:", error);
      toast.error("Failed to load available slots");
      setAvailableSlots([]);
      return Promise.reject(error);
    } finally {
      setIsCheckingSlots(false);
    }
  };

  // Book the appointment with optimized error handling
  const bookAppointment = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      if (!selectedPatient || !selectedDoctor || !selectedService || !selectedDate || !selectedTime || !selectedSlotId) {
        toast.error("Please complete all required selections");
        return;
      }

      setIsSubmitting(true);
      
      // Get and verify token
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      const labId = localStorage.getItem("labId");
      if (!labId) {
        toast.error("Lab ID not found. Please log in again.");
        return;
      }

      // First, verify that the slot is still available
      const verifyRes = await fetch(
        `/api/appointments?doctor=${selectedDoctor._id}&date=${selectedDate}&labId=${labId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store' // Prevent caching for this critical verification
        }
      );

      if (!verifyRes.ok) {
        throw new Error("Failed to verify slot availability");
      }

      const verifyData = await verifyRes.json();
      
      // Get the raw time (HH:MM) format from the selected time (12h format)
      const selectedSlot = availableSlots.find(slot => slot.time === selectedTime);
      if (!selectedSlot) {
        throw new Error("Selected time slot information not found");
      }

      if (!selectedSlotId) {
        throw new Error("No slot ID found for the selected time");
      }
      
      // Get the most up-to-date booked times
      const bookedTimes = verifyData.appointments
        .filter((app) => app.status === "pending" || app.status === "confirmed")
        .map((app) => app.time.split(':').slice(0, 2).join(':'));
        
      // Check if the selected time is now booked
      const isTimeBooked = bookedTimes.some(bookedTime => {
        return bookedTime === selectedSlot.rawTime.split(':').slice(0, 2).join(':');
      });

      if (isTimeBooked) {
        toast.error(
          "This slot has just been booked by someone else. Please select another time."
        );
        // Refresh available slots
        checkAvailableSlots();
        setIsSubmitting(false);
        return;
      }

      // Create appointment with service_type and slot_id
      const appointmentData = {
        patient_id: selectedPatient._id,
        doctor_id: selectedDoctor._id,
        service_id: String(selectedService._id),
        service_type: "lab",
        date: selectedDate,
        time: selectedSlot.rawTime,
        notes: notes || "",
        lab_id: labId,
        booked_by: "labAdmin",
        payment_method: "cash",
        payment_status: "completed",
        payment_amount: selectedService.price || 0,
        payment_id: "N/A",
        razorpay_order_id: "N/A",
        razorpay_signature: "N/A",
        slot_id: selectedSlotId // Include the selected slot ID
      };

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      toast.success("Appointment booked successfully");
      
      // Update the cache to remove the booked slot
      const cacheKey = `${selectedDoctor._id}_${selectedDate}`;
      if (slotsCache[cacheKey]) {
        const updatedSlots = slotsCache[cacheKey].filter(slot => slot.id !== selectedSlotId);
        setSlotsCache(prev => ({
          ...prev,
          [cacheKey]: updatedSlots
        }));
      }
      
      // Redirect to appointments page
      setTimeout(() => {
        router.push("/dashboard/lab/appointments");
      }, 2000);
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation between steps
  const goToNextStep = () => {
    if (step === 1 && !selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }
    
    if (step === 2 && !selectedDoctor) {
      toast.error("Please select a doctor first");
      return;
    }
    
    if (step === 3 && !selectedService) {
      toast.error("Please select a service first");
      return;
    }
    
    if (step === 4 && (!selectedDate || !selectedTime)) {
      toast.error("Please select both date and time");
      return;
    }
    
    setStep(step + 1);
  };

  const goToPrevStep = () => {
    setStep(step - 1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Step 1: Select Patient Content
  const renderSelectPatientStep = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Step 1: Select a Patient</h2>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Select Existing Patient</h3>
            <button
              onClick={() => setShowNewPatientForm(!showNewPatientForm)}
              className="flex items-center text-teal-600 hover:text-teal-700"
            >
              <FaPlus className="mr-1" /> 
              Add New Patient
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white 
                placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Search by mobile number"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          {isLoadingPatients && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          )}
          
          {/* Display search results */}
          {!isLoadingPatients && patients.length > 0 && (
            <div className="mt-4 bg-gray-50 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  onClick={() => selectPatient(patient)}
                >
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm text-gray-600">
                    <span className="inline-block mr-3">{patient.mobile}</span>
                    {patient.email && <span>{patient.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.length >= 3 && !isLoadingPatients && patients.length === 0 && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              No patients found with this mobile number. 
              <button 
                className="ml-2 text-blue-700 underline"
                onClick={() => setShowNewPatientForm(true)}
              >
                Add a new patient
              </button>
            </div>
          )}
        </div>
        
        {/* Add new patient form */}
        {showNewPatientForm && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Add New Patient</h3>
            <form onSubmit={handleCreatePatient}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={newPatientData.name}
                      onChange={handleNewPatientChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                        placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="mobile"
                      value={newPatientData.mobile}
                      onChange={handleNewPatientChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                        placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={newPatientData.email}
                      onChange={handleNewPatientChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                        placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={newPatientData.address}
                      onChange={handleNewPatientChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                        placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="123 Main St, City"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 
                    bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin mr-2" /> Creating...
                    </span>
                  ) : (
                    "Create Patient"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => router.push("/dashboard/lab/appointments")}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 
              bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 mr-2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedPatient) {
                setStep(2);
              } else {
                toast.error("Please select or create a patient first");
              }
            }}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 
              flex items-center"
            disabled={!selectedPatient}
          >
            Next <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    );
  };

  // Step 2: Select Doctor Content
  const renderSelectDoctorStep = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Step 2: Select a Doctor</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            <span className="ml-2 text-gray-600">Loading doctors...</span>
          </div>
        ) : (
          <>
            {doctors.length === 0 ? (
              <div className="text-center py-8 bg-red-50 rounded-md">
                <p className="text-red-600">No doctors found for this lab. Please add doctors first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => selectDoctor(doctor)}
                    className={`p-4 border rounded-md cursor-pointer transition-all hover:shadow-md
                      ${
                        selectedDoctor && selectedDoctor._id === doctor._id
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                  >
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <FaUserMd className="h-6 w-6 text-teal-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-800">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        <p className="text-xs text-gray-500">{doctor.qualification}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            onClick={goToPrevStep}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 
              bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
              flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <button
            onClick={goToNextStep}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 
              flex items-center"
            disabled={!selectedDoctor}
          >
            Next <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    );
  };

  // Step 3: Select Service Content
  const renderSelectServiceStep = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Step 3: Select a Service</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            <span className="ml-2 text-gray-600">Loading services...</span>
          </div>
        ) : (
          <>
            {services.length === 0 ? (
              <div className="text-center py-8 bg-red-50 rounded-md">
                <p className="text-red-600">No services found for this lab. Please add services first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {services.map((service) => (
                  <div
                    key={service._id}
                    onClick={() => selectService(service)}
                    className={`p-4 border rounded-md cursor-pointer transition-all hover:shadow-md
                      ${
                        selectedService && selectedService._id === service._id
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                          <FaFlask className="h-6 w-6 text-teal-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-800">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-600">₹{service.price}</p>
                        <p className="text-sm text-gray-500">{service.duration} mins</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            onClick={goToPrevStep}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 
              bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
              flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <button
            onClick={goToNextStep}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 
              flex items-center"
            disabled={!selectedService}
          >
            Next <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    );
  };

  // Step 4: Select Time Slot Content
  const renderSelectTimeSlotStep = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Step 4: Choose Appointment Slot
        </h2>

        {/* Appointment Details Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-4 flex items-center">
            <FaCalendarAlt className="h-5 w-5 mr-2" />
            Appointment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaUser className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Patient</p>
                <p className="text-gray-900">{selectedPatient?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaUserMd className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Doctor</p>
                <p className="text-gray-900">{selectedDoctor?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaFlask className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Service</p>
                <p className="text-gray-900">{selectedService?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-gray-900">{selectedService?.duration} minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
            >
              <FaCalendarAlt className="h-5 w-5 mr-2 text-blue-500" />
              Select Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={minDate}
                max={maxDateStr}
                className="w-full p-3 pl-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>

            {selectedDate && (
              <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center">
                  <FaCalendarAlt className="h-4 w-4 mr-1" />
                  {formatDate(selectedDate)}
                </p>
              </div>
            )}

            {selectedDoctor && !availableSlots.length && selectedDate && !isCheckingSlots && (
              <div className="mt-3 bg-red-50 p-3 rounded-lg flex items-center">
                <FaCalendarAlt className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 text-sm font-medium">
                  No available slots on this day. Please try another date.
                </p>
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <label
              htmlFor="time"
              className="block text-sm font-medium text-gray-700 mb-3 flex items-center"
            >
              <FaClock className="h-5 w-5 mr-2 text-blue-500" />
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
            ) : selectedDate ? (
              <TimeSlotPicker
                availableSlots={availableSlots}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelection}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FaCalendarAlt className="mx-auto text-gray-400 text-3xl mb-3" />
                <h3 className="text-lg font-medium text-gray-700">Select a date</h3>
                <p className="text-gray-500 mt-2">
                  Please select a date to view available appointment slots.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any special instructions or notes for the appointment"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={goToPrevStep}
            className="flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 font-medium transition-all hover:bg-gray-50 hover:border-gray-400"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <button
            type="button"
            onClick={goToNextStep}
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
  };

  // Step 5: Confirmation Content
  const renderConfirmationStep = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Step 5: Confirm Appointment</h2>
        
        <div className="bg-gray-50 p-6 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-4 text-teal-700">Appointment Summary</h3>
          
          <div className="space-y-4">
            <div className="flex border-b pb-3">
              <div className="w-1/3 font-medium text-gray-600">Patient</div>
              <div className="w-2/3">
                <div className="font-medium">{selectedPatient.name}</div>
                <div className="text-sm text-gray-600">{selectedPatient.mobile}</div>
                {selectedPatient.email && <div className="text-sm text-gray-600">{selectedPatient.email}</div>}
              </div>
            </div>
            
            <div className="flex border-b pb-3">
              <div className="w-1/3 font-medium text-gray-600">Doctor</div>
              <div className="w-2/3">
                <div className="font-medium">{selectedDoctor.name}</div>
                <div className="text-sm text-gray-600">{selectedDoctor.specialization}</div>
              </div>
            </div>
            
            <div className="flex border-b pb-3">
              <div className="w-1/3 font-medium text-gray-600">Service</div>
              <div className="w-2/3">
                <div className="font-medium">{selectedService.name}</div>
                <div className="text-sm text-gray-600">
                  ₹{selectedService.price} · {selectedService.duration} mins
                </div>
              </div>
            </div>
            
            <div className="flex border-b pb-3">
              <div className="w-1/3 font-medium text-gray-600">Schedule</div>
              <div className="w-2/3">
                <div className="font-medium">{formatDate(selectedDate)}</div>
                <div className="text-sm text-gray-600">Time: {selectedTime}</div>
              </div>
            </div>
            
            {notes && (
              <div className="flex">
                <div className="w-1/3 font-medium text-gray-600">Notes</div>
                <div className="w-2/3">
                  <div className="text-sm text-gray-600">{notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-teal-50 p-4 rounded-md mb-6">
          <p className="text-teal-700 flex items-center">
            <FaCheckCircle className="h-5 w-5 mr-2" />
            Please review the appointment details before confirming.
          </p>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            onClick={goToPrevStep}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 
              bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
              flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <button
            onClick={bookAppointment}
            disabled={isSubmitting}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 
              flex items-center"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Booking...
              </>
            ) : (
              <>
                Confirm Appointment
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="labAdmin">
      <div className="container max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Book Appointment for Patient
        </h1>
        
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex flex-col items-center ${step >= 1 ? "text-teal-600" : "text-gray-400"}`}>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 
                ${step >= 1 ? "border-teal-600 bg-teal-50" : "border-gray-300"}`}>
                <FaUser className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Select Patient</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step > 1 ? "bg-teal-600" : "bg-gray-300"}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 2 ? "text-teal-600" : "text-gray-400"}`}>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2
                ${step >= 2 ? "border-teal-600 bg-teal-50" : "border-gray-300"}`}>
                <FaUserMd className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Select Doctor</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step > 2 ? "bg-teal-600" : "bg-gray-300"}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 3 ? "text-teal-600" : "text-gray-400"}`}>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2
                ${step >= 3 ? "border-teal-600 bg-teal-50" : "border-gray-300"}`}>
                <FaFlask className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Select Service</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step > 3 ? "bg-teal-600" : "bg-gray-300"}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 4 ? "text-teal-600" : "text-gray-400"}`}>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2
                ${step >= 4 ? "border-teal-600 bg-teal-50" : "border-gray-300"}`}>
                <FaCalendarAlt className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Choose Slot</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step > 4 ? "bg-teal-600" : "bg-gray-300"}`}></div>
            
            <div className={`flex flex-col items-center ${step >= 5 ? "text-teal-600" : "text-gray-400"}`}>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2
                ${step >= 5 ? "border-teal-600 bg-teal-50" : "border-gray-300"}`}>
                <FaCheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Step content */}
        <div>
          {step === 1 && renderSelectPatientStep()}
          {step === 2 && renderSelectDoctorStep()}
          {step === 3 && renderSelectServiceStep()}
          {step === 4 && renderSelectTimeSlotStep()}
          {step === 5 && renderConfirmationStep()}
        </div>
        
        <ToastContainer />
      </div>
    </DashboardLayout>
  );
} 