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

export default function LabDoctorsManagement() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [showDeleteDoctorModal, setShowDeleteDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: "",
    specialization: "",
    experience: "",
    qualification: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");

  // Fetch doctors for the lab
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      if (!token || !labId) {
        toast.error(
          "Authentication information not found. Please log in again."
        );
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/labs/${labId}/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch doctors");
      }

      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error(error.message || "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle doctor form input change
  const handleDoctorInputChange = (e) => {
    const { name, value } = e.target;
    setDoctorFormData((prev) => ({
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
        address: "",
        isActive: true,
      });
      fetchDoctors();
    } catch (error) {
      console.error("Error adding doctor:", error);
      toast.error(error.message || "Failed to add doctor");
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
      fetchDoctors();
    } catch (error) {
      console.error("Error updating doctor:", error);
      toast.error(error.message || "Failed to update doctor");
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
      fetchDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error(error.message || "Failed to delete doctor");
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
      address: doctor.address || "",
      isActive: doctor.isActive,
    });
    setShowEditDoctorModal(true);
  };

  // Filter doctors based on search term and specialization
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSpecialization = filterSpecialization
      ? doctor.specialization === filterSpecialization
      : true;
    return matchesSearch && matchesSpecialization;
  });

  // Get unique specializations for filter dropdown
  const specializations = [
    ...new Set(doctors.map((doctor) => doctor.specialization)),
  ];

  return (
    <DashboardLayout role="labAdmin">
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Manage Doctors
          </h1>
          <p className="text-gray-600">
            Add, edit, or remove doctors from your laboratory
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
              >
                <option value="">All Specializations</option>
                {specializations.map((spec, index) => (
                  <option key={index} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
              >
                <FaPlus className="mr-2" /> Add Doctor
              </button>
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : filteredDoctors.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No doctors found.</p>
              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Your First Doctor
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Doctor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Specialization
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Experience
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
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
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUserMd className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {doctor.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doctor.qualification}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.specialization}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.experience} years
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doctor.phone}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doctor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            doctor.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {doctor.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditDoctorModal(doctor)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowDeleteDoctorModal(true);
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

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Add New Doctor</h2>
            <form onSubmit={handleAddDoctor}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={doctorFormData.name}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={doctorFormData.specialization}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={doctorFormData.experience}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Qualification
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={doctorFormData.qualification}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={doctorFormData.email}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={doctorFormData.phone}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={doctorFormData.address}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditDoctorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Doctor</h2>
            <form onSubmit={handleEditDoctor}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={doctorFormData.name}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={doctorFormData.specialization}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={doctorFormData.experience}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Qualification
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={doctorFormData.qualification}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={doctorFormData.email}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={doctorFormData.phone}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={doctorFormData.address}
                    onChange={handleDoctorInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditDoctorModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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

      <ToastContainer />
    </DashboardLayout>
  );
}
