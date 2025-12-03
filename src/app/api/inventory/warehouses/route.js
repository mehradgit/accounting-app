import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
// GET: دریافت لیست انبارها
export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        detailAccount: true,
        _count: {
          select: { 
            stockItems: true,
            inventoryDocuments: true 
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    
    return NextResponse.json({ warehouses });
    
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات انبارها' },
      { status: 500 }
    );
  }
}

// POST: ایجاد انبار جدید
export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.code || !data.name) {
      return NextResponse.json(
        { error: 'کد و نام انبار الزامی هستند' },
        { status: 400 }
      );
    }
    
    // بررسی تکراری نبودن کد
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code: data.code }
    });
    
    if (existingWarehouse) {
      return NextResponse.json(
        { error: 'کد انبار تکراری است' },
        { status: 400 }
      );
    }
    
    const warehouse = await prisma.warehouse.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
        phone: data.phone,
        manager: data.manager,
        description: data.description,
        detailAccountId: data.detailAccountId || null
      },
      include: {
        detailAccount: true
      }
    });
    
    return NextResponse.json(warehouse, { status: 201 });
    
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد انبار' },
      { status: 500 }
    );
  }
}