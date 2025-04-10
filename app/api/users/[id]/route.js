import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import { withAuth } from "../../../../middleware/auth";

// GET /api/users/[id] - Get a specific user
async function getUser(req, context) {
  try {
    await connectToDatabase();

    // Ensure context and params exist
    if (!context || !context.params || !context.params.id) {
      console.error("Missing params.id in context");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const userId = context.params.id;
    const user = await User.findById(userId).select("-password -otp");
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

// Add additional error handling wrapper
export async function GET_errorHandled(req) {
  try {
    return await GET(req);
  } catch (error) {
    console.error("Unhandled GET error in users/[id] route:", error);
    return NextResponse.json(
      { error: "Internal server error in GET handler" },
      { status: 500 }
    );
  }
}
