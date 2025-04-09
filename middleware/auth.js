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
          { error: 'Authentication token is missing' },
          { status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return NextResponse.json(
            { error: 'Token has expired' },
            { status: 401 }
          );
        }
        if (error.name === 'JsonWebTokenError') {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }
        throw error;
      }

      if (!decoded || !decoded.id) {
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        );
      }

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'User account is inactive' },
          { status: 403 }
        );
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'You do not have permission to access this resource' },
          { status: 403 }
        );
      }

      // Add user to request context
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
