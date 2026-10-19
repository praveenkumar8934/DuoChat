import { NextResponse } from 'next/server';

/**
 * SEC-04 Remediation:
 * Prevent public user enumeration and DoS via auth.admin.listUsers().
 * Public user existence probing is disabled.
 */
export async function POST() {
  return NextResponse.json(
    {
      exists: false,
      message: 'Public account enumeration is disabled for privacy and security.',
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed.',
    },
    { status: 405 }
  );
}
