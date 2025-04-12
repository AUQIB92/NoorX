"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaHospital,
  FaMobile,
  FaCity,
  FaFlag,
  FaMapPin,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardLayout from "../../../../components/DashboardLayout";

// Create LoadingSpinner component inline since it's simple
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );
}

export default function LabsPage() {
  const router = useRouter();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    },
    contactInfo: {
      mobile: "",
      phone: "",
      email: "",
    },
    workingHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "17:00" },
      saturday: { open: "09:00", close: "13:00" },
      sunday: { open: "", close: "" },
    },
    isActive: true,
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");
  const [labDoctors, setLabDoctors] = useState([]);
  const [labServices, setLabServices] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Check if component is mounted
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch labs
  const fetchLabs = async () => {
    if (!mounted) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append("name", searchTerm);
      if (filterCity) params.append("city", filterCity);
      if (filterState) params.append("state", filterState);
      if (filterActive !== "") params.append("isActive", filterActive);

      const response = await fetch(`/api/labs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch labs");
      }

      console.log("Fetched labs data:", data.labs);
      setLabs(data.labs);
    } catch (error) {
      if (mounted) {
        console.error("Error fetching labs:", error);
        toast.error(error.message || "Failed to fetch labs");
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    if (mounted) {
      fetchLabs();
    }
  }, [mounted]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submission for adding a new lab
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      // Ensure mobile number is also set as phone for the API
      const formDataToSubmit = {
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          phone: formData.contactInfo.mobile, // Set phone field to mobile value
        },
        // Add these explicit fields
        location: formData.address.city || "",
        phone: formData.contactInfo.mobile || ""
      };
      
      const token = localStorage.getItem("token");
      const response = await fetch("/api/labs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataToSubmit),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add lab");
      }

      toast.success("Lab added successfully");
      setShowAddModal(false);
      setFormData({
        name: "",
        email: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "India",
        },
        contactInfo: {
          mobile: "",
          phone: "",
          email: "",
        },
        workingHours: {
          monday: { open: "09:00", close: "17:00" },
          tuesday: { open: "09:00", close: "17:00" },
          wednesday: { open: "09:00", close: "17:00" },
          thursday: { open: "09:00", close: "17:00" },
          friday: { open: "09:00", close: "17:00" },
          saturday: { open: "09:00", close: "13:00" },
          sunday: { open: "", close: "" },
        },
        isActive: true,
      });
      fetchLabs();
    } catch (error) {
      console.error("Error adding lab:", error);
      toast.error(error.message || "Failed to add lab");
    }
  };

  // Handle form submission for editing a lab
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      // Ensure mobile number is also set as phone for the API
      const formDataToSubmit = {
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          phone: formData.contactInfo.mobile, // Set phone field to mobile value
        },
        // Add these explicit fields
        location: formData.address.city || "",
        phone: formData.contactInfo.mobile || ""
      };
      
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/labs/${selectedLab._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataToSubmit),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lab");
      }

      toast.success("Lab updated successfully");
      setShowEditModal(false);
      fetchLabs();
    } catch (error) {
      console.error("Error updating lab:", error);
      toast.error(error.message || "Failed to update lab");
    }
  };

  // Handle lab deletion
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/labs/${selectedLab._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete lab");
      }

      toast.success("Lab deleted successfully");
      setShowDeleteModal(false);
      fetchLabs();
    } catch (error) {
      console.error("Error deleting lab:", error);
      toast.error(error.message || "Failed to delete lab");
    }
  };

  // Open edit modal and set form data
  const openEditModal = (lab) => {
    setSelectedLab(lab);
    setFormData({
      name: lab.name,
      email: lab.email,
      address: lab.address || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
      },
      contactInfo: {
        mobile: lab.contactInfo?.mobile || "",
        phone: lab.contactInfo?.mobile || lab.contactInfo?.phone || "",
        email: lab.contactInfo?.email || "",
      },
      workingHours: lab.workingHours || {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { open: "09:00", close: "13:00" },
        sunday: { open: "", close: "" },
      },
      isActive: lab.isActive,
    });
    setShowEditModal(true);
  };

  // Open delete modal and set selected lab
  const openDeleteModal = (lab) => {
    setSelectedLab(lab);
    setShowDeleteModal(true);
  };

  // Handle search and filter
  const handleSearch = (e) => {
    e.preventDefault();
    fetchLabs();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterCity("");
    setFilterState("");
    setFilterActive("");
    fetchLabs();
  };

  // Fetch lab details (doctors and services)
  const fetchLabDetails = async (labId) => {
    setLoadingDetails(true);
    try {
      // Fetch doctors for this lab
      const doctorsResponse = await fetch(`/api/labs/${labId}/doctors`);
      const doctorsData = await doctorsResponse.json();

      if (!doctorsResponse.ok) {
        throw new Error(doctorsData.error || "Failed to fetch lab doctors");
      }

      setLabDoctors(doctorsData.doctors);

      // Fetch services for this lab
      const servicesResponse = await fetch(`/api/labs/${labId}/services`);
      const servicesData = await servicesResponse.json();

      if (!servicesResponse.ok) {
        throw new Error(servicesData.error || "Failed to fetch lab services");
      }

      setLabServices(servicesData.services);
    } catch (error) {
      console.error("Error fetching lab details:", error);
      toast.error(error.message || "Failed to fetch lab details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open details modal
  const openDetailsModal = async (lab) => {
    setSelectedLab(lab);
    setShowDetailsModal(true);
    await fetchLabDetails(lab._id);
  };

  return (
    <DashboardLayout role="admin">
      <ToastContainer />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Labs</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md"
          >
            <FaPlus /> Add Lab
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchLabs();
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filter by city"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filter by state"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md"
              >
                <FaFilter />
              </button>
            </div>
          </form>
        </div>

        {/* Labs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : labs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No labs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
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
                  {labs.map((lab) => (
                    <tr key={lab._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lab.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{lab.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {lab.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {lab.phone || lab.contactInfo?.mobile || lab.contactInfo?.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lab.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {lab.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(lab)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLab(lab);
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
      </div>

      {/* Add Lab Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold text-primary-700 flex items-center">
                <FaPlus className="mr-2 text-primary-600" /> Add New Lab
              </h2>
              <p className="text-gray-500 mt-1">Create a new healthcare facility in the NoorX network</p>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Lab Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaHospital className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter lab name"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter email address"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMobile className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="contactInfo.mobile"
                      value={formData.contactInfo.mobile}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter mobile number"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Street Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    City
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCity className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    State
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFlag className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapPin className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      placeholder="Enter ZIP code"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" /> Add Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lab Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold text-primary-700 flex items-center">
                <FaEdit className="mr-2 text-primary-600" /> Edit Lab
              </h2>
              <p className="text-gray-500 mt-1">Update information for {formData.name}</p>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Lab Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaHospital className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter lab name"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter email address"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMobile className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="contactInfo.mobile"
                      value={formData.contactInfo.mobile}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter mobile number"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Street Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    City
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCity className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    State
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFlag className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapPin className="h-5 w-5 text-primary-500" />
                    </div>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      placeholder="Enter ZIP code"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaClock className="h-5 w-5 text-primary-500" />
                    </div>
                    <select
                      name="isActive"
                      value={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md transition-colors flex items-center"
                >
                  <FaEdit className="mr-2" /> Update Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lab Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="bg-red-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                <FaTrash className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Delete Lab</h2>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete <span className="font-semibold">{selectedLab?.name}</span>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center space-x-4 pt-4 border-t">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-md text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition-colors flex items-center"
              >
                <FaTrash className="mr-2" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
