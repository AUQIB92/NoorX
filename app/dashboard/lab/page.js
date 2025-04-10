"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaUserMd,
  FaFlask,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaChartLine,
  FaCalendarCheck,
  FaUserClock,
  FaTimes,
  FaHospital,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "../../../components/DashboardLayout";

// Create LoadingSpinner component inline since it's simple
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );
}

export default function LabDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [labData, setLabData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showDeleteDoctorModal, setShowDeleteDoctorModal] = useState(false);
  const [showDeleteServiceModal, setShowDeleteServiceModal] = useState(false);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: "",
    specialization: "",
    experience: "",
    qualification: "",
    email: "",
    phone: "",
    isActive: true,
  });
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    isActive: true,
  });
  const [labFormData, setLabFormData] = useState({
    name: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Fetch lab data and associated doctors/services
  const fetchLabData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let labId; // Declare labId in the outer scope

      if (!token) {
        console.error("No authentication token found");
        toast.error("Please log in to access this page");
        router.push("/auth/login");
        return;
      }

      // Validate token format
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        if (!payload.id || !payload.role) {
          throw new Error("Invalid token payload");
        }

        if (payload.role !== 'labAdmin') {
          throw new Error("Unauthorized access - Not a lab admin");
        }

        // First fetch the user to get their lab ID
        const userResponse = await fetch(`/api/users/${payload.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("labId");
            throw new Error("Session expired. Please log in again");
          }
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();

        // Find the lab associated with this user
        const labsResponse = await fetch(
          `/api/labs?email=${encodeURIComponent(userData.user.email)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );

        if (!labsResponse.ok) {
          throw new Error("Failed to fetch lab data");
        }

        const labsData = await labsResponse.json();

        if (!labsData.labs || labsData.labs.length === 0) {
          throw new Error("No lab found for this user");
        }

        labId = labsData.labs[0]._id; // Assign to the outer scope variable
        localStorage.setItem("labId", labId);

        // Fetch lab details
        const labResponse = await fetch(`/api/labs/${labId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!labResponse.ok) {
          throw new Error("Failed to fetch lab details");
        }

        const labData = await labResponse.json();
        setLabData(labData.lab);

      } catch (tokenError) {
        console.error("Token validation error:", tokenError);
        localStorage.removeItem("token");
        localStorage.removeItem("labId");
        toast.error(tokenError.message || "Authentication failed. Please log in again");
        router.push("/auth/login");
        return;
      }

      // Get labId from localStorage as fallback
      if (!labId) {
        labId = localStorage.getItem("labId");
        if (!labId) {
          throw new Error("Lab ID not found");
        }
      }

      // Fetch doctors
      const doctorsResponse = await fetch(`/api/labs/${labId}/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const doctorsData = await doctorsResponse.json();

      if (!doctorsResponse.ok) {
        throw new Error(doctorsData.error || "Failed to fetch doctors");
      }

      setDoctors(doctorsData.doctors);

      // Fetch services
      const servicesResponse = await fetch(`/api/labs/${labId}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const servicesData = await servicesResponse.json();

      if (!servicesResponse.ok) {
        throw new Error(servicesData.error || "Failed to fetch services");
      }

      setServices(servicesData.services);
    } catch (error) {
      console.error("Error fetching lab data:", error);
      toast.error(error.message || "Failed to fetch lab data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  // Handle doctor form input change
  const handleDoctorInputChange = (e) => {
    const { name, value } = e.target;
    setDoctorFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle service form input change
  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setServiceFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle lab form input change
  const handleLabInputChange = (e) => {
    const { name, value } = e.target;
    setLabFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle adding a new doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch(`/api/labs/${labId}/doctors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(doctorFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add doctor");
      }

      toast.success("Doctor added successfully");
      setShowAddDoctorModal(false);
      setDoctorFormData({
        name: "",
        specialization: "",
        experience: "",
        qualification: "",
        email: "",
        phone: "",
        isActive: true,
      });
      fetchLabData();
    } catch (error) {
      console.error("Error adding doctor:", error);
      toast.error(error.message || "Failed to add doctor");
    }
  };

  // Handle adding a new service
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch(`/api/labs/${labId}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serviceFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add service");
      }

      toast.success("Service added successfully");
      setShowAddServiceModal(false);
      setServiceFormData({
        name: "",
        description: "",
        price: "",
        duration: "",
        isActive: true,
      });
      fetchLabData();
    } catch (error) {
      console.error("Error adding service:", error);
      toast.error(error.message || "Failed to add service");
    }
  };

  // Handle adding a new lab
  const handleAddLab = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/labs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...labFormData,
          address: {
            street: labFormData.address,
            city: labFormData.city,
            state: labFormData.state,
            zipCode: labFormData.zipCode,
          },
          contactInfo: {
            phone: labFormData.phone,
            mobile: labFormData.mobile,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add lab");
      }

      toast.success("Lab added successfully");
      setShowAddLabModal(false);
      setLabFormData({
        name: "",
        email: "",
        phone: "",
        mobile: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
      });
      fetchLabData();
    } catch (error) {
      console.error("Error adding lab:", error);
      toast.error(error.message || "Failed to add lab");
    }
  };

  // Handle editing a doctor
  const handleEditDoctor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch(
        `/api/labs/${labId}/doctors/${selectedDoctor._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(doctorFormData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update doctor");
      }

      toast.success("Doctor updated successfully");
      setShowEditDoctorModal(false);
      fetchLabData();
    } catch (error) {
      console.error("Error updating doctor:", error);
      toast.error(error.message || "Failed to update doctor");
    }
  };

  // Handle editing a service
  const handleEditService = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch(
        `/api/labs/${labId}/services/${selectedService._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(serviceFormData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update service");
      }

      toast.success("Service updated successfully");
      setShowEditServiceModal(false);
      fetchLabData();
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error(error.message || "Failed to update service");
    }
  };

  // Handle deleting a doctor
  const handleDeleteDoctor = async () => {
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch(
        `/api/labs/${labId}/doctors/${selectedDoctor._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete doctor");
      }

      toast.success("Doctor deleted successfully");
      setShowDeleteDoctorModal(false);
      fetchLabData();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error(error.message || "Failed to delete doctor");
    }
  };

  // Handle deleting a service
  const handleDeleteService = async () => {
    try {
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      const response = await fetch(
        `/api/labs/${labId}/services/${selectedService._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete service");
      }

      toast.success("Service deleted successfully");
      setShowDeleteServiceModal(false);
      fetchLabData();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(error.message || "Failed to delete service");
    }
  };

  // Open edit doctor modal
  const openEditDoctorModal = (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      experience: doctor.experience,
      qualification: doctor.qualification,
      email: doctor.email,
      phone: doctor.phone,
      isActive: doctor.isActive,
    });
    setShowEditDoctorModal(true);
  };

  // Open edit service modal
  const openEditServiceModal = (service) => {
    setSelectedService(service);
    setServiceFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      isActive: service.isActive,
    });
    setShowEditServiceModal(true);
  };

  return (
    <DashboardLayout role="labAdmin">
      <div className="container mx-auto p-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {labData?.name || "Lab Dashboard"}
          </h1>
          <p className="text-gray-600">
            Manage your laboratory, doctors, and services
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              onClick={() => setShowAddDoctorModal(true)}
              className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm border border-blue-100 h-full group transition-all hover:shadow-md">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                  <FaPlus className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Add New Doctor</h3>
                <p className="text-gray-600 text-center">Add a new doctor to your lab</p>
              </div>
            </div>

            <div 
              onClick={() => setShowAddServiceModal(true)}
              className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl shadow-sm border border-green-100 h-full group transition-all hover:shadow-md">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                  <FaPlus className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Add Service</h3>
                <p className="text-gray-600">Add a new diagnostic service</p>
              </div>
            </div>

            <div 
              onClick={() => setShowAddLabModal(true)}
              className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl shadow-sm border border-amber-100 h-full group transition-all hover:shadow-md">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                  <FaHospital className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Add New Lab</h3>
                <p className="text-gray-600">Add a new diagnostic laboratory</p>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("doctors")}
              className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-purple-100 h-full group transition-all hover:shadow-md">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                  <FaUserMd size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Manage Doctors</h3>
                <p className="text-gray-600">View and manage lab doctors</p>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("services")}
              className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl shadow-sm border border-orange-100 h-full group transition-all hover:shadow-md">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                  <FaFlask size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Manage Services</h3>
                <p className="text-gray-600">View and manage lab services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaUserMd className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Doctors</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {doctors.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaFlask className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Services</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {services.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FaCalendarCheck className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Today's Appointments</p>
                <p className="text-2xl font-semibold text-gray-800">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FaChartLine className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-800">₹0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Lab Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <FaMapMarkerAlt className="h-5 w-5 text-gray-500 mt-1" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-800">
                  {labData?.address?.street}, {labData?.address?.city},{" "}
                  {labData?.address?.state} - {labData?.address?.zipCode}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <FaPhone className="h-5 w-5 text-gray-500 mt-1" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Contact</p>
                <p className="text-gray-800">{labData?.contactInfo?.phone}</p>
              </div>
            </div>
            <div className="flex items-start">
              <FaEnvelope className="h-5 w-5 text-gray-500 mt-1" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800">{labData?.email}</p>
              </div>
            </div>
            <div className="flex items-start">
              <FaClock className="h-5 w-5 text-gray-500 mt-1" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Working Hours</p>
                <p className="text-gray-800">
                  Mon-Fri: {labData?.workingHours?.monday?.open} -{" "}
                  {labData?.workingHours?.monday?.close}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("doctors")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "doctors"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Doctors
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === "services"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Services
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {/* Doctors Tab */}
                {activeTab === "doctors" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div
                        onClick={() => setShowAddDoctorModal(true)}
                        className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm border border-blue-100 h-full group transition-all hover:shadow-md">
                          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                            <FaPlus className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-800">Add New Doctor</h3>
                          <p className="text-gray-600 text-center">Add a new doctor to your lab</p>
                        </div>
                      </div>

                      {doctors.map((doctor) => (
                        <div
                          key={doctor._id}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                              <FaUserMd className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">
                                {doctor.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>{doctor.specialization}</span>
                                <span>•</span>
                                <span>{doctor.experience} years exp.</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => openEditDoctorModal(doctor)}
                              className="text-teal-600 hover:text-teal-800 focus:outline-none"
                            >
                              <FaEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowDeleteDoctorModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 focus:outline-none"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Tab */}
                {activeTab === "services" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div
                        onClick={() => setShowAddServiceModal(true)}
                        className="transform transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm border border-blue-100 h-full group transition-all hover:shadow-md">
                          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
                            <FaPlus className="h-8 w-8" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-800">Add New Service</h3>
                          <p className="text-gray-600 text-center">Add a new service to your lab</p>
                        </div>
                      </div>

                      {services.map((service) => (
                        <div
                          key={service._id}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                              <FaFlask className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">
                                {service.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>{service.duration} mins</span>
                                <span>•</span>
                                <span>₹{service.price}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => openEditServiceModal(service)}
                              className="text-teal-600 hover:text-teal-800 focus:outline-none"
                            >
                              <FaEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedService(service);
                                setShowDeleteServiceModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 focus:outline-none"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recent Appointments */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          Recent Appointments
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-500 text-center py-4">
                            No recent appointments
                          </p>
                        </div>
                      </div>

                      {/* Upcoming Services */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          Popular Services
                        </h3>
                        <div className="space-y-4">
                          {services.slice(0, 5).map((service) => (
                            <div
                              key={service._id}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {service.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {service.duration} mins
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-800">
                                ₹{service.price}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg">
            <button
              onClick={() => setShowAddDoctorModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center">
                <FaUserMd className="h-8 w-8 text-teal-600" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">Add New Doctor</h2>
              <p className="mt-2 text-sm text-gray-500">Please fill in the doctor's information below</p>
            </div>

            <form onSubmit={handleAddDoctor} className="mt-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUserMd className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={doctorFormData.name}
                      onChange={handleDoctorInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFlask className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="specialization"
                      value={doctorFormData.specialization}
                      onChange={handleDoctorInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Cardiology"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUserClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="experience"
                      value={doctorFormData.experience}
                      onChange={handleDoctorInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Years of experience"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUserMd className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="qualification"
                      value={doctorFormData.qualification}
                      onChange={handleDoctorInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="MBBS, MD"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={doctorFormData.email}
                      onChange={handleDoctorInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="doctor@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={doctorFormData.phone}
                      onChange={handleDoctorInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg">
            <button
              onClick={() => setShowAddServiceModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center">
                <FaFlask className="h-8 w-8 text-teal-600" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">Add New Service</h2>
              <p className="mt-2 text-sm text-gray-500">Please fill in the service details below</p>
            </div>

            <form onSubmit={handleAddService} className="mt-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFlask className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={serviceFormData.name}
                      onChange={handleServiceInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Service Name"
                      required
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <textarea
                    name="description"
                    value={serviceFormData.description}
                    onChange={handleServiceInputChange}
                    className="w-full rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Service Description"
                    rows="3"
                    required
                  ></textarea>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">₹</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={serviceFormData.price}
                      onChange={handleServiceInputChange}
                      className="pl-8 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Price"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="duration"
                      value={serviceFormData.duration}
                      onChange={handleServiceInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Duration (minutes)"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {showDeleteDoctorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete Dr. {selectedDoctor?.name}? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDoctorModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoctor}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete {selectedService?.name}? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteServiceModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lab Modal */}
      {showAddLabModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-8 w-full max-w-2xl bg-white rounded-xl shadow-lg">
            <button
              onClick={() => setShowAddLabModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center">
                <FaHospital className="h-8 w-8 text-teal-600" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">Add New Lab</h2>
              <p className="mt-2 text-sm text-gray-500">Please fill in the lab information below</p>
            </div>

            <form onSubmit={handleAddLab} className="mt-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="labName" className="block text-sm font-medium text-gray-700 mb-1">Lab Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaHospital className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="labName"
                      name="name"
                      value={labFormData.name}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="XYZ Diagnostics"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={labFormData.email}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="lab@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={labFormData.phone}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={labFormData.mobile}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={labFormData.address}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={labFormData.city}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Mumbai"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={labFormData.state}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={labFormData.zipCode}
                      onChange={handleLabInputChange}
                      className="pl-10 w-full h-12 rounded-md border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Add Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </DashboardLayout>
  );
}
