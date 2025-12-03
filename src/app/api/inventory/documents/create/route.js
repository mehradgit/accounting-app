// src/app/api/inventory/documents/create/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInventoryDocumentNumber } from '@/lib/codeGenerator';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('دریافت داده‌ها برای ایجاد سند انبار:', body);

    const {
      typeId,
      warehouseId,
      personId,
      documentDate,
      referenceNumber,
      description,
      items,
      createVoucher = false
    } = body;

    // اعتبارسنجی
    if (!typeId || !warehouseId || !documentDate) {
      return NextResponse.json(
        { error: 'نوع سند، انبار و تاریخ سند الزامی هستند' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'حداقل یک کالا باید اضافه شود' },
        { status: 400 }
      );
    }

    // محاسبه جمع مقادیر
    const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalAmount = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    // ایجاد شماره سند
    const documentNumber = generateInventoryDocumentNumber();

    // شروع تراکنش
    const result = await prisma.$transaction(async (tx) => {
      // ایجاد سند انبار
      const document = await tx.inventoryDocument.create({
        data: {
          documentNumber,
          documentDate: new Date(documentDate),
          typeId: parseInt(typeId),
          warehouseId: parseInt(warehouseId),
          personId: personId ? parseInt(personId) : null,
          referenceNumber: referenceNumber || null,
          description: description || null,
          totalQuantity,
          totalAmount,
          createdBy: 1 // TODO: از کاربر جاری استفاده شود
        },
        include: {
          type: true,
          warehouse: true,
          person: true
        }
      });

      console.log(`✅ سند انبار ایجاد شد: ${documentNumber}`);

      // ایجاد ردیف‌های کاردکس
      const ledgerEntries = [];
      
      for (const item of items) {
        const productId = parseInt(item.productId);
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const totalPrice = quantity * unitPrice;

        // پیدا کردن نوع تراکنش برای تعیین effect
        const transactionType = await tx.inventoryTransactionType.findUnique({
          where: { id: parseInt(typeId) }
        });

        if (!transactionType) {
          throw new Error('نوع تراکنش یافت نشد');
        }

        // محاسبه مقادیر ورودی و خروجی بر اساس effect
        const quantityIn = transactionType.effect === 'increase' ? quantity : 0;
        const quantityOut = transactionType.effect === 'decrease' ? quantity : 0;

        // ایجاد ردیف کاردکس
        const ledgerEntry = await tx.inventoryLedger.create({
          data: {
            documentId: document.id,
            productId: productId,
            warehouseId: parseInt(warehouseId),
            transactionDate: new Date(documentDate),
            reference: referenceNumber || documentNumber,
            quantityIn,
            quantityOut,
            unitPrice,
            totalPrice,
            personId: personId ? parseInt(personId) : null,
            description: item.description || null,
            createdBy: 1,
            
            // محاسبه موجودی انباشته
            // ابتدا موجودی قبلی را پیدا کن
            balanceQuantity: 0, // اینجا باید محاسبه شود
            balanceValue: 0     // اینجا باید محاسبه شود
          },
          include: {
            product: true,
            warehouse: true,
            person: true
          }
        });

        ledgerEntries.push(ledgerEntry);
        console.log(`📝 ردیف کاردکس برای کالا ${productId} ایجاد شد`);
      }

      // به‌روزرسانی موجودی انبار (StockItem)
      for (const item of items) {
        const productId = parseInt(item.productId);
        const quantity = parseFloat(item.quantity) || 0;
        
        // پیدا کردن نوع تراکنش
        const transactionType = await tx.inventoryTransactionType.findUnique({
          where: { id: parseInt(typeId) }
        });

        // پیدا کردن یا ایجاد رکورد موجودی
        const existingStock = await tx.stockItem.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(warehouseId)
          }
        });

        if (existingStock) {
          // اگر موجودی وجود دارد، آن را به‌روزرسانی کن
          const newQuantity = transactionType.effect === 'increase' 
            ? existingStock.quantity + quantity 
            : existingStock.quantity - quantity;

          await tx.stockItem.update({
            where: { id: existingStock.id },
            data: { 
              quantity: newQuantity,
              updatedAt: new Date()
            }
          });
        } else {
          // اگر موجودی وجود ندارد، ایجاد کن (فقط برای افزایش موجودی)
          if (transactionType.effect === 'increase') {
            await tx.stockItem.create({
              data: {
                productId: productId,
                warehouseId: parseInt(warehouseId),
                quantity: quantity,
                minStock: 0,
                maxStock: 0
              }
            });
          }
        }
      }

      console.log(`✅ موجودی‌های انبار به‌روزرسانی شد`);

      return { document, ledgerEntries };
    });

    // اگر باید سند حسابداری ایجاد شود
    if (createVoucher) {
      // TODO: ایجاد سند حسابداری متناظر
      console.log('⚠️ ایجاد سند حسابداری هنوز پیاده‌سازی نشده است');
    }

    return NextResponse.json({
      success: true,
      message: 'سند انبار با موفقیت ایجاد شد',
      document: result.document,
      ledgerEntries: result.ledgerEntries
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating inventory document:', error);
    
    // خطاهای خاص Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'شماره سند تکراری است' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'اطلاعات ارجاعی نامعتبر است' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'خطا در ایجاد سند انبار',
        details: error.message 
      },
      { status: 500 }
    );
  }
}