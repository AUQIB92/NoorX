export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { withAuth } from "@/middleware/auth";
import Appointment from "@/models/Appointment";
import Lab from "@/models/Lab";
import Doctor from "@/models/Doctor";
import User from "@/models/User";

async function handler(req) {
  try {
    await dbConnect();

    // Get counts
    const [
      totalAppointments,
      totalLabs,
      totalDoctors,
      totalPatients
    ] = await Promise.all([
      Appointment.countDocuments(),
      Lab.countDocuments(),
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' })
    ]);

    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patient_id', 'name email')
      .populate('doctor_id', 'name specialization')
      .populate('lab_id', 'name location')
      .lean();

    // Get appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      stats: {
        totalAppointments,
        totalLabs,
        totalDoctors,
        totalPatients,
        recentAppointments,
        appointmentsByStatus: appointmentsByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ['admin']);
