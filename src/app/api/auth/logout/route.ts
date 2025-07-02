import { NextResponse } from 'next/server';

export async function POST() {
  // Clear the session cookie by setting it to empty and expired
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('next-auth.session-token', '', { path: '/', expires: new Date(0) });
  response.cookies.set('__Secure-next-auth.session-token', '', { path: '/', expires: new Date(0) });
  response.cookies.set('next-auth.callback-url', '', { path: '/', expires: new Date(0) });
  return response;
} 