// middleware/auth.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export function withAuth(handler, allowedRoles = []) {
  return async (req, context) => {
    try {
      // Set cache control headers
      const headers = new Headers();
      headers.set('Cache-Control', 'no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');

      // Log request details
      console.log('Auth middleware processing request:', {
        url: req.url,
        method: req.method,
        allowedRoles
      });

      // Get the authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('No token provided or invalid token format');
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...Object.fromEntries(headers)
            }
          }
        );
      }

      // Extract and verify the token
      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        if (!process.env.JWT_SECRET) {
          console.error('JWT_SECRET is not defined in environment variables');
          throw new Error('Server configuration error');
        }
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully');
      } catch (error) {
        console.error('Token verification failed:', error.message);
        if (error.name === 'TokenExpiredError') {
          return new NextResponse(
            JSON.stringify({ error: 'Token has expired' }),
            { 
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(headers)
              }
            }
          );
        }
        return new NextResponse(
          JSON.stringify({ error: 'Invalid token' }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...Object.fromEntries(headers)
            }
          }
        );
      }

      // Check if user has required role
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        console.error('User role not authorized:', {
          userRole: decoded.role,
          allowedRoles
        });
        return new NextResponse(
          JSON.stringify({ error: 'You do not have permission to access this resource' }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...Object.fromEntries(headers)
            }
          }
        );
      }

      // Add user info to context
      console.log('Adding user info to context:', {
        userId: decoded.userId || decoded.id,
        role: decoded.role,
        hasLab: !!decoded.lab
      });
      
      // Attach the user to both context and req
      req.user = {
        id: decoded.userId || decoded.id, // Handle both formats
        role: decoded.role,
        email: decoded.email,
        lab: decoded.lab
      };
      
      // Also add to context for handlers that use it
      context.user = req.user;

      // Call the handler with the authenticated context
      console.log('Authentication successful, proceeding to handler');
      const response = await handler(req, context);
      
      // Add cache control headers to the response
      const newHeaders = new Headers(response.headers);
      headers.forEach((value, key) => {
        newHeaders.set(key, value);
      });

      // Return response with updated headers
      return new NextResponse(response.body, {
        status: response.status,
        headers: newHeaders,
      });

    } catch (error) {
      console.error("Auth middleware error:", error);

      // Handle specific error types
      if (error.name === 'JsonWebTokenError') {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid token format' }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          }
        );
      }

      if (error.name === 'TokenExpiredError') {
        return new NextResponse(
          JSON.stringify({ error: 'Token has expired' }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          }
        );
      }

      return new NextResponse(
        JSON.stringify({ 
          error: 'Authentication error',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
  };
}
