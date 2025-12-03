import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET: دریافت گروه کالا
export async function GET(request, { params }) {
  try {
    // await برای دریافت params
    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'شناسه گروه نامعتبر است' },
        { status: 400 }
      );
    }
    
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { 
            products: true,
            children: true 
          }
        }
      }
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'گروه کالا یافت نشد' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
    
  } catch (error) {
    console.error('Error fetching product category:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات گروه کالا' },
      { status: 500 }
    );
  }
}

// PUT: ویرایش گروه کالا
export async function PUT(request, { params }) {
  try {
    // await برای دریافت params
    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'شناسه گروه نامعتبر است' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // بررسی وجود گروه
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: categoryId }
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'گروه کالا یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی تکراری نبودن کد (اگر تغییر کرده)
    if (data.code && data.code !== existingCategory.code) {
      const duplicate = await prisma.productCategory.findUnique({
        where: { code: data.code }
      });
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'کد گروه تکراری است' },
          { status: 400 }
        );
      }
    }
    
    // ویرایش گروه
    const category = await prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        parentId: data.parentId || null
      },
      include: {
        parent: true
      }
    });
    
    return NextResponse.json(category);
    
  } catch (error) {
    console.error('Error updating product category:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش گروه کالا' },
      { status: 500 }
    );
  }
}

// DELETE: حذف گروه کالا
export async function DELETE(request, { params }) {
  try {
    // await برای دریافت params
    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'شناسه گروه نامعتبر است' },
        { status: 400 }
      );
    }
    
    // بررسی وجود گروه
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { 
            products: true,
            children: true 
          }
        }
      }
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'گروه کالا یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی اینکه گروه دارای کالا یا زیرگروه نباشد
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: 'امکان حذف گروه به دلیل وجود کالاهای مرتبط وجود ندارد' },
        { status: 400 }
      );
    }
    
    if (category._count.children > 0) {
      return NextResponse.json(
        { error: 'امکان حذف گروه به دلیل وجود زیرگروه‌ها وجود ندارد' },
        { status: 400 }
      );
    }
    
    // حذف گروه
    await prisma.productCategory.delete({
      where: { id: categoryId }
    });
    
    return NextResponse.json({ message: 'گروه کالا با موفقیت حذف شد' });
    
  } catch (error) {
    console.error('Error deleting product category:', error);
    return NextResponse.json(
      { error: 'خطا در حذف گروه کالا' },
      { status: 500 }
    );
  }
}