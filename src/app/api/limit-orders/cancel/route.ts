import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { orderId, walletAddress } = await req.json();

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'orderId is required'
      }, { status: 400 });
    }

    // Find the order
    const order = await prisma.limitOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Limit order not found'
      }, { status: 404 });
    }

    // Verify ownership if walletAddress is provided
    if (walletAddress && order.walletAddress !== walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: This order does not belong to the provided wallet'
      }, { status: 403 });
    }

    // Only cancel active orders
    if (order.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`
      }, { status: 400 });
    }

    // Update order status
    const updatedOrder = await prisma.limitOrder.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Limit order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling limit order:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel limit order'
    }, { status: 500 });
  }
}

