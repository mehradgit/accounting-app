import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateVoucherNumber, generateInventoryDocumentNumber } from "@/lib/codeGenerator";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log("📥 دریافت داده‌های فروش:", {
      invoiceNumber: data.invoiceNumber,
      paymentMethod: data.paymentMethod,
      itemsCount: data.items?.length || 0,
      totalSaleAmount: data.totalSaleAmount,
      warehouseId: data.warehouseId // اضافه شد
    });

    // اعتبارسنجی داده‌های ورودی
    if (!data.invoiceNumber || !data.paymentMethod || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "اطلاعات ضروری ارسال نشده است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی انبار
    if (!data.warehouseId) {
      return NextResponse.json(
        { error: "انبار کالا مشخص نشده است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی حساب‌های سیستمی
    if (!data.inventoryAccountId) {
      return NextResponse.json(
        { error: "حساب موجودی کالا مشخص نشده است" },
        { status: 400 }
      );
    }

    // برای پرداخت نقدی، حساب صندوق باید مشخص باشد
    if (data.paymentMethod === 'cash' && !data.cashAccountId) {
      return NextResponse.json(
        { error: "برای فروش نقدی، حساب صندوق مشخص نشده است" },
        { status: 400 }
      );
    }

    // برای فروش چکی، حساب چک‌های وارده باید مشخص باشد
    if (data.paymentMethod === 'cheque' && !data.chequeAccountId) {
      return NextResponse.json(
        { error: "برای فروش چکی، حساب چک‌های وارده مشخص نشده است" },
        { status: 400 }
      );
    }

    // برای فروش حواله، حساب بانک باید مشخص باشد
    if (data.paymentMethod === 'transfer' && !data.bankDetailAccountId) {
      return NextResponse.json(
        { error: "برای فروش حواله، حساب بانک مشخص نشده است" },
        { status: 400 }
      );
    }

    // شروع تراکنش
    const result = await prisma.$transaction(async (tx) => {
      // ۱. پیدا کردن حساب مشتری (حساب تفصیلی)
      const customerDetailAccount = await tx.detailAccount.findUnique({
        where: { id: data.customerDetailAccountId },
        include: { 
          subAccount: true,
          person: true 
        }
      });

      if (!customerDetailAccount) {
        throw new Error("حساب مشتری یافت نشد");
      }

      // ۲. پیدا کردن حساب موجودی کالا (حساب معین)
      const inventoryAccount = await tx.subAccount.findUnique({
        where: { id: data.inventoryAccountId }
      });

      if (!inventoryAccount) {
        throw new Error("حساب موجودی کالا یافت نشد");
      }

      // ۳. پیدا کردن نوع تراکنش فروش (SALE)
      const saleTransactionType = await tx.inventoryTransactionType.findFirst({
        where: { 
          OR: [
            { code: 'SALE' },
            { name: { contains: 'فروش' } },
            { name: { contains: 'خروج' } }
          ]
        }
      });

      if (!saleTransactionType) {
        throw new Error("نوع تراکنش فروش یافت نشد");
      }

      console.log("✅ نوع تراکنش فروش یافت شد:", saleTransactionType.code);

      // ۴. ایجاد سند انبار (برای کاهش موجودی)
      const inventoryDocumentNumber = generateInventoryDocumentNumber();
      
      const inventoryDocument = await tx.inventoryDocument.create({
        data: {
          documentNumber: inventoryDocumentNumber,
          documentDate: new Date(data.invoiceDate),
          typeId: saleTransactionType.id,
          warehouseId: parseInt(data.warehouseId),
          personId: customerDetailAccount.personId,
          referenceNumber: data.invoiceNumber,
          description: data.description || `فروش ${data.invoiceNumber}`,
          totalQuantity: data.totalQuantity,
          totalAmount: data.totalCostAmount, // با قیمت تمام شده
          createdBy: 1
        }
      });

      console.log("✅ سند انبار ایجاد شد:", inventoryDocumentNumber);

      // ۵. ثبت ردیف‌های کاردکس و کاهش موجودی
      for (const item of data.items) {
        const productId = parseInt(item.productId);
        const quantity = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.costPrice); // قیمت تمام شده
        const totalPrice = quantity * unitPrice;

        // محاسبه موجودی قبلی
        const lastLedger = await tx.inventoryLedger.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(data.warehouseId)
          },
          orderBy: { id: 'desc' }
        });

        const previousBalanceQty = lastLedger?.balanceQuantity || 0;
        const previousBalanceValue = lastLedger?.balanceValue || 0;

        // محاسبه موجودی جدید (کاهش)
        const newBalanceQty = previousBalanceQty - quantity;
        const newBalanceValue = previousBalanceValue - totalPrice;

        // ایجاد ردیف کاردکس
        await tx.inventoryLedger.create({
          data: {
            documentId: inventoryDocument.id,
            productId: productId,
            warehouseId: parseInt(data.warehouseId),
            transactionDate: new Date(data.invoiceDate),
            reference: data.invoiceNumber,
            quantityIn: 0,
            quantityOut: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            balanceQuantity: newBalanceQty,
            balanceValue: newBalanceValue,
            personId: customerDetailAccount.personId,
            description: `فروش ${data.invoiceNumber}`,
            createdBy: 1
          }
        });

        // به‌روزرسانی موجودی انبار (StockItem)
        const existingStock = await tx.stockItem.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(data.warehouseId)
          }
        });

        if (existingStock) {
          const newQuantity = existingStock.quantity - quantity;
          
          await tx.stockItem.update({
            where: { id: existingStock.id },
            data: { 
              quantity: newQuantity,
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ موجودی محصول ${productId} کاهش یافت: ${quantity} واحد`);
        } else {
          throw new Error(`محصول ${productId} در انبار ${data.warehouseId} موجود نیست`);
        }
      }

      console.log("✅ موجودی‌های انبار به‌روزرسانی شد");

      // ۶. ایجاد سند حسابداری
      const voucherNumber = await generateVoucherNumber(tx);
      
      const voucher = await tx.voucher.create({
        data: {
          voucherNumber,
          voucherDate: new Date(data.invoiceDate),
          description: data.description || `فاکتور فروش ${data.invoiceNumber}`,
          totalAmount: data.totalSaleAmount,
          createdBy: 1
        }
      });

      console.log("✅ سند حسابداری ایجاد شد:", voucher.voucherNumber);

      const voucherItems = [];

      // ۷. ایجاد ردیف‌های سند بر اساس روش پرداخت
      switch (data.paymentMethod) {
        case 'cash': // فروش نقدی
          // ردیف ۱: بستانکار موجودی کالا، بدهکار مشتری
          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: inventoryAccount.id,
            detailAccountId: null,
            description: `فروش نقدی ${data.invoiceNumber} - کسر موجودی`,
            credit: data.totalSaleAmount,
            debit: 0
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: customerDetailAccount.subAccountId,
            detailAccountId: customerDetailAccount.id,
            description: `فروش نقدی ${data.invoiceNumber} - بدهکار مشتری`,
            credit: 0,
            debit: data.totalSaleAmount
          });

          // ردیف ۲: بستانکار مشتری، بدهکار صندوق
          const cashDetailAccount = await tx.detailAccount.findUnique({
            where: { id: data.cashAccountId }
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: customerDetailAccount.subAccountId,
            detailAccountId: customerDetailAccount.id,
            description: `تسویه نقدی ${data.invoiceNumber}`,
            credit: data.totalSaleAmount,
            debit: 0
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: cashDetailAccount?.subAccountId || null,
            detailAccountId: cashDetailAccount?.id || null,
            description: `دریافت نقدی ${data.invoiceNumber}`,
            credit: 0,
            debit: data.totalSaleAmount
          });
          break;

        case 'cheque': // فروش چکی
          // ردیف ۱: بدهکار مشتری، بستانکار موجودی کالا
          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: customerDetailAccount.subAccountId,
            detailAccountId: customerDetailAccount.id,
            description: `فروش چکی ${data.invoiceNumber} - بدهکار مشتری`,
            credit: 0,
            debit: data.totalSaleAmount
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: inventoryAccount.id,
            detailAccountId: null,
            description: `فروش چکی ${data.invoiceNumber} - کسر موجودی`,
            credit: data.totalSaleAmount,
            debit: 0
          });

          // ردیف ۲: بدهکار چک‌های وارده، بستانکار مشتری
          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: data.chequeAccountId, // حساب معین چک‌های وارده
            detailAccountId: null,
            description: `دریافت چک ${data.chequeData?.chequeNumber || ''} - ${data.invoiceNumber}`,
            credit: 0,
            debit: data.totalSaleAmount
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: customerDetailAccount.subAccountId,
            detailAccountId: customerDetailAccount.id,
            description: `تسویه چکی ${data.invoiceNumber}`,
            credit: data.totalSaleAmount,
            debit: 0
          });

          // ثبت چک دریافتنی
          if (data.chequeData) {
            await tx.cheque.create({
              data: {
                chequeNumber: data.chequeData.chequeNumber,
                bankName: data.chequeData.bankName || "نامشخص",
                amount: data.totalSaleAmount,
                issueDate: new Date(data.chequeData.issueDate),
                dueDate: new Date(data.chequeData.dueDate),
                drawer: customerDetailAccount.name,
                payee: "شرکت",
                type: "receivable",
                status: "pending",
                description: data.chequeData.description || `فاکتور ${data.invoiceNumber}`,
                drawerDetailAccountId: customerDetailAccount.id,
                payeeDetailAccountId: null,
                voucherId: voucher.id,
                personId: customerDetailAccount.personId
              }
            });
          }
          break;

        case 'transfer': // فروش حواله
          // ردیف ۱: بستانکار موجودی کالا، بدهکار مشتری
          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: inventoryAccount.id,
            detailAccountId: null,
            description: `فروش حواله ${data.invoiceNumber} - کسر موجودی`,
            credit: data.totalSaleAmount,
            debit: 0
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: customerDetailAccount.subAccountId,
            detailAccountId: customerDetailAccount.id,
            description: `فروش حواله ${data.invoiceNumber} - بدهکار مشتری`,
            credit: 0,
            debit: data.totalSaleAmount
          });

          // ردیف ۲: بستانکار مشتری، بدهکار حساب بانک
          const bankDetailAccount = await tx.detailAccount.findUnique({
            where: { id: data.bankDetailAccountId },
            include: { subAccount: true }
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: customerDetailAccount.subAccountId,
            detailAccountId: customerDetailAccount.id,
            description: `تسویه حواله ${data.invoiceNumber}`,
            credit: data.totalSaleAmount,
            debit: 0
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: bankDetailAccount?.subAccountId || null,
            detailAccountId: bankDetailAccount?.id || null,
            description: `دریافت حواله ${data.invoiceNumber} - ${bankDetailAccount?.name || ''}`,
            credit: 0,
            debit: data.totalSaleAmount
          });
          break;

        case 'credit': // فروش نسیه
          // فقط یک ردیف: بستانکار موجودی کالا، بدهکار مشتری
          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: inventoryAccount.id,
            detailAccountId: null,
            description: `فروش نسیه ${data.invoiceNumber} - کسر موجودی`,
            credit: data.totalSaleAmount,
            debit: 0
          });

          voucherItems.push({
            voucherId: voucher.id,
            subAccountId: customerDetailAccount.subAccountId,
            detailAccountId: customerDetailAccount.id,
            description: `فروش نسیه ${data.invoiceNumber} - بدهکار مشتری`,
            credit: 0,
            debit: data.totalSaleAmount
          });
          break;

        default:
          throw new Error("روش پرداخت نامعتبر");
      }

      // ۸. ثبت ردیف‌های سند
      await tx.voucherItem.createMany({
        data: voucherItems
      });

      console.log(`✅ ${voucherItems.length} ردیف سند ثبت شد`);

      // ۹. اتصال سند حسابداری به سند انبار
      await tx.inventoryDocument.update({
        where: { id: inventoryDocument.id },
        data: { voucherId: voucher.id }
      });

      // ۱۰. به‌روزرسانی مانده حساب‌ها
      await updateAccountBalancesForSale(
        tx,
        data.paymentMethod,
        inventoryAccount.id,
        customerDetailAccount.subAccountId,
        customerDetailAccount.id,
        data.totalSaleAmount,
        data.cashAccountId,
        data.bankDetailAccountId
      );

      return {
        voucher,
        inventoryDocument,
        cheque: data.paymentMethod === 'cheque' ? data.chequeData : null,
        voucherItems
      };
    });

    return NextResponse.json({
      success: true,
      message: "فروش با موفقیت ثبت شد",
      ...result
    });

  } catch (error) {
    console.error("❌ خطا در ثبت فروش:", error);
    return NextResponse.json(
      { 
        error: "خطا در ثبت فروش",
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// =================================================================
// 📊 تابع به‌روزرسانی مانده حساب‌ها برای فروش
// =================================================================
async function updateAccountBalancesForSale(
  tx,
  paymentMethod,
  inventoryAccountId,
  customerSubAccountId,
  customerDetailAccountId,
  totalAmount,
  cashAccountId,
  bankDetailAccountId
) {
  console.log('📊 شروع به‌روزرسانی مانده حساب‌ها برای فروش');

  // ۱. کاهش مانده حساب موجودی کالا
  await tx.subAccount.update({
    where: { id: inventoryAccountId },
    data: { balance: { decrement: totalAmount } }
  });
  console.log(`📉 مانده حساب موجودی کالا کاهش یافت: ${totalAmount} ریال`);

  // ۲. افزایش مانده حساب مشتری
  await tx.subAccount.update({
    where: { id: customerSubAccountId },
    data: { balance: { increment: totalAmount } }
  });
  
  if (customerDetailAccountId) {
    await tx.detailAccount.update({
      where: { id: customerDetailAccountId },
      data: { balance: { increment: totalAmount } }
    });
  }
  console.log(`📈 مانده حساب مشتری افزایش یافت: ${totalAmount} ریال`);

  // ۳. بر اساس روش پرداخت، حساب دیگر را به‌روزرسانی کن
  switch (paymentMethod) {
    case 'cash': // افزایش مانده صندوق
      if (cashAccountId) {
        await tx.detailAccount.update({
          where: { id: cashAccountId },
          data: { balance: { increment: totalAmount } }
        });
        console.log(`📈 مانده حساب صندوق افزایش یافت: ${totalAmount} ریال`);
      }
      break;

    case 'cheque': // افزایش مانده چک‌های وارده
      const chequeAccount = await tx.subAccount.findFirst({
        where: { code: '1-02-0001' }
      });
      
      if (chequeAccount) {
        await tx.subAccount.update({
          where: { id: chequeAccount.id },
          data: { balance: { increment: totalAmount } }
        });
        console.log(`📈 مانده حساب چک‌های وارده افزایش یافت: ${totalAmount} ریال`);
      }
      break;

    case 'transfer': // افزایش مانده حساب بانک
      if (bankDetailAccountId) {
        const bankDetailAccount = await tx.detailAccount.findUnique({
          where: { id: bankDetailAccountId },
          include: { subAccount: true }
        });
        
        if (bankDetailAccount && bankDetailAccount.subAccount) {
          await tx.subAccount.update({
            where: { id: bankDetailAccount.subAccount.id },
            data: { balance: { increment: totalAmount } }
          });
          
          await tx.detailAccount.update({
            where: { id: bankDetailAccountId },
            data: { balance: { increment: totalAmount } }
          });
          
          console.log(`📈 مانده حساب بانک افزایش یافت: ${totalAmount} ریال`);
        }
      }
      break;

    case 'credit': // فقط حساب مشتری افزایش یافته
      console.log('✅ فروش نسیه - فقط حساب مشتری افزایش یافت');
      break;

    default:
      console.warn(`⚠️ روش پرداخت نامعتبر برای به‌روزرسانی مانده: ${paymentMethod}`);
  }

  console.log('✅ مانده حساب‌ها با موفقیت به‌روزرسانی شد');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get('invoiceNumber');
    
    if (invoiceNumber) {
      const sale = await prisma.voucher.findFirst({
        where: {
          description: {
            contains: invoiceNumber
          }
        },
        include: {
          items: {
            include: {
              subAccount: true,
              detailAccount: true
            }
          },
          cheques: true
        }
      });
      
      return NextResponse.json({ sale });
    }
    
    return NextResponse.json({ message: "API فروش فعال است" });
    
  } catch (error) {
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}