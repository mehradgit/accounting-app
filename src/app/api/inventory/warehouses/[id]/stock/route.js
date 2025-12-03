import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
// GET: دریافت موجودی انبار
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    // بررسی وجود انبار
    const warehouse = await prisma.warehouse.findUnique({
      where: { id }
    });
    
    if (!warehouse) {
      return NextResponse.json(
        { error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    // دریافت موجودی کالاها در این انبار
    const stockItems = await prisma.stockItem.findMany({
      where: { warehouseId: id },
      include: {
        product: {
          include: {
            unit: true,
            category: true
          }
        }
      },
      orderBy: {
        product: {
          code: 'asc'
        }
      }
    });
    
    return NextResponse.json({
      warehouse,
      stockItems
    });
    
  } catch (error) {
    console.error('Error fetching warehouse stock:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت موجودی انبار' },
      { status: 500 }
    );
  }
}