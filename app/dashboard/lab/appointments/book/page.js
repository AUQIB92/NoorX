"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchLabDoctors();
    fetchLabServices();
  }, []);

  // Fetch doctors for this lab
  const fetchLabDoctors = async () => {
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

  // Search for patients by mobile
  const searchPatients = async (query) => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }

    try {
      setIsLoadingPatients(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search patients");
      }

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error searching patients:", error);
      toast.error(error.message || "Failed to search patients");
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
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

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Only search if at least 3 characters
    if (query.length >= 3) {
      setIsSearching(true);
      searchPatients(query);
    } else {
      setPatients([]);
    }
  };

  // Handle patient selection
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery("");
    setPatients([]);
    setStep(2); // Move to doctor selection
  };

  // Handle doctor selection
  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(3); // Move to service selection
  };

  // Handle service selection
  const selectService = (service) => {
    setSelectedService(service);
    setStep(4); // Move to time slot selection
  };

  // Generate default slots for the selected doctor and date
  const generateDefaultSlots = async () => {
    if (!selectedDoctor || !selectedDate) {
      toast.error("Please select a doctor and date first");
      return;
    }

    try {
      setIsCheckingSlots(true);
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      // Now that labAdmin users have permission, we can directly call the slots API
      const response = await fetch(
        `/api/slots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            doctor_id: selectedDoctor._id
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(e => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Failed to generate slots: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.message === "Slots already exist for this doctor") {
        toast.info("Slots already exist for this doctor. Showing available slots...");
      } else {
        toast.success("Time slots generated successfully");
      }
      
      // Now fetch available slots for the selected date
      fetchAvailableSlotsForDate(selectedDate);
    } catch (error) {
      console.error("Error generating slots:", error);
      toast.error(error.message || "Failed to generate slots");
    } finally {
      setIsCheckingSlots(false);
    }
  };

  // Fetch available slots for a specific date
  const fetchAvailableSlotsForDate = async (date) => {
    if (!selectedDoctor || !date) {
      setAvailableSlots([]);
      return;
    }

    try {
      setIsCheckingSlots(true);
      const token = localStorage.getItem("token");
      
      const formattedDate = date; // The date is already in YYYY-MM-DD format
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = days[dayOfWeek];

      console.log("Fetching slots for doctor:", selectedDoctor._id, "day:", dayName);

      // First, get the doctor's slots for this day of week
      const slotsResponse = await fetch(
        `/api/slots?doctor_id=${selectedDoctor._id}&day=${dayName}&is_available=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!slotsResponse.ok) {
        const errorData = await slotsResponse.json().catch(e => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Failed to fetch doctor slots: ${slotsResponse.status}`);
      }

      const slotsData = await slotsResponse.json();
      console.log("Retrieved slots data:", slotsData);
      
      if (!slotsData.slots || slotsData.slots.length === 0) {
        setAvailableSlots([]);
        return;
      }
      
      // Then, get booked appointments for this date and doctor
      const appointmentsResponse = await fetch(
        `/api/appointments?doctor=${selectedDoctor._id}&date=${formattedDate}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!appointmentsResponse.ok) {
        const errorData = await appointmentsResponse.json().catch(e => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to fetch appointments");
      }

      const appointmentsData = await appointmentsResponse.json();
      console.log("Retrieved appointments data:", appointmentsData);
      
      // Extract booked times from appointments that are pending or confirmed
      const bookedTimes = appointmentsData.appointments
        .filter(app => app.status === "pending" || app.status === "confirmed")
        .map(app => app.time);

      console.log("Booked times:", bookedTimes);

      // Convert slot times to 12-hour format and filter out booked ones
      const availableSlotTimes = slotsData.slots
        .filter(slot => {
          // Check if this slot's time is not in bookedTimes
          const slotTime24h = slot.start_time;
          return !bookedTimes.some(bookedTime => {
            const bookedTime24h = bookedTime.split(':').slice(0, 2).join(':');
            return bookedTime24h === slotTime24h;
          });
        })
        .map(slot => {
          // Convert 24h time to 12h time
          const [hour, minute] = slot.start_time.split(':');
          const hour12 = (hour % 12) || 12;
          const ampm = hour < 12 ? 'AM' : 'PM';
          return `${hour12}:${minute.padStart(2, '0')} ${ampm}`;
        });

      console.log("Available slot times:", availableSlotTimes);
      setAvailableSlots(availableSlotTimes);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error(error.message || "Failed to fetch available slots");
      setAvailableSlots([]);
    } finally {
      setIsCheckingSlots(false);
    }
  };

  // Check available slots (modified to use the new function)
  const checkAvailableSlots = () => {
    fetchAvailableSlotsForDate(selectedDate);
  };

  // Handle date selection
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
    
    if (date) {
      fetchAvailableSlotsForDate(date);
    } else {
      setAvailableSlots([]);
    }
  };

  // Handle time selection
  const handleTimeSelection = (time) => {
    setSelectedTime(time);
  };

  // Book the appointment
  const bookAppointment = async () => {
    try {
      if (!selectedPatient || !selectedDoctor || !selectedService || !selectedDate || !selectedTime) {
        toast.error("Please complete all required selections");
        return;
      }

      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      // Convert the selected time from 12h to 24h format for the API
      const convert12to24 = (time12h) => {
        const [timePart, modifier] = time12h.split(' ');
        let [hours, minutes] = timePart.split(':');
        
        if (hours === '12') {
          hours = '00';
        }
        
        if (modifier === 'PM') {
          hours = parseInt(hours, 10) + 12;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      };

      const time24h = convert12to24(selectedTime);

      const appointmentData = {
        patient_id: selectedPatient._id,
        doctor_id: selectedDoctor._id,
        service_id: selectedService._id,
        date: selectedDate,
        time: time24h,
        notes: notes,
        lab_id: labId,
        booked_by: "admin", // This is booked by lab admin
        payment_method: "cash", // Default to cash for lab admin bookings
        payment_amount: selectedService.price || 0
      };

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      toast.success("Appointment booked successfully");
      
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

  // Update useEffect to fetch slots when doctor or date changes
  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchAvailableSlotsForDate(selectedDate);
    }
  }, [selectedDate, selectedDoctor]);

  // Step 4: Select Time Slot Content
  const renderSelectTimeSlotStep = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Step 4: Choose Appointment Slot</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            min={minDate}
            max={maxDateStr}
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>
        
        {selectedDate ? (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Available Time Slots</h3>
                <button
                  type="button"
                  onClick={generateDefaultSlots}
                  disabled={isCheckingSlots}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md
                    text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-teal-500"
                >
                  <FaPlus className="mr-1" size={12} />
                  Generate Slots
                </button>
              </div>
              
              {isCheckingSlots ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                  <span className="ml-2 text-gray-600">Checking available slots...</span>
                </div>
              ) : (
                <>
                  {availableSlots.length === 0 ? (
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <p className="text-yellow-700">
                        No slots available for this date. Click "Generate Slots" to create default time slots or select another date.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleTimeSelection(slot)}
                          className={`py-2 px-3 rounded-md text-sm font-medium ${
                            selectedTime === slot
                              ? "bg-teal-600 text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                  focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                rows="3"
                placeholder="Add any special instructions or notes for the appointment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </>
        ) : (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-700">
              Please select a date to view available time slots.
            </p>
          </div>
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