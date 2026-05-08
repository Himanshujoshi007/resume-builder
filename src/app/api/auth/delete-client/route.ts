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
      return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 400 });
    }

    await db.user.delete({ where: { id: clientId } });

    return NextResponse.json({
      success: true,
      message: `Client "${client.username}" deleted successfully`,
    });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
