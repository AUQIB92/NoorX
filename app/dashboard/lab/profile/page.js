"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LabDashboardLayout from "../../../../components/LabDashboardLayout";
import {
  FaHospital,
  FaUserMd,
  FaFlask,
  FaCalendarCheck,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaSpinner,
  FaImage,
  FaInfoCircle,
  FaClipboard,
  FaCalendarAlt,
  FaEdit,
  FaSave,
  FaTimes
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Stat Card component
function StatCard({ icon: Icon, title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 border border-gray-100">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Info Card component
function InfoCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-lg bg-blue-100">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="ml-3 text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function LabProfile() {
  const router = useRouter();
  const [labData, setLabData] = useState(null);
  const [stats, setStats] = useState({
    doctors: 0,
    services: 0,
    appointments: 0,
    rating: 0,
    monthlyAppointments: 0,
    lastMonthAppointments: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    popularServices: [],
    recentAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    openingHours: "",
    website: "",
    founded: "",
    licenseNo: ""
  });

  useEffect(() => {
    fetchLabProfile();
  }, []);

  const fetchLabProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      if (!token || !labId) {
        toast.error("Please log in to access this page");
        router.push("/auth/login");
        return;
      }

      // Fetch lab details
      const labResponse = await fetch(`/api/labs/${labId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!labResponse.ok) {
        throw new Error("Failed to fetch lab details");
      }

      const labData = await labResponse.json();
      setLabData(labData.lab);
      
      // Setup form data for editing
      setFormData({
        name: labData.lab.name || "",
        email: labData.lab.email || "",
        phone: labData.lab.phone || "",
        address: labData.lab.address || "",
        description: labData.lab.description || "",
        openingHours: labData.lab.openingHours || "",
        website: labData.lab.website || "",
        founded: labData.lab.founded || "",
        licenseNo: labData.lab.licenseNo || ""
      });

      // Fetch lab stats
      const statsResponse = await fetch(`/api/labs/${labId}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          doctors: statsData.totalDoctors || 0,
          services: statsData.totalServices || 0,
          appointments: statsData.totalAppointments || 0,
          rating: statsData.averageRating || 0,
          monthlyAppointments: statsData.monthlyAppointments || 0,
          lastMonthAppointments: statsData.lastMonthAppointments || 0,
          monthlyRevenue: statsData.monthlyRevenue || 0,
          lastMonthRevenue: statsData.lastMonthRevenue || 0,
          popularServices: statsData.popularServices || [],
          recentAppointments: statsData.recentAppointments || []
        });
      }
    } catch (error) {
      console.error("Error fetching lab profile:", error);
      toast.error("Failed to load lab profile");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const labId = localStorage.getItem("labId");

      if (!token || !labId) {
        toast.error("Authentication required");
        return;
      }

      // Validate form data
      if (!formData.name || !formData.email || !formData.phone || !formData.address) {
        toast.error("Please fill all required fields");
        setSubmitting(false);
        return;
      }

      const response = await fetch(`/api/labs/${labId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lab profile");
      }

      toast.success("Lab profile updated successfully");
      setLabData(prev => ({...prev, ...formData}));
      setIsEditing(false);
      
      // Refresh data after update
      fetchLabProfile();
      
    } catch (error) {
      console.error("Error updating lab profile:", error);
      toast.error(error.message || "Failed to update lab profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LabDashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FaSpinner className="animate-spin h-8 w-8 mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading profile data...</p>
          </div>
        </div>
      </LabDashboardLayout>
    );
  }

  if (!labData) {
    return (
      <LabDashboardLayout>
        <div className="text-center p-8">
          <div className="bg-red-50 p-6 rounded-lg inline-block">
            <FaInfoCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Lab Data Not Found</h2>
            <p className="mt-2 text-gray-600">
              We couldn't find your lab profile. Please contact support.
            </p>
          </div>
        </div>
      </LabDashboardLayout>
    );
  }

  return (
    <LabDashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lab Profile</h1>
            <p className="text-gray-600 mt-2">View and manage your lab profile information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center"
          >
            {isEditing ? (
              <>
                <FaTimes className="mr-2" /> Cancel Editing
              </>
            ) : (
              <>
                <FaEdit className="mr-2" /> Update Info
              </>
            )}
          </button>
        </div>

        {/* Lab Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="bg-white p-3 rounded-lg shadow-md mb-4 md:mb-0 md:mr-6">
              <FaHospital className="h-16 w-16 text-blue-600" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold">{labData.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                  <span>{labData.address}</span>
                </div>
                <div className="flex items-center">
                  <FaPhone className="h-4 w-4 mr-2" />
                  <span>{labData.phone}</span>
                </div>
                <div className="flex items-center">
                  <FaEnvelope className="h-4 w-4 mr-2" />
                  <span>{labData.email}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center justify-center md:justify-end">
              <div className="bg-white text-blue-600 rounded-full px-4 py-2 flex items-center">
                <FaStar className="h-5 w-5 mr-1 text-yellow-500" />
                <span className="font-bold">{stats.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500 ml-1">Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaEdit className="mr-2 text-blue-600" /> Edit Lab Information
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lab Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Lab Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaHospital className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter lab name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="pl-10 py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter address"
                      required
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                {/* License Number */}
                <div>
                  <label htmlFor="licenseNo" className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    id="licenseNo"
                    name="licenseNo"
                    value={formData.licenseNo}
                    onChange={handleChange}
                    className="py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter license number"
                  />
                </div>

                {/* Founded Year */}
                <div>
                  <label htmlFor="founded" className="block text-sm font-medium text-gray-700 mb-1">
                    Founded Year
                  </label>
                  <input
                    type="text"
                    id="founded"
                    name="founded"
                    value={formData.founded}
                    onChange={handleChange}
                    className="py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 2010"
                  />
                </div>

                {/* Opening Hours */}
                <div className="md:col-span-2">
                  <label htmlFor="openingHours" className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    id="openingHours"
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleChange}
                    className="py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-2pm"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter description about your lab"
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Updating...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={FaUserMd}
            title="Total Doctors"
            value={stats.doctors}
            color="bg-blue-500"
          />
          <StatCard
            icon={FaFlask}
            title="Lab Services"
            value={stats.services}
            color="bg-teal-500"
          />
          <StatCard
            icon={FaCalendarCheck}
            title="Appointments"
            value={stats.appointments}
            color="bg-indigo-500"
          />
        </div>
        
        {/* Extended Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <FaCalendarAlt className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Monthly Statistics</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month's Appointments</span>
                <span className="font-bold text-gray-800">{stats.monthlyAppointments || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (stats.monthlyAppointments / (stats.lastMonthAppointments || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last Month: {stats.lastMonthAppointments || 0}</span>
                {stats.lastMonthAppointments > 0 && (
                  <span className={`font-medium ${stats.monthlyAppointments > stats.lastMonthAppointments ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.monthlyAppointments > stats.lastMonthAppointments ? '+' : ''}
                    {Math.round(((stats.monthlyAppointments - stats.lastMonthAppointments) / stats.lastMonthAppointments) * 100)}%
                  </span>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">This Month's Revenue</span>
                  <span className="font-bold text-gray-800">₹{stats.monthlyRevenue || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.monthlyRevenue / (stats.lastMonthRevenue || 1)) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Last Month: ₹{stats.lastMonthRevenue || 0}</span>
                  {stats.lastMonthRevenue > 0 && (
                    <span className={`font-medium ${stats.monthlyRevenue > stats.lastMonthRevenue ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.monthlyRevenue > stats.lastMonthRevenue ? '+' : ''}
                      {Math.round(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Popular Services */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-teal-100">
                <FaFlask className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Popular Services</h3>
            </div>
            
            {stats.popularServices && stats.popularServices.length > 0 ? (
              <div className="space-y-4">
                {stats.popularServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center">
                      <div className="bg-teal-50 p-2 rounded-lg mr-3">
                        <FaFlask className="h-5 w-5 text-teal-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{service.name}</p>
                        <p className="text-sm text-gray-500">₹{service.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-600">{service.count}</p>
                      <p className="text-xs text-gray-500">bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No service data available yet</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <FaCalendarCheck className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Recent Appointments</h3>
            </div>
            <button 
              onClick={() => router.push("/dashboard/lab/appointments")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          {stats.recentAppointments && stats.recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentAppointments.map((appointment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{appointment.patient_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.doctor_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.service_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.date).toLocaleDateString()} {appointment.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent appointments</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lab Information */}
          <InfoCard title="Lab Information" icon={FaInfoCircle}>
            <div className="flex border-b border-gray-100 pb-3">
              <div className="w-1/3 font-medium text-gray-600">Lab Name</div>
              <div className="w-2/3 text-gray-800">{labData.name}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3 pt-3">
              <div className="w-1/3 font-medium text-gray-600">Email</div>
              <div className="w-2/3 text-gray-800">{labData.email}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3 pt-3">
              <div className="w-1/3 font-medium text-gray-600">Phone</div>
              <div className="w-2/3 text-gray-800">{labData.phone}</div>
            </div>
            <div className="flex border-b border-gray-100 pb-3 pt-3">
              <div className="w-1/3 font-medium text-gray-600">Address</div>
              <div className="w-2/3 text-gray-800">{labData.address}</div>
            </div>
            <div className="flex pt-3">
              <div className="w-1/3 font-medium text-gray-600">Status</div>
              <div className="w-2/3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${labData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {labData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </InfoCard>

          {/* Opening Hours */}
          <InfoCard title="Opening Hours" icon={FaClock}>
            {labData.openingHours ? (
              <>
                <div className="flex border-b border-gray-100 pb-3">
                  <div className="w-1/3 font-medium text-gray-600">Monday</div>
                  <div className="w-2/3 text-gray-800">
                    {labData.openingHours.monday ? `${labData.openingHours.monday.open} - ${labData.openingHours.monday.close}` : 'Closed'}
                  </div>
                </div>
                <div className="flex border-b border-gray-100 pb-3 pt-3">
                  <div className="w-1/3 font-medium text-gray-600">Tuesday</div>
                  <div className="w-2/3 text-gray-800">
                    {labData.openingHours.tuesday ? `${labData.openingHours.tuesday.open} - ${labData.openingHours.tuesday.close}` : 'Closed'}
                  </div>
                </div>
                <div className="flex border-b border-gray-100 pb-3 pt-3">
                  <div className="w-1/3 font-medium text-gray-600">Wednesday</div>
                  <div className="w-2/3 text-gray-800">
                    {labData.openingHours.wednesday ? `${labData.openingHours.wednesday.open} - ${labData.openingHours.wednesday.close}` : 'Closed'}
                  </div>
                </div>
                <div className="flex border-b border-gray-100 pb-3 pt-3">
                  <div className="w-1/3 font-medium text-gray-600">Thursday</div>
                  <div className="w-2/3 text-gray-800">
                    {labData.openingHours.thursday ? `${labData.openingHours.thursday.open} - ${labData.openingHours.thursday.close}` : 'Closed'}
                  </div>
                </div>
                <div className="flex border-b border-gray-100 pb-3 pt-3">
                  <div className="w-1/3 font-medium text-gray-600">Friday</div>
                  <div className="w-2/3 text-gray-800">
                    {labData.openingHours.friday ? `${labData.openingHours.friday.open} - ${labData.openingHours.friday.close}` : 'Closed'}
                  </div>
                </div>
                <div className="flex border-b border-gray-100 pb-3 pt-3">
                  <div className="w-1/3 font-medium text-gray-600">Saturday</div>
                  <div className="w-2/3 text-gray-800">
                    {labData.openingHours.saturday ? `${labData.openingHours.saturday.open} - ${labData.openingHours.saturday.close}` : 'Closed'}
                  </div>
                </div>
                <div className="flex pt-3">
                  <div className="w-1/3 font-medium text-gray-600">Sunday</div>
                  <div className="w-2/3 text-gray-800">
                    {labData.openingHours.sunday ? `${labData.openingHours.sunday.open} - ${labData.openingHours.sunday.close}` : 'Closed'}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-500 italic">No opening hours information available</div>
            )}
          </InfoCard>
        </div>

        {/* Lab Description */}
        {labData.description && (
          <div className="mt-8">
            <InfoCard title="About the Lab" icon={FaClipboard}>
              <div className="prose max-w-none text-gray-700">
                <p>{labData.description}</p>
              </div>
            </InfoCard>
          </div>
        )}

        {/* Lab Images */}
        {labData.images && labData.images.length > 0 && (
          <div className="mt-8">
            <InfoCard title="Lab Images" icon={FaImage}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {labData.images.map((image, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden h-48">
                    <img
                      src={image.url}
                      alt={image.caption || `Lab image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                        {image.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </InfoCard>
          </div>
        )}

        <ToastContainer />
      </div>
    </LabDashboardLayout>
  );
} 