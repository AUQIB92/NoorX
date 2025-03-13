"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaUserMd,
  FaMobile,
  FaMapMarkerAlt,
  FaStethoscope,
  FaGraduationCap,
  FaArrowLeft,
} from "react-icons/fa";
import DashboardLayout from "../../../../../../components/DashboardLayout";
import { toast } from "react-toastify";

export default function EditDoctorPage({ params }) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    specialization: "",
    qualifications: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const doctorId = params.id;

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
    }
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/doctors/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({
          name: data.doctor.name || "",
          mobile: data.doctor.mobile || "",
          email: data.doctor.email || "",
          address: data.doctor.address || "",
          specialization: data.doctor.specialization || "",
          qualifications: data.doctor.qualifications || "",
        });
      } else {
        toast.error(data.error || "Failed to fetch doctor details");
        router.push("/dashboard/admin/doctors");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      router.push("/dashboard/admin/doctors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.email ||
      !formData.address ||
      !formData.specialization
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Doctor updated successfully");
        router.push(`/dashboard/admin/doctors/${doctorId}`);
      } else {
        toast.error(data.error || "Failed to update doctor");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center items-center h-full">
          <p>Loading doctor details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div>
        <div className="mb-6">
          <Link
            href={`/dashboard/admin/doctors/${doctorId}`}
            className="flex items-center text-primary-600 hover:text-primary-800"
          >
            <FaArrowLeft className="mr-2" /> Back to Doctor Details
          </Link>
          <h1 className="text-2xl font-bold mt-4">Edit Doctor</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserMd className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter doctor's full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mobile"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMobile className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Email will be used for appointment reminders and updates.
                </p>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-field pl-10 h-24"
                    placeholder="Enter address"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="specialization"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Specialization <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaStethoscope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="E.g., Cardiology, Dermatology, etc."
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="qualifications"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Qualifications
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="qualifications"
                    name="qualifications"
                    type="text"
                    value={formData.qualifications}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="E.g., MBBS, MD, etc."
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                href={`/dashboard/admin/doctors/${doctorId}`}
                className="btn-secondary mr-4"
              >
                Cancel
              </Link>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
