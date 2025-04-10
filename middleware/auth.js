// middleware/auth.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export function withAuth(handler, allowedRoles = []) {
  return async (req, context = {}) => {
    try {
      // Check if request exists and has headers
      if (!req || !req.headers) {
        console.error('Invalid request object in auth middleware');
        return NextResponse.json(
          { error: 'Invalid request' },
          { status: 400 }
        );
      }

      // Get token from authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Missing or invalid authorization header');
        return NextResponse.json(
          { error: 'Authentication token is missing' },
          { status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        console.error('Empty token provided');
        return NextResponse.json(
          { error: 'Empty authentication token' },
          { status: 401 }
        );
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        console.error('Token verification error:', error.name);
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
        console.error('Invalid token payload, missing ID');
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        );
      }

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        console.error('User not found for token ID:', decoded.id);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // Check if user is active
      if (!user.isActive) {
        console.error('User account is inactive:', decoded.id);
        return NextResponse.json(
          { error: 'User account is inactive' },
          { status: 403 }
        );
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        console.error('User role not allowed:', user.role, 'Allowed roles:', allowedRoles);
        return NextResponse.json(
          { error: 'You do not have permission to access this resource' },
          { status: 403 }
        );
      }

      // For handling request bodies, create a wrapper around req.json
      // But we can't modify the req directly, so create a new object
      let requestBodyJson = null;

      // For POST/PUT/PATCH requests, try to read the body first
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.json) {
        try {
          // Clone the request so we can read the body without consuming the original
          const clonedRequest = req.clone();
          requestBodyJson = await clonedRequest.json();
        } catch (e) {
          console.error('Failed to pre-read request body:', e);
          // Continue without pre-reading
        }
      }
      
      // Create a modified request object with the user attached
      const requestWithUser = {
        ...req,
        user,
        params: context.params,
      };

      // If we successfully pre-read the body, add it as a property
      if (requestBodyJson !== null) {
        requestWithUser.bodyJson = requestBodyJson;
        
        // Also provide a custom json method that returns the pre-read body
        requestWithUser.json = async function() {
          return Promise.resolve(requestBodyJson);
        };
      }
      
      // Add user to context as well for safer access
      context.user = user;
      
      // If params exist in the context, make sure they're available
      if (req.params) {
        context.params = req.params;
      }
      
      // Call the handler with the modified request
      return handler(requestWithUser, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
