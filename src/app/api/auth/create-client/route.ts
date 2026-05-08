import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import { getSession } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 });
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'client',
        isActive: false, // starts OFF, admin must turn on
        activatedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
        activatedAt: user.activatedAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
