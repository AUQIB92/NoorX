import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import Appointment from "../../../../models/Appointment";
import Service from "../../../../models/Service";
import { withAuth } from "../../../../middleware/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get admin dashboard statistics
async function getStats(req) {
  try {
    await connectToDatabase();

    // Count doctors
    const doctorsCount = await User.countDocuments({ role: "doctor" });

    // Get recent doctors (limit to 5)
    const recentDoctors = await User.find({ role: "doctor" })
      .select("name mobile specialization")
      .sort({ createdAt: -1 })
      .limit(5);

    // Count patients
    const patientsCount = await User.countDocuments({ role: "patient" });

    // Count appointments
    const appointmentsCount = await Appointment.countDocuments();

    // Count pending appointments
    const pendingAppointmentsCount = await Appointment.countDocuments({
      status: "pending",
    });

    // Count services
    const servicesCount = await Service.countDocuments();

    // Count active services
    const activeServicesCount = await Service.countDocuments({
      isActive: true,
    });

    // Count today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointmentsCount = await Appointment.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    return NextResponse.json(
      {
        stats: {
          doctors: doctorsCount,
          patients: patientsCount,
          appointments: appointmentsCount,
          pendingAppointments: pendingAppointmentsCount,
          services: servicesCount,
          activeServices: activeServicesCount,
          todayAppointments: todayAppointmentsCount,
        },
        recentDoctors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware (admin only)
export const GET = withAuth(getStats, ["admin"]);
