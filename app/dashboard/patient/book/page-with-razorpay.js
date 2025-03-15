"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/DashboardLayout";
import {
  FaCalendarAlt,
  FaUserMd,
  FaClock,
  FaSpinner,
  FaMedkit,
  FaMoneyBillWave,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import useRazorpayPayment from "../../../../hooks/useRazorpayPayment";

export default function BookAppointment() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Doctor, 2: Service, 3: Slot, 4: Confirm
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);

  // Initialize Razorpay payment hook
  const { processPayment, isScriptLoaded } = useRazorpayPayment();

  // Get tomorrow's date as the minimum date for booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Get date 30 days from now as the maximum date for booking
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Fetch doctors
  const fetchDoctors = async () => {
    setIsLoading(true);
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
      console.error("Error fetching doctors:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch doctor details when a doctor is selected
  const fetchDoctorDetails = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/doctors/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok && data.doctor) {
        // Set doctor availability
        setDoctorAvailability(data.doctor.availability || []);
        // Set doctor details for payment processing
        setDoctorDetails(data.doctor);
      }
    } catch (error) {
      console.error("Error fetching doctor details:", error);
    }
  };

  // Fetch services for a doctor
  const fetchDoctorServices = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/doctors/${doctorId}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok) {
        setServices(data.services);
      } else {
        toast.error(data.error || "Failed to fetch services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  // Fetch service details when a service is selected
  const fetchServiceDetails = async (serviceId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok && data.service) {
        // Set service details for payment processing
        setServiceDetails(data.service);
      }
    } catch (error) {
      console.error("Error fetching service details:", error);
    }
  };

  // Check available slots for a doctor on a specific date
  const checkAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) {
      return;
    }

    setIsCheckingSlots(true);
    setAvailableSlots([]);
    setSelectedTime("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/doctors/${selectedDoctor}/slots?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      
      if (res.ok) {
        setAvailableSlots(data.slots || []);
        
        // If no slots are available, show a message
        if (data.slots.length === 0) {
          toast.info("No slots available for the selected date");
        }
      } else {
        toast.error(data.error || "Failed to fetch available slots");
      }
    } catch (error) {
      console.error("Error checking slots:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsCheckingSlots(false);
    }
  };

  // Handle doctor selection
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    setSelectedService("");
    setSelectedDate("");
    setSelectedTime("");
    setAvailableSlots([]);
    
    if (doctorId) {
      fetchDoctorDetails(doctorId);
      fetchDoctorServices(doctorId);
    } else {
      setDoctorDetails(null);
      setServices([]);
    }
  };

  // Handle service selection
  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);
    setSelectedDate("");
    setSelectedTime("");
    setAvailableSlots([]);
    
    if (serviceId) {
      fetchServiceDetails(serviceId);
    } else {
      setServiceDetails(null);
    }
  };

  // Handle date selection
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime("");
    setAvailableSlots([]);
    
    if (date) {
      checkAvailableSlots();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedService || !selectedDate || !selectedTime) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      
      // If payment method is cash, create appointment directly
      if (paymentMethod === "cash") {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            doctor_id: selectedDoctor,
            service_id: selectedService,
            date: selectedDate,
            time: selectedTime,
            notes,
            payment_method: paymentMethod,
            payment_amount: serviceDetails?.price || 0,
            booked_by: "patient",
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success("Appointment booked successfully");
          router.push("/dashboard/patient/appointments");
        } else {
          toast.error(data.error || "Failed to book appointment");
          setIsSubmitting(false);
        }
      } else {
        // For online payment, first create the appointment with pending payment status
        const appointmentRes = await fetch("/api/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            doctor_id: selectedDoctor,
            service_id: selectedService,
            date: selectedDate,
            time: selectedTime,
            notes,
            payment_method: "online",
            payment_amount: serviceDetails?.price || 0,
            payment_status: "pending",
            booked_by: "patient",
          }),
        });

        const appointmentData = await appointmentRes.json();

        if (!appointmentRes.ok) {
          toast.error(appointmentData.error || "Failed to book appointment");
          setIsSubmitting(false);
          return;
        }

        // Initiate Razorpay payment directly using our custom hook
        initiateRazorpayPayment(appointmentData.appointment);
      }
    } catch (error) {
      console.error("Book appointment error:", error);
      toast.error("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Function to initiate Razorpay payment
  const initiateRazorpayPayment = async (appointment) => {
    // Use the processPayment method from our custom hook
    processPayment({
      appointment,
      doctorDetails,
      serviceDetails,
      date: selectedDate,
      time: selectedTime,
      onSuccess: (data) => {
        toast.success("Payment successful! Appointment confirmed.");
        router.push("/dashboard/patient/appointments");
      },
      onError: (error) => {
        console.error("Payment error:", error);
        toast.error(error.message || "An error occurred during payment");
        setIsSubmitting(false);
      },
      onCancel: () => {
        toast.info("Payment cancelled. You can complete payment later.");
        router.push("/dashboard/patient/appointments");
        setIsSubmitting(false);
      }
    });
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

    // If we don't have availability data, just return true to allow selection
    // We'll check more thoroughly when they actually try to see slots
    if (!doctorAvailability || doctorAvailability.length === 0) {
      return true;
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = days[dayOfWeek];

    // Check if doctor is available on this day
    const isAvailable = doctorAvailability.some(
      (a) => a.day === dayName && a.is_available
    );

    return isAvailable;
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedDoctor) {
      toast.error("Please select a doctor");
      return;
    }

    if (step === 2 && !selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (step === 3 && (!selectedDate || !selectedTime)) {
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

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 1: Select a Doctor
            </h2>

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
                    onClick={() => {
                      setSelectedDoctor(doctor._id);
                      fetchDoctorDetails(doctor._id);
                      fetchDoctorServices(doctor._id);
                    }}
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

            <div className="flex justify-end mt-6">
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

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 2: Select a Service
            </h2>

            {doctorDetails && (
              <div className="bg-primary-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-primary-800">
                  Selected Doctor
                </h3>
                <div className="flex items-center mt-2">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-2" />
                  <span>
                    {doctorDetails.name} - {doctorDetails.specialization}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedService === service._id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                  onClick={() => {
                    setSelectedService(service._id);
                    fetchServiceDetails(service._id);
                  }}
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

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 3: Select Date and Time
            </h2>

            {doctorDetails && serviceDetails && (
              <div className="bg-primary-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-primary-800">
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center">
                    <FaUserMd className="h-5 w-5 text-primary-600 mr-2" />
                    <span>{doctorDetails.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaMedkit className="h-5 w-5 text-primary-600 mr-2" />
                    <span>{serviceDetails.name}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Select Date</span>
                </label>
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      className="input input-bordered w-full pl-10"
                      min={minDate}
                      max={maxDateStr}
                      value={selectedDate}
                      onChange={handleDateChange}
                    />
                    <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                {selectedDate && !isDateAvailable(selectedDate) && (
                  <p className="text-error text-sm mt-1">
                    Doctor is not available on this day
                  </p>
                )}
              </div>

              {selectedDate && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Select Time</span>
                  </label>
                  {isCheckingSlots ? (
                    <div className="flex justify-center py-4">
                      <FaSpinner className="animate-spin h-6 w-6 text-primary-500" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <div
                          key={slot._id}
                          className={`border rounded-md p-2 text-center cursor-pointer transition-all ${
                            selectedTime === slot.start_time
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 hover:border-primary-300"
                          }`}
                          onClick={() => setSelectedTime(slot.start_time)}
                        >
                          <div className="flex items-center justify-center">
                            <FaClock className="h-4 w-4 text-primary-600 mr-1" />
                            <span>{slot.start_time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No slots available for the selected date
                    </p>
                  )}
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notes (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Any specific concerns or information you'd like to share with the doctor"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
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
                onClick={handleNextStep}
                className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                disabled={!selectedDate || !selectedTime}
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Step 4: Confirm and Pay
            </h2>

            <div className="bg-primary-50 p-6 rounded-lg">
              <h3 className="font-medium text-primary-800 text-lg mb-4">
                Appointment Summary
              </h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FaUserMd className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p className="text-gray-700">
                      {doctorDetails?.name} - {doctorDetails?.specialization}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaMedkit className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Service</p>
                    <p className="text-gray-700">
                      {serviceDetails?.name} - ₹{serviceDetails?.price}
                    </p>
                    <p className="text-sm text-gray-600">
                      {serviceDetails?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FaCalendarAlt className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-gray-700">
                      {formatDate(selectedDate)} at {selectedTime}
                    </p>
                  </div>
                </div>

                {notes && (
                  <div className="flex items-start">
                    <div className="h-5 w-5 text-primary-600 mr-3 mt-0.5">
                      📝
                    </div>
                    <div>
                      <p className="font-medium">Notes</p>
                      <p className="text-gray-700">{notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Payment Method</span>
              </label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-md hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="radio radio-primary"
                  />
                  <span>Pay at Clinic (Cash)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-md hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="radio radio-primary"
                  />
                  <span>Pay Online (Razorpay)</span>
                </label>
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
                className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
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
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Book an Appointment
          </h1>

          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="w-full absolute top-1/2 h-0.5 bg-gray-200"></div>
              {[1, 2, 3, 4].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full ${
                    stepNumber === step
                      ? "bg-primary-600 text-white"
                      : stepNumber < step
                      ? "bg-primary-200 text-primary-800"
                      : "bg-gray-200 text-gray-600"
                  } z-10`}
                >
                  {stepNumber}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <div className="text-center w-1/4">Doctor</div>
              <div className="text-center w-1/4">Service</div>
              <div className="text-center w-1/4">Date & Time</div>
              <div className="text-center w-1/4">Confirm</div>
            </div>
          </div>

          <form>{renderStepContent()}</form>
        </div>
      </div>
    </DashboardLayout>
  );
} 