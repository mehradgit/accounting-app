import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
// GET: دریافت محصول بر اساس ID
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
        detailAccount: true,
        stockItems: {
          include: {
            warehouse: true
          }
        },
        priceHistory: {
          orderBy: { effectiveDate: 'desc' },
          take: 10
        },
        inventoryLedgers: {
          orderBy: { transactionDate: 'desc' },
          take: 20,
          include: {
            warehouse: true,
            document: true
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات محصول' },
      { status: 500 }
    );
  }
}

// PUT: ویرایش محصول
export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    // بررسی وجود محصول
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی تکراری نبودن کد (اگر تغییر کرده)
    if (data.code && data.code !== existingProduct.code) {
      const duplicate = await prisma.product.findUnique({
        where: { code: data.code }
      });
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'کد محصول تکراری است' },
          { status: 400 }
        );
      }
    }
    
    // ویرایش محصول
    const product = await prisma.product.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        barcode: data.barcode,
        categoryId: data.categoryId,
        unitId: data.unitId,
        defaultPurchasePrice: data.defaultPurchasePrice,
        defaultSalePrice: data.defaultSalePrice,
        defaultWholesalePrice: data.defaultWholesalePrice,
        minStock: data.minStock,
        maxStock: data.maxStock,
        detailAccountId: data.detailAccountId
      },
      include: {
        category: true,
        unit: true
      }
    });
    
    // اگر قیمت تغییر کرده، سابقه جدید ایجاد شود
    if (data.defaultPurchasePrice !== existingProduct.defaultPurchasePrice ||
        data.defaultSalePrice !== existingProduct.defaultSalePrice) {
      await prisma.productPriceHistory.create({
        data: {
          productId: product.id,
          purchasePrice: data.defaultPurchasePrice || 0,
          salePrice: data.defaultSalePrice,
          wholesalePrice: data.defaultWholesalePrice
        }
      });
    }
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش محصول' },
      { status: 500 }
    );
  }
}

// DELETE: حذف محصول
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    
    // بررسی وجود محصول
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockItems: true,
        inventoryLedgers: true
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }
    
    // بررسی اینکه محصول در تراکنش‌ها استفاده نشده باشد
    if (product.inventoryLedgers.length > 0) {
      return NextResponse.json(
        { error: 'امکان حذف محصول به دلیل وجود تراکنش‌های مرتبط وجود ندارد' },
        { status: 400 }
      );
    }
    
    // حذف محصول
    await prisma.product.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'محصول با موفقیت حذف شد' });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'خطا در حذف محصول' },
      { status: 500 }
    );
  }
}