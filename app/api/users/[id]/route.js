import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { withAuth } from "../../../../middleware/auth";

// GET /api/users/[id] - Get a specific user
async function getUser(req, { params }) {
  try {
    await connectToDatabase();

    const user = await User.findById(params.id).select("-password -otp");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getUser, [
  "admin",
  "labAdmin",
  "doctor",
  "patient",
]);
