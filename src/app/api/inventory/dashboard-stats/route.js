import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // تعداد کل کالاها
    const totalProducts = await prisma.product.count();
    
    // تعداد انبارها
    const totalWarehouses = await prisma.warehouse.count();
    
    // کالاهای با موجودی کم (کمتر از حداقل مجاز)
    const lowStockItems = await prisma.product.count({
      where: {
        minStock: { gt: 0 },
        currentStock: { lt: prisma.product.fields.minStock }
      }
    });
    
    // تراکنش‌های 7 روز اخیر
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTransactions = await prisma.inventoryDocument.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });
    
    return NextResponse.json({
      totalProducts,
      totalWarehouses,
      lowStockItems,
      recentTransactions
    });
    
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار انبار' },
      { status: 500 }
    );
  }
}