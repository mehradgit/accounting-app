import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'import { getStockReport } from '@/lib/inventory';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const categoryId = searchParams.get('categoryId');
    const showLowStock = searchParams.get('showLowStock') === 'true';
    
    const report = await getStockReport(warehouseId, categoryId);
    
    // اگر فقط کالاهای کم موجود درخواست شده
    if (showLowStock) {
      report.report = report.report.filter(item => item.isLowStock);
      report.summary.totalItems = report.report.length;
      report.summary.totalQuantity = report.report.reduce((sum, item) => sum + item.quantity, 0);
      report.summary.totalValue = report.report.reduce((sum, item) => sum + item.totalValue, 0);
    }
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Error generating stock status report:', error);
    return NextResponse.json(
      { error: 'خطا در تولید گزارش موجودی' },
      { status: 500 }
    );
  }
}