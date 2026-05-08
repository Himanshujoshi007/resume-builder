import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { SUBSCRIPTION_DAYS } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ role: 'admin', isActive: true, daysRemaining: null });
    }

    // Client subscription check
    let daysRemaining = 0;
    let isExpired = true;

    if (user.isActive && user.activatedAt) {
      const daysSinceActivation = Math.floor((Date.now() - user.activatedAt.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, SUBSCRIPTION_DAYS - daysSinceActivation);
      isExpired = daysSinceActivation >= SUBSCRIPTION_DAYS;

      // Auto-expire if past 30 days
      if (isExpired && user.isActive) {
        await db.user.update({ where: { id: user.id }, data: { isActive: false } });
      }
    }

    return NextResponse.json({
      role: 'client',
      isActive: user.isActive && !isExpired,
      daysRemaining,
      isExpired,
      activatedAt: user.activatedAt,
      totalDays: SUBSCRIPTION_DAYS,
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
  }
}
