// src/app/api/inventory/product-categories/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET: دریافت لیست گروه‌های کالا
export async function GET(request) {
  try {
    console.log('Fetching product categories...');
    
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    
    const whereCondition = parentId 
      ? { parentId: parseInt(parentId) }
      : { parentId: null };
    
    console.log('Where condition:', whereCondition);
    
    const categories = await prisma.productCategory.findMany({
      where: whereCondition,
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: { 
                products: true,
                children: true 
              }
            }
          }
        },
        _count: {
          select: { 
            products: true,
            children: true 
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    
    console.log('Categories found:', categories.length);
    
    // اگر هیچ گروهی یافت نشد، یک گروه نمونه ایجاد کن
    if (categories.length === 0) {
      console.log('No categories found, creating sample data...');
      
      // بررسی کن که آیا گروه‌های پایه وجود دارند یا خیر
      const existingCategories = await prisma.productCategory.findMany();
      if (existingCategories.length === 0) {
        // ایجاد گروه‌های نمونه
        const sampleCategories = await prisma.$transaction([
          prisma.productCategory.create({
            data: {
              code: 'CAT-01',
              name: 'لوازم الکترونیکی',
              description: 'گروه محصولات الکترونیکی'
            }
          }),
          prisma.productCategory.create({
            data: {
              code: 'CAT-02',
              name: 'لوازم خانگی',
              description: 'گروه محصولات خانگی'
            }
          })
        ]);
        
        // حالا دوباره جستجو کن
        const newCategories = await prisma.productCategory.findMany({
          where: whereCondition,
          include: {
            parent: true,
            children: {
              include: {
                _count: {
                  select: { 
                    products: true,
                    children: true 
                  }
                }
              }
            },
            _count: {
              select: { 
                products: true,
                children: true 
              }
            }
          },
          orderBy: { code: 'asc' }
        });
        
        console.log('Sample categories created, returning:', newCategories.length);
        return NextResponse.json(newCategories);
      }
    }
    
    // برگرداندن آرایه مستقیم
    return NextResponse.json(categories);
    
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return NextResponse.json(
      { error: `خطا در دریافت لیست گروه‌های کالا: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST: ایجاد گروه کالا جدید
export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Creating product category:', data);
    
    // بررسی تکراری نبودن کد
    const duplicate = await prisma.productCategory.findUnique({
      where: { code: data.code }
    });
    
    if (duplicate) {
      return NextResponse.json(
        { error: 'کد گروه تکراری است' },
        { status: 400 }
      );
    }
    
    const category = await prisma.productCategory.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        parentId: data.parentId || null
      },
      include: {
        parent: true,
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });
    
    return NextResponse.json(category, { status: 201 });
    
  } catch (error) {
    console.error('Error creating product category:', error);
    return NextResponse.json(
      { error: `خطا در ایجاد گروه کالا: ${error.message}` },
      { status: 500 }
    );
  }
}