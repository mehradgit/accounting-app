// src/app/api/inventory/products/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET: دریافت لیست محصولات
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const hasLowStock = searchParams.get('hasLowStock') === 'true';
    
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { barcode: { contains: search } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          unit: true,
          detailAccount: {
            include: {
              subAccount: true
            }
          }
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);
    
    // محاسبه موجودی هر محصول
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        // محاسبه کل موجودی این محصول از تمام انبارها
        const stockItems = await prisma.stockItem.findMany({
          where: { productId: product.id },
          select: { quantity: true }
        });
        
        const currentStock = stockItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        return {
          ...product,
          currentStock,
          hasLowStock: currentStock <= product.minStock
        };
      })
    );
    
    // فیلتر کالاهای کم موجود اگر فیلتر فعال باشد
    let filteredProducts = productsWithStock;
    if (hasLowStock) {
      filteredProducts = productsWithStock.filter(product => product.hasLowStock);
    }
    
    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات محصولات' },
      { status: 500 }
    );
  }
}

// POST: ایجاد محصول جدید
export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('دریافت داده برای ایجاد محصول:', data);
    
    // اعتبارسنجی داده‌ها
    if (!data.code || !data.name || !data.categoryId || !data.unitId) {
      return NextResponse.json(
        { error: 'کد، نام، گروه و واحد اندازه‌گیری اجباری هستند' },
        { status: 400 }
      );
    }
    
    // بررسی تکراری نبودن کد
    const existingProduct = await prisma.product.findUnique({
      where: { code: data.code }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'کد محصول تکراری است' },
        { status: 400 }
      );
    }
    
    // ایجاد محصول با قیمت‌های درست
    const product = await prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        barcode: data.barcode,
        categoryId: parseInt(data.categoryId),
        unitId: parseInt(data.unitId),
        defaultPurchasePrice: parseFloat(data.defaultPurchasePrice) || 0,
        defaultSalePrice: parseFloat(data.defaultSalePrice) || 0,
        defaultWholesalePrice: data.defaultWholesalePrice ? parseFloat(data.defaultWholesalePrice) : null,
        minStock: parseFloat(data.minStock) || 0,
        maxStock: parseFloat(data.maxStock) || 0,
        detailAccountId: data.detailAccountId ? parseInt(data.detailAccountId) : null
      },
      include: {
        category: true,
        unit: true,
        detailAccount: true
      }
    });
    
    return NextResponse.json(product, { status: 201 });
    
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد محصول' },
      { status: 500 }
    );
  }
}