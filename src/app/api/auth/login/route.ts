import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compare } from 'bcryptjs';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Check subscription status for clients
    if (user.role === 'client') {
      if (!user.isActive || !user.activatedAt) {
        return NextResponse.json({ error: 'Your subscription has expired. Please contact the administrator.' }, { status: 403 });
      }
      const daysSinceActivation = Math.floor((Date.now() - user.activatedAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActivation >= 30) {
        // Auto-expire: deactivate the user
        await db.user.update({ where: { id: user.id }, data: { isActive: false } });
        return NextResponse.json({ error: 'Your subscription has expired. Please contact the administrator.' }, { status: 403 });
      }
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'client',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        activatedAt: user.activatedAt,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
