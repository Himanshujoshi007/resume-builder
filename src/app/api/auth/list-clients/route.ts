import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { SUBSCRIPTION_DAYS } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 });
    }

    const clients = await db.user.findMany({
      where: { role: 'client' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        isActive: true,
        activatedAt: true,
        createdAt: true,
      },
    });

    // Compute days remaining for each client
    const clientsWithCountdown = clients.map(client => {
      let daysRemaining = 0;
      let isExpired = false;

      if (client.isActive && client.activatedAt) {
        const daysSinceActivation = Math.floor((Date.now() - client.activatedAt.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, SUBSCRIPTION_DAYS - daysSinceActivation);
        if (daysSinceActivation >= SUBSCRIPTION_DAYS) {
          isExpired = true;
        }
      }

      return {
        ...client,
        daysRemaining,
        isExpired,
      };
    });

    return NextResponse.json({ clients: clientsWithCountdown });
  } catch (error) {
    console.error('List clients error:', error);
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 });
  }
}
