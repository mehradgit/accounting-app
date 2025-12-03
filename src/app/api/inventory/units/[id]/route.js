import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET: دریافت واحد
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const unitId = parseInt(id);
    
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: 'شناسه واحد نامعتبر است' },
        { status: 400 }
      );
    }
    
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
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
    const { id } = await params;
    const unitId = parseInt(id);
    
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: 'شناسه واحد نامعتبر است' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // بررسی وجود واحد
    const existingUnit = await prisma.unit.findUnique({
      where: { id: unitId }
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
      where: { id: unitId },
      data: {
        code: data.code,
        name: data.name,
        description: data.description || ''
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
    const { id } = await params;
    const unitId = parseInt(id);
    
    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: 'شناسه واحد نامعتبر است' },
        { status: 400 }
      );
    }
    
    // بررسی وجود واحد
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
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
    
    // بررسی اینکه واحد در محصولات استفاده نشده باشد
    if (unit._count.products > 0) {
      return NextResponse.json(
        { error: 'امکان حذف واحد به دلیل استفاده در کالاها وجود ندارد' },
        { status: 400 }
      );
    }
    
    // حذف واحد
    await prisma.unit.delete({
      where: { id: unitId }
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