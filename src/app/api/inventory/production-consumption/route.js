// src/app/api/inventory/documents/production-consumption/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      productionOrderId, // شماره دستور تولید
      warehouseId, // انبار خط تولید
      productId, // محصول نهایی
      rawMaterials, // مواد اولیه مصرف شده
      description,
      createVoucher = true
    } = body;

    // ۱. پیدا کردن نوع تراکنش "مصرف تولید"
    const consumptionType = await prisma.inventoryTransactionType.findFirst({
      where: { code: 'PROD-CONSUME' }
    });

    if (!consumptionType) {
      return NextResponse.json(
        { error: 'نوع تراکنش مصرف تولید یافت نشد' },
        { status: 400 }
      );
    }

    // ۲. ایجاد سند انبار برای هر ماده اولیه
    const documents = [];
    
    for (const material of rawMaterials) {
      // محاسبات
      const totalQuantity = material.quantity;
      const totalAmount = material.quantity * material.unitPrice;
      
      // ایجاد شماره سند
      const documentNumber = `PC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // ایجاد سند انبار
      const document = await prisma.inventoryDocument.create({
        data: {
          documentNumber,
          documentDate: new Date(),
          typeId: consumptionType.id,
          warehouseId,
          referenceNumber: productionOrderId,
          description: `${description} - ${material.productName}`,
          totalQuantity,
          totalAmount,
          createdBy: 1,
          ledgerEntries: {
            create: {
              productId: material.productId,
              warehouseId,
              transactionDate: new Date(),
              reference: productionOrderId,
              quantityIn: 0,
              quantityOut: material.quantity,
              unitPrice: material.unitPrice,
              totalPrice: totalAmount,
              description: material.description
            }
          }
        },
        include: {
          ledgerEntries: true
        }
      });
      
      documents.push(document);
      
      // ۳. کاهش موجودی مواد اولیه در انبار خط تولید
      await prisma.stockItem.updateMany({
        where: {
          productId: material.productId,
          warehouseId
        },
        data: {
          quantity: {
            decrement: material.quantity
          }
        }
      });
      
      // ۴. اگر باید سند حسابداری ایجاد شود
      if (createVoucher) {
        // پیدا کردن حساب تفصیلی مواد اولیه
        const rawMaterialDetailAccount = await prisma.detailAccount.findFirst({
          where: {
            code: '1-04-0001' // مثال: حساب موجودی مواد اولیه
          },
          include: {
            subAccount: true
          }
        });
        
        // پیدا کردن حساب تفصیلی مواد مصرفی تولید
        const consumptionDetailAccount = await prisma.detailAccount.findFirst({
          where: {
            code: '6-01-0001' // مثال: حساب مواد مصرفی تولید
          },
          include: {
            subAccount: true
          }
        });
        
        if (rawMaterialDetailAccount && consumptionDetailAccount) {
          // ایجاد سند حسابداری
          const voucher = await prisma.voucher.create({
            data: {
              voucherNumber: `V-${Date.now()}`,
              voucherDate: new Date(),
              description: `مصرف ${material.productName} در تولید`,
              totalAmount: totalAmount,
              createdBy: 1,
              items: {
                create: [
                  {
                    // ردیف ۱: بدهکار حساب مواد مصرفی تولید
                    subAccountId: consumptionDetailAccount.subAccountId,
                    detailAccountId: consumptionDetailAccount.id,
                    description: `مصرف ${material.productName}`,
                    debit: totalAmount,
                    credit: 0
                  },
                  {
                    // ردیف ۲: بستانکار حساب موجودی مواد اولیه
                    subAccountId: rawMaterialDetailAccount.subAccountId,
                    detailAccountId: rawMaterialDetailAccount.id,
                    description: `خروج ${material.productName} از انبار`,
                    debit: 0,
                    credit: totalAmount
                  }
                ]
              }
            }
          });
          
          // اتصال سند حسابداری به سند انبار
          await prisma.inventoryDocument.update({
            where: { id: document.id },
            data: { voucherId: voucher.id }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'اسناد مصرف تولید ایجاد شد',
      documents
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating production consumption:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت مصرف تولید' },
      { status: 500 }
    );
  }
}