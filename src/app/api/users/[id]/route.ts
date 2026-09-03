import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, username, password, role, isActive } = body;

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const updateData: any = {};

    if (name) updateData.name = name.trim();
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername !== user.username) {
        const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (existing) {
          return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
        }
        updateData.username = cleanUsername;
      }
    }

    if (password && password.trim().length >= 4) {
      updateData.passwordHash = bcrypt.hashSync(password.trim(), 10);
    }

    if (role && (role === 'ADMIN' || role === 'ENTRY_USER')) {
      updateData.role = role;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    console.error('User PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}