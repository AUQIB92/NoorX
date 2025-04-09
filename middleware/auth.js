// middleware/auth.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export function withAuth(handler, allowedRoles = []) {
  return async (req, context) => {
    try {
      // Get token from authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Get user from token
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Not authorized to access this resource' },
          { status: 403 }
        );
      }

      // Add user to request
      context.user = user;

      // Call the handler
      return handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
