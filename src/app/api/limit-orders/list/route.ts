import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');
    const userId = searchParams.get('userId');
    const telegramId = searchParams.get('telegramId');
    const status = searchParams.get('status') || 'active';

    if (!walletAddress && !userId && !telegramId) {
      return NextResponse.json({
        success: false,
        error: 'Must provide walletAddress, userId, or telegramId'
      }, { status: 400 });
    }

    const where: Prisma.LimitOrderWhereInput = {};
    if (walletAddress) where.walletAddress = walletAddress;
    if (userId) where.userId = userId;
    if (telegramId) where.telegramId = telegramId;
    if (status) where.status = status;

    const orders = await prisma.limitOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error listing limit orders:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list limit orders'
    }, { status: 500 });
  }
}

