import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
export async function GET() {
  try {
    // تعداد کل کالاها
    const totalProducts = await prisma.product.count();
    
    // تعداد انبارها
    const totalWarehouses = await prisma.warehouse.count();
    
    // تعداد کل تراکنش‌ها
    const totalTransactions = await prisma.inventoryDocument.count();
    
    // محاسبه ارزش کل موجودی
    const stockItems = await prisma.stockItem.findMany({
      include: {
        product: true
      }
    });
    
    let totalValue = 0;
    for (const item of stockItems) {
      totalValue += item.quantity * (item.product.defaultPurchasePrice || 0);
    }
    
    return NextResponse.json({
      totalProducts,
      totalWarehouses,
      totalTransactions,
      totalValue
    });
    
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار گزارشات' },
      { status: 500 }
    );
  }
}