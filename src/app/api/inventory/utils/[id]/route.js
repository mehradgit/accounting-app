import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
// GET: دریافت واحد
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    
    if (!unit) {
      return NextResponse.json(
        { error: 'واحد یافت نشد' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(unit);
    
  } catch (error) {
    console.error('Error fetching unit:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات واحد' },
      { status: 500 }
    );
  }
}

// PUT: ویرایش واحد
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // بررسی وجود واحد
    const existingUnit = await prisma.unit.findUnique({
      where: { id }
    });
    
    if (!existingUnit) {
      return NextResponse.json(
        { error: 'واحد یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی تکراری نبودن کد (اگر تغییر کرده)
    if (data.code && data.code !== existingUnit.code) {
      const duplicate = await prisma.unit.findUnique({
        where: { code: data.code }
      });
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'کد واحد تکراری است' },
          { status: 400 }
        );
      }
    }
    
    // ویرایش واحد
    const unit = await prisma.unit.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description
      }
    });
    
    return NextResponse.json(unit);
    
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش واحد' },
      { status: 500 }
    );
  }
}

// DELETE: حذف واحد
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    // بررسی وجود واحد
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    
    if (!unit) {
      return NextResponse.json(
        { error: 'واحد یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی اینکه واحد در کالاها استفاده نشده باشد
    if (unit._count.products > 0) {
      return NextResponse.json(
        { error: 'امکان حذف واحد به دلیل استفاده در کالاها وجود ندارد' },
        { status: 400 }
      );
    }
    
    // حذف واحد
    await prisma.unit.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'واحد با موفقیت حذف شد' });
    
  } catch (error) {
    console.error('Error deleting unit:', error);
    return NextResponse.json(
      { error: 'خطا در حذف واحد' },
      { status: 500 }
    );
  }
}