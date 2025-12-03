import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
// GET: دریافت اطلاعات انبار
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        detailAccount: true,
        stockItems: {
          include: {
            product: {
              include: {
                unit: true
              }
            }
          }
        }
      }
    });
    
    if (!warehouse) {
      return NextResponse.json(
        { error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(warehouse);
    
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات انبار' },
      { status: 500 }
    );
  }
}

// PUT: ویرایش انبار
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // بررسی وجود انبار
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id }
    });
    
    if (!existingWarehouse) {
      return NextResponse.json(
        { error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی تکراری نبودن کد (اگر تغییر کرده)
    if (data.code && data.code !== existingWarehouse.code) {
      const duplicate = await prisma.warehouse.findUnique({
        where: { code: data.code }
      });
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'کد انبار تکراری است' },
          { status: 400 }
        );
      }
    }
    
    // ویرایش انبار
    const warehouse = await prisma.warehouse.update({
      where: { id },
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
    
    return NextResponse.json(warehouse);
    
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش انبار' },
      { status: 500 }
    );
  }
}

// DELETE: حذف انبار
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    // بررسی وجود انبار
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventoryDocuments: true,
        stockItems: true
      }
    });
    
    if (!warehouse) {
      return NextResponse.json(
        { error: 'انبار یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی اینکه انبار در اسناد استفاده نشده باشد
    if (warehouse.inventoryDocuments.length > 0) {
      return NextResponse.json(
        { error: 'امکان حذف انبار به دلیل وجود اسناد مرتبط وجود ندارد' },
        { status: 400 }
      );
    }
    
    // حذف انبار (stockItems به صورت cascade حذف می‌شوند)
    await prisma.warehouse.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'انبار با موفقیت حذف شد' });
    
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'خطا در حذف انبار' },
      { status: 500 }
    );
  }
}