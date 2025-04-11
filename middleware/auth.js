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

      // Get the authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new NextResponse(
          JSON.stringify({ error: 'No token provided' }),
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user has required role
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized access' }),
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
      context = {
        ...context,
        user: {
          id: decoded.userId,
          role: decoded.role,
        },
      };

      // Call the handler with the authenticated context
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
      console.error('Auth middleware error:', error);

      if (error.name === 'JsonWebTokenError') {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid token' }),
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
          JSON.stringify({ error: 'Token expired' }),
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
        JSON.stringify({ error: 'Authentication error' }),
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
