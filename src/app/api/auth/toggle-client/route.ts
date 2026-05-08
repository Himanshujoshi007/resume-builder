import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 });
    }

    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const client = await db.user.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (client.role !== 'client') {
      return NextResponse.json({ error: 'Cannot toggle admin accounts' }, { status: 400 });
    }

    // If turning ON, set activatedAt to now (reset countdown)
    // If turning OFF, clear activatedAt
    const newIsActive = !client.isActive;
    const newActivatedAt = newIsActive ? new Date() : null;

    const updated = await db.user.update({
      where: { id: clientId },
      data: {
        isActive: newIsActive,
        activatedAt: newActivatedAt,
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: updated.id,
        username: updated.username,
        isActive: updated.isActive,
        activatedAt: updated.activatedAt,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error('Toggle client error:', error);
    return NextResponse.json({ error: 'Failed to toggle client' }, { status: 500 });
  }
}
