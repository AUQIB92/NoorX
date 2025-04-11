"use client";

import DashboardLayout from './DashboardLayout';

// This is a specialized DashboardLayout component that always uses the 'labAdmin' role
export default function LabDashboardLayout({ children }) {
  return <DashboardLayout role="labAdmin">{children}</DashboardLayout>;
} 