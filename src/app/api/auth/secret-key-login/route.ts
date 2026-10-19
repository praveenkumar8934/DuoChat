import { NextResponse } from 'next/server';

/**
 * SEC-03 Remediation:
 * Passwordless Secret Key bypass is disabled.
 * All logins require proper user identification (email or username) and password.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Secret Key passwordless login has been disabled for security. Please sign in using your account ID (email or username) and password.',
    },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed. Authentication requires username/email and password.',
    },
    { status: 405 }
  );
}
