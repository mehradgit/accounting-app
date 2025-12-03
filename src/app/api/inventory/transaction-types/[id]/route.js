import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
// GET: دریافت نوع تراکنش
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    const type = await prisma.inventoryTransactionType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventoryDocuments: true }
        }
      }
    });
    
    if (!type) {
      return NextResponse.json(
        { error: 'نوع تراکنش یافت نشد' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(type);
    
  } catch (error) {
    console.error('Error fetching transaction type:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات نوع تراکنش' },
      { status: 500 }
    );
  }
}

// PUT: ویرایش نوع تراکنش
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // بررسی وجود نوع تراکنش
    const existingType = await prisma.inventoryTransactionType.findUnique({
      where: { id }
    });
    
    if (!existingType) {
      return NextResponse.json(
        { error: 'نوع تراکنش یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی تکراری نبودن کد (اگر تغییر کرده)
    if (data.code && data.code !== existingType.code) {
      const duplicate = await prisma.inventoryTransactionType.findUnique({
        where: { code: data.code }
      });
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'کد نوع تراکنش تکراری است' },
          { status: 400 }
        );
      }
    }
    
    // ویرایش نوع تراکنش
    const type = await prisma.inventoryTransactionType.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        effect: data.effect,
        description: data.description
      }
    });
    
    return NextResponse.json(type);
    
  } catch (error) {
    console.error('Error updating transaction type:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش نوع تراکنش' },
      { status: 500 }
    );
  }
}

// DELETE: حذف نوع تراکنش
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    // بررسی وجود نوع تراکنش
    const type = await prisma.inventoryTransactionType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventoryDocuments: true }
        }
      }
    });
    
    if (!type) {
      return NextResponse.json(
        { error: 'نوع تراکنش یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی اینکه نوع تراکنش در اسناد استفاده نشده باشد
    if (type._count.inventoryDocuments > 0) {
      return NextResponse.json(
        { error: 'امکان حذف نوع تراکنش به دلیل استفاده در اسناد وجود ندارد' },
        { status: 400 }
      );
    }
    
    // حذف نوع تراکنش
    await prisma.inventoryTransactionType.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'نوع تراکنش با موفقیت حذف شد' });
    
  } catch (error) {
    console.error('Error deleting transaction type:', error);
    return NextResponse.json(
      { error: 'خطا در حذف نوع تراکنش' },
      { status: 500 }
    );
  }
}