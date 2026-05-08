import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({ where: { role: 'admin' } });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin account already exists' });
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026';

    const hashedPassword = await hash(adminPassword, 12);

    await db.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        activatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: `Admin created: ${adminUsername}` });
  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 });
  }
}
