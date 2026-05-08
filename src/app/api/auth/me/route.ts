import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
