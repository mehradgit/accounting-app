// src/app/api/inventory/documents/production-output/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      productionOrderId,
      warehouseId, // انبار محصول نهایی
      productId, // محصول نهایی تولید شده
      quantity, // تعداد تولید شده
      unitPrice, // بهای تمام شده
      description,
      relatedConsumptionId, // ID سند مصرف مواد (اختیاری)
      createVoucher = true
    } = body;

    // ۱. پیدا کردن نوع تراکنش "تولید محصول"
    const productionType = await prisma.inventoryTransactionType.findFirst({
      where: { 
        OR: [
          { code: 'PROD-OUTPUT' },
          { code: 'PROD-OUTPU' },
          { code: 'POUTPUT' },
          { name: { contains: 'تولید محصول' } }
        ]
      }
    });

    if (!productionType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'نوع تراکنش تولید محصول یافت نشد' 
        },
        { status: 400 }
      );
    }

    // ۲. پیدا کردن محصول
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        unit: true,
        detailAccount: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول نهایی یافت نشد' },
        { status: 404 }
      );
    }

    // ۳. محاسبات
    const totalAmount = quantity * unitPrice;
    
    // ۴. ایجاد شماره سند
    const documentNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // ۵. ایجاد سند انبار
    const document = await prisma.inventoryDocument.create({
      data: {
        documentNumber,
        documentDate: new Date(),
        typeId: productionType.id,
        warehouseId,
        referenceNumber: productionOrderId,
        description: description || `تولید محصول ${product.name}`,
        totalQuantity: quantity,
        totalAmount,
        createdBy: 1,
        ledgerEntries: {
          create: {
            productId,
            warehouseId,
            transactionDate: new Date(),
            reference: productionOrderId,
            quantityIn: quantity, // اینجا افزایش موجودی
            quantityOut: 0,
            unitPrice,
            totalPrice: totalAmount,
            description: description || `تولید محصول ${product.code} - ${product.name}`
          }
        }
      },
      include: {
        ledgerEntries: true,
        type: true
      }
    });
    
    // ۶. افزایش موجودی محصول نهایی
    // ابتدا بررسی کن آیا رکورد stockItem وجود دارد
    const existingStock = await prisma.stockItem.findFirst({
      where: {
        productId,
        warehouseId
      }
    });
    
    if (existingStock) {
      // اگر وجود دارد، آپدیت کن
      await prisma.stockItem.update({
        where: { id: existingStock.id },
        data: {
          quantity: {
            increment: quantity
          }
        }
      });
    } else {
      // اگر وجود ندارد، ایجاد کن
      await prisma.stockItem.create({
        data: {
          productId,
          warehouseId,
          quantity
        }
      });
    }
    
    // ۷. اگر باید سند حسابداری ایجاد شود
    if (createVoucher) {
      // پیدا کردن حساب تفصیلی کالای در جریان ساخت
      const wipDetailAccount = await prisma.detailAccount.findFirst({
        where: {
          OR: [
            { code: '1-05-0001' }, // مثال: حساب کالای در جریان ساخت
            { name: { contains: 'در جریان ساخت' } }
          ]
        },
        include: {
          subAccount: true
        }
      });
      
      // پیدا کردن حساب تفصیلی موجودی کالای ساخته شده - اصلاح شده
      const finishedGoodsDetailAccount = await prisma.detailAccount.findFirst({
        where: {
          OR: [
            { code: '1-04-0002' }, // مثال: حساب کالای ساخته شده
            { name: { contains: 'ساخته شده' } },
            // فقط اگر product.detailAccountId وجود داشت، آن را اضافه کنید
            ...(product.detailAccountId ? [{ id: product.detailAccountId }] : [])
          ]
        },
        include: {
          subAccount: true
        }
      });
      
      let voucher = null;
      
      if (wipDetailAccount && finishedGoodsDetailAccount) {
        // ایجاد سند حسابداری انتقال از در جریان ساخت به کالای ساخته شده
        voucher = await prisma.voucher.create({
          data: {
            voucherNumber: `V-PO-${Date.now()}`,
            voucherDate: new Date(),
            description: `تولید محصول ${product.name}`,
            totalAmount,
            createdBy: 1,
            items: {
              create: [
                {
                  // بدهکار حساب کالای ساخته شده
                  subAccountId: finishedGoodsDetailAccount.subAccountId,
                  detailAccountId: finishedGoodsDetailAccount.id,
                  description: `ورود محصول ${product.name} به انبار`,
                  debit: totalAmount,
                  credit: 0
                },
                {
                  // بستانکار حساب کالای در جریان ساخت
                  subAccountId: wipDetailAccount.subAccountId,
                  detailAccountId: wipDetailAccount.id,
                  description: `خروج از خط تولید ${product.name}`,
                  debit: 0,
                  credit: totalAmount
                }
              ]
            }
          }
        });
      } else if (product.detailAccount) {
        // اگر حساب در جریان ساخت پیدا نشد، فقط محصول را ثبت کن
        voucher = await prisma.voucher.create({
          data: {
            voucherNumber: `V-PO-${Date.now()}`,
            voucherDate: new Date(),
            description: `تولید محصول ${product.name}`,
            totalAmount,
            createdBy: 1,
            items: {
              create: [
                {
                  // بدهکار حساب محصول
                  subAccountId: product.detailAccount.subAccountId,
                  detailAccountId: product.detailAccount.id,
                  description: `تولید محصول ${product.name}`,
                  debit: totalAmount,
                  credit: 0
                },
                {
                  // بستانکار حساب تولید
                  subAccountId: product.detailAccount.subAccountId, // موقت
                  description: `بهای تمام شده تولید`,
                  debit: 0,
                  credit: totalAmount
                }
              ]
            }
          }
        });
      }
      
      // اتصال سند حسابداری به سند انبار
      if (voucher) {
        await prisma.inventoryDocument.update({
          where: { id: document.id },
          data: { voucherId: voucher.id }
        });
      }
    }
    
    // ۸. اگر سند مصرف مواد مرتبط وجود دارد، آن را به این سند پیوند بزن
    if (relatedConsumptionId) {
      await prisma.inventoryDocument.update({
        where: { id: relatedConsumptionId },
        data: {
          referenceNumber: `${productionOrderId} (مصرف)`,
          description: `${description || ''} - مواد مصرفی برای ${product.name}`
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'سند تولید محصول ایجاد شد',
      data: {
        document,
        product,
        stockUpdated: true
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating production output:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در ثبت تولید محصول',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}