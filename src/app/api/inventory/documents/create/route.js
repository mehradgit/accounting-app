// src/app/api/inventory/documents/create/route.js - کد اصلاح شده
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInventoryDocumentNumber } from '@/lib/codeGenerator';
import { generateVoucherNumber } from '@/lib/utils';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📥 دریافت داده‌ها برای ایجاد سند انبار:', body);

    const {
      typeId,
      warehouseId,
      personId,
      documentDate,
      referenceNumber,
      description,
      items,
      paymentMethod, // 'cash', 'transfer', 'cheque', 'credit'
      bankDetailAccountId,
      expenseDetailAccountId,
      supplierDetailAccountId, // حساب تفصیلی تامین‌کننده
      paymentDescription,
      chequeData
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

    // ایجاد شماره سند انبار
    const documentNumber = generateInventoryDocumentNumber();

    // شروع تراکنش
    const result = await prisma.$transaction(async (tx) => {
      // =================================================================
      // 🏪 ۱. ایجاد سند انبار
      // =================================================================
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
          createdBy: 1
        }
      });

      console.log(`✅ سند انبار ایجاد شد: ${documentNumber}`);

      // =================================================================
      // 📦 ۲. ایجاد ردیف‌های کاردکس و به‌روزرسانی موجودی
      // =================================================================
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

        // پیدا کردن آخرین موجودی برای محاسبه موجودی انباشته
        const lastLedger = await tx.inventoryLedger.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(warehouseId)
          },
          orderBy: { id: 'desc' }
        });

        const previousBalanceQty = lastLedger?.balanceQuantity || 0;
        const previousBalanceValue = lastLedger?.balanceValue || 0;

        // محاسبه موجودی جدید
        const newBalanceQty = transactionType.effect === 'increase' 
          ? previousBalanceQty + quantity 
          : previousBalanceQty - quantity;
        
        const newBalanceValue = transactionType.effect === 'increase'
          ? previousBalanceValue + totalPrice
          : previousBalanceValue - totalPrice;

        // ایجاد ردیف کاردکس
        await tx.inventoryLedger.create({
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
            balanceQuantity: newBalanceQty,
            balanceValue: newBalanceValue,
            personId: personId ? parseInt(personId) : null,
            description: item.description || null,
            createdBy: 1
          }
        });

        // به‌روزرسانی موجودی انبار (StockItem)
        const existingStock = await tx.stockItem.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(warehouseId)
          }
        });

        if (existingStock) {
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
        } else if (transactionType.effect === 'increase') {
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

      console.log(`✅ موجودی‌های انبار به‌روزرسانی شد`);

      // =================================================================
      // 💰 ۳. ایجاد سند حسابداری (اگر پرداخت مشخص شده)
      // =================================================================
      let voucher = null;
      let cheque = null;

      if (paymentMethod && totalAmount > 0) {
        voucher = await createAccountingVoucher(
          tx,
          document,
          totalAmount,
          paymentMethod,
          bankDetailAccountId,
          expenseDetailAccountId,
          supplierDetailAccountId,
          paymentDescription,
          chequeData
        );

        // اگر چک ثبت شد
        if (chequeData && paymentMethod === 'cheque') {
          cheque = await createPurchaseCheque(
            tx,
            chequeData,
            personId,
            bankDetailAccountId,
            expenseDetailAccountId,
            voucher.id,
            supplierDetailAccountId
          );
        }

        // اتصال سند حسابداری به سند انبار
        await tx.inventoryDocument.update({
          where: { id: document.id },
          data: { voucherId: voucher.id }
        });
      }

      return { document, voucher, cheque };
    });

    return NextResponse.json({
      success: true,
      message: 'سند انبار با موفقیت ایجاد شد',
      document: result.document,
      voucher: result.voucher,
      cheque: result.cheque
    }, { status: 201 });

  } catch (error) {
    console.error('❌ خطا در ایجاد سند انبار:', error);
    
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

// =================================================================
// 📝 تابع اصلی برای ایجاد سند حسابداری
// =================================================================
async function createAccountingVoucher(
  tx,
  document,
  totalAmount,
  paymentMethod,
  bankDetailAccountId,
  expenseDetailAccountId,
  supplierDetailAccountId,
  paymentDescription,
  chequeData
) {
  console.log(`💰 شروع ایجاد سند حسابداری برای خرید - روش پرداخت: ${paymentMethod}`);
  
  // ایجاد شماره سند
  const lastVoucher = await tx.voucher.findFirst({ orderBy: { id: 'desc' } });
  const voucherNumber = generateVoucherNumber(lastVoucher?.id || 0);

  // توضیحات سند
  const voucherDescription = `خرید مواد اولیه از ${supplierDetailAccount?.name || 'تامین‌کننده'} - سند انبار ${document.documentNumber}${
  paymentDescription ? ` - ${paymentDescription}` : ''
}`;

  // ایجاد سند حسابداری
  const voucher = await tx.voucher.create({
    data: {
      voucherNumber,
      voucherDate: document.documentDate,
      description: voucherDescription,
      totalAmount: totalAmount,
      createdBy: 1
    }
  });

  console.log(`✅ سند حسابداری ایجاد شد: ${voucherNumber}`);

  // =================================================================
  // 🔍 ۱. پیدا کردن اطلاعات حساب‌ها
  // =================================================================
  
  // حساب هزینه/خرید
  let expenseDetailAccount = null;
  let expenseSubAccount = null;
  
  if (expenseDetailAccountId) {
    expenseDetailAccount = await tx.detailAccount.findUnique({
      where: { id: parseInt(expenseDetailAccountId) },
      include: { subAccount: true }
    });
    
    if (expenseDetailAccount) {
      expenseSubAccount = expenseDetailAccount.subAccount;
      console.log(`💰 حساب خرید: ${expenseDetailAccount.name} (${expenseSubAccount.code})`);
    }
  }

  // حساب تامین‌کننده
  let supplierDetailAccount = null;
  let supplierSubAccount = null;
  let supplierPerson = null;
  
  if (supplierDetailAccountId) {
    supplierDetailAccount = await tx.detailAccount.findUnique({
      where: { id: parseInt(supplierDetailAccountId) },
      include: { 
        subAccount: true,
        person: true 
      }
    });
    
    if (supplierDetailAccount) {
      supplierSubAccount = supplierDetailAccount.subAccount;
      supplierPerson = supplierDetailAccount.person;
      console.log(`🏢 تامین‌کننده: ${supplierDetailAccount.name} (${supplierSubAccount.code})`);
    }
  }

  // حساب بانک (برای حواله)
  let bankDetailAccount = null;
  let bankSubAccount = null;
  
  if (bankDetailAccountId) {
    bankDetailAccount = await tx.detailAccount.findUnique({
      where: { id: parseInt(bankDetailAccountId) },
      include: { subAccount: true }
    });
    
    if (bankDetailAccount) {
      bankSubAccount = bankDetailAccount.subAccount;
      console.log(`🏦 حساب بانک: ${bankDetailAccount.name} (${bankSubAccount.code})`);
    }
  }

  // =================================================================
  // 📝 ۲. ایجاد ردیف‌های سند بر اساس روش پرداخت
  // =================================================================
  
  if (paymentMethod === 'credit') {
    // خرید نسیه: فقط دو ردیف
    await createCreditPurchaseVoucherItems(
      tx,
      voucher,
      totalAmount,
      expenseSubAccount,
      expenseDetailAccount,
      supplierSubAccount,
      supplierDetailAccount,
      supplierPerson,
      document.documentNumber
    );
  } else {
    // سایر روش‌های پرداخت: دو یا چهار ردیف
    await createCashPurchaseVoucherItems(
      tx,
      voucher,
      totalAmount,
      paymentMethod,
      expenseSubAccount,
      expenseDetailAccount,
      supplierSubAccount,
      supplierDetailAccount,
      supplierPerson,
      bankDetailAccount,
      chequeData,
      document.documentNumber
    );
  }

  // =================================================================
  // 📈 ۳. به‌روزرسانی مانده حساب‌ها
  // =================================================================
  await updateAccountBalances(
    tx,
    paymentMethod,
    expenseSubAccount?.id,
    supplierSubAccount?.id,
    totalAmount,
    bankSubAccount?.id,
    expenseDetailAccount?.id,
    supplierDetailAccount?.id,
    bankDetailAccount?.id
  );

  return voucher;
}

// =================================================================
// 💳 تابع برای ایجاد ردیف‌های سند خرید نسیه (۲ ردیف)
// =================================================================
async function createCreditPurchaseVoucherItems(
  tx,
  voucher,
  totalAmount,
  expenseSubAccount,
  expenseDetailAccount,
  supplierSubAccount,
  supplierDetailAccount,
  supplierPerson,
  documentNumber
) {
  console.log('💳 ایجاد سند ۲ ردیفی برای خرید نسیه');
  
  // ردیف ۱: بدهکار کردن حساب خرید
  if (expenseDetailAccount && expenseSubAccount) {
    await tx.voucherItem.create({
      data: {
        voucherId: voucher.id,
        subAccountId: expenseSubAccount.id,
        detailAccountId: expenseDetailAccount.id,
        description: `۱. بدهکار: خرید نسیه مواد اولیه - سند انبار ${documentNumber}`,
        debit: totalAmount,
        credit: 0
      }
    });
    console.log(`📝 ردیف ۱ - بدهکار خرید: ${totalAmount} ریال`);
  }

  // ردیف ۲: بستانکار کردن حساب تامین‌کننده
  if (supplierDetailAccount && supplierSubAccount) {
    const creditItemData = {
      voucherId: voucher.id,
      subAccountId: supplierSubAccount.id,
      detailAccountId: supplierDetailAccount.id,
      description: `۲. بستانکار: بدهی نسیه به ${supplierDetailAccount.name} بابت خرید مواد`,
      debit: 0,
      credit: totalAmount
    };

    if (supplierPerson) {
      creditItemData.personId = supplierPerson.id;
    }

    await tx.voucherItem.create({ data: creditItemData });
    console.log(`📝 ردیف ۲ - بستانکار تامین‌کننده (نسیه): ${totalAmount} ریال`);
  }
}

// =================================================================
// 💰 تابع برای ایجاد ردیف‌های سند خرید نقدی/چک/حواله (۴ ردیف)
// =================================================================
async function createCashPurchaseVoucherItems(
  tx,
  voucher,
  totalAmount,
  paymentMethod,
  expenseSubAccount,
  expenseDetailAccount,
  supplierSubAccount,
  supplierDetailAccount,
  supplierPerson,
  bankDetailAccount,
  chequeData,
  documentNumber
) {
  console.log(`💰 ایجاد سند ۴ ردیفی برای خرید ${getPaymentMethodLabel(paymentMethod)}`);
  
  // ردیف ۱: بدهکار کردن حساب خرید
  if (expenseDetailAccount && expenseSubAccount) {
    await tx.voucherItem.create({
      data: {
        voucherId: voucher.id,
        subAccountId: expenseSubAccount.id,
        detailAccountId: expenseDetailAccount.id,
        description: `۱. بدهکار: خرید مواد اولیه - سند انبار ${documentNumber}`,
        debit: totalAmount,
        credit: 0
      }
    });
    console.log(`📝 ردیف ۱ - بدهکار خرید: ${totalAmount} ریال`);
  }

  // ردیف ۲: بستانکار کردن حساب تامین‌کننده
  if (supplierDetailAccount && supplierSubAccount) {
    const creditItemData = {
      voucherId: voucher.id,
      subAccountId: supplierSubAccount.id,
      detailAccountId: supplierDetailAccount.id,
      description: `۲. بستانکار: بدهی به ${supplierDetailAccount.name} بابت خرید مواد`,
      debit: 0,
      credit: totalAmount
    };

    if (supplierPerson) {
      creditItemData.personId = supplierPerson.id;
    }

    await tx.voucherItem.create({ data: creditItemData });
    console.log(`📝 ردیف ۲ - بستانکار تامین‌کننده: ${totalAmount} ریال`);
  }

  // ردیف ۳: بدهکار کردن حساب تامین‌کننده (برای تسویه)
  if (supplierDetailAccount && supplierSubAccount) {
    const debitItemData = {
      voucherId: voucher.id,
      subAccountId: supplierSubAccount.id,
      detailAccountId: supplierDetailAccount.id,
      description: `۳. بدهکار: تسویه بدهی ${supplierDetailAccount.name} با ${getPaymentMethodLabel(paymentMethod)}`,
      debit: totalAmount,
      credit: 0
    };

    if (supplierPerson) {
      debitItemData.personId = supplierPerson.id;
    }

    await tx.voucherItem.create({ data: debitItemData });
    console.log(`📝 ردیف ۳ - بدهکار تامین‌کننده: ${totalAmount} ریال`);
  }

  // ردیف ۴: بستانکار کردن حساب پرداختی
  await createPaymentCreditLine(
    tx,
    voucher,
    totalAmount,
    paymentMethod,
    bankDetailAccount,
    chequeData,
    documentNumber
  );
}

// =================================================================
// 🏦 تابع برای ایجاد ردیف چهارم (بستانکار کردن حساب پرداختی)
// =================================================================
async function createPaymentCreditLine(
  tx,
  voucher,
  totalAmount,
  paymentMethod,
  bankDetailAccount,
  chequeData,
  documentNumber
) {
  console.log(`🏦 ایجاد ردیف چهارم برای روش پرداخت: ${paymentMethod}`);

  let description = '';
  let subAccountId = null;
  let detailAccountId = null;

  switch (paymentMethod) {
    case 'cash': // پرداخت نقدی
      // حساب صندوق
      const cashAccount = await tx.subAccount.findFirst({
        where: { 
          OR: [
            { code: '1-01-0002' },
            { name: { contains: 'صندوق' } }
          ]
        }
      });
      
      if (cashAccount) {
        subAccountId = cashAccount.id;
        description = `۴. بستانکار: پرداخت نقدی بابت خرید سند ${documentNumber}`;
        console.log(`💰 پیدا کردن حساب صندوق: ${cashAccount.code} - ${cashAccount.name}`);
      }
      break;

    case 'transfer': // پرداخت حواله
      if (bankDetailAccount) {
        subAccountId = bankDetailAccount.subAccountId;
        detailAccountId = bankDetailAccount.id;
        description = `۴. بستانکار: پرداخت حواله بانکی بابت خرید سند ${documentNumber}`;
        console.log(`🏦 پیدا کردن حساب بانک: ${bankDetailAccount.subAccount.code} - ${bankDetailAccount.name}`);
      }
      break;

    case 'cheque': // پرداخت چکی
      // حساب چک‌های پرداختنی
      const chequesPayableAccount = await tx.subAccount.findFirst({
        where: { code: '3-01-0001' }
      });
      
      if (chequesPayableAccount) {
        subAccountId = chequesPayableAccount.id;
        description = `۴. بستانکار: صدور چک شماره ${chequeData.chequeNumber} بابت خرید سند ${documentNumber}`;
        console.log(`🧾 پیدا کردن حساب چک‌های پرداختنی: ${chequesPayableAccount.code} - ${chequesPayableAccount.name}`);
      }
      break;

    default:
      console.error(`❌ روش پرداخت نامعتبر: ${paymentMethod}`);
      throw new Error(`روش پرداخت نامعتبر: ${paymentMethod}`);
  }

  if (subAccountId) {
    await tx.voucherItem.create({
      data: {
        voucherId: voucher.id,
        subAccountId: subAccountId,
        detailAccountId: detailAccountId,
        description: description,
        debit: 0,
        credit: totalAmount
      }
    });
    
    console.log(`📝 ردیف ۴ - بستانکار ${getPaymentMethodLabel(paymentMethod)}: ${totalAmount} ریال`);
  } else {
    console.warn('⚠️ ردیف ۴ ایجاد نشد - حساب مربوطه یافت نشد');
  }
}

// =================================================================
// 📊 تابع به‌روزرسانی مانده حساب‌ها
// =================================================================
async function updateAccountBalances(
  tx,
  paymentMethod,
  expenseSubAccountId,
  supplierSubAccountId,
  totalAmount,
  bankSubAccountId,
  expenseDetailAccountId = null,
  supplierDetailAccountId = null,
  bankDetailAccountId = null
) {
  console.log('📊 شروع به‌روزرسانی مانده حساب‌ها');

  // ۱. افزایش مانده حساب خرید
  if (expenseSubAccountId) {
    await tx.subAccount.update({
      where: { id: expenseSubAccountId },
      data: { balance: { increment: totalAmount } }
    });
    
    if (expenseDetailAccountId) {
      await tx.detailAccount.update({
        where: { id: expenseDetailAccountId },
        data: { balance: { increment: totalAmount } }
      });
    }
    
    console.log(`📈 مانده حساب خرید افزایش یافت: ${totalAmount} ریال`);
  }

  // ۲. بر اساس روش پرداخت، حساب دیگر را به‌روزرسانی کن
  if (paymentMethod === 'credit') {
    // خرید نسیه: افزایش مانده حساب تامین‌کننده
    if (supplierSubAccountId) {
      await tx.subAccount.update({
        where: { id: supplierSubAccountId },
        data: { balance: { increment: totalAmount } }
      });
      
      if (supplierDetailAccountId) {
        await tx.detailAccount.update({
          where: { id: supplierDetailAccountId },
          data: { balance: { increment: totalAmount } }
        });
      }
      
      console.log(`📈 مانده حساب تامین‌کننده افزایش یافت (بدهی نسیه): ${totalAmount} ریال`);
    }
  } else {
    // سایر روش‌های پرداخت: کاهش مانده حساب پرداختی
    switch (paymentMethod) {
      case 'cash': // صندوق
        const cashAccount = await tx.subAccount.findFirst({
          where: { 
            OR: [
              { code: '1-01-0002' },
              { name: { contains: 'صندوق' } }
            ]
          }
        });
        
        if (cashAccount) {
          await tx.subAccount.update({
            where: { id: cashAccount.id },
            data: { balance: { decrement: totalAmount } }
          });
          console.log(`📉 مانده حساب صندوق کاهش یافت: ${totalAmount} ریال`);
        }
        break;

      case 'transfer': // حساب بانک
        if (bankSubAccountId) {
          await tx.subAccount.update({
            where: { id: bankSubAccountId },
            data: { balance: { decrement: totalAmount } }
          });
          
          if (bankDetailAccountId) {
            await tx.detailAccount.update({
              where: { id: bankDetailAccountId },
              data: { balance: { decrement: totalAmount } }
            });
          }
          
          console.log(`📉 مانده حساب بانک کاهش یافت: ${totalAmount} ریال`);
        }
        break;

      case 'cheque': // چک‌های پرداختنی
        const chequesPayableAccount = await tx.subAccount.findFirst({
          where: { code: '3-01-0001' }
        });
        
        if (chequesPayableAccount) {
          await tx.subAccount.update({
            where: { id: chequesPayableAccount.id },
            data: { balance: { increment: totalAmount } }
          });
          console.log(`📈 مانده حساب چک‌های پرداختنی افزایش یافت: ${totalAmount} ریال`);
        }
        break;
    }
  }

  console.log('✅ مانده حساب‌ها با موفقیت به‌روزرسانی شد');
}

// =================================================================
// 🏷️ تابع کمکی برای دریافت عنوان روش پرداخت
// =================================================================
function getPaymentMethodLabel(paymentMethod) {
  const labels = {
    'cash': 'صندوق',
    'transfer': 'حساب بانک',
    'cheque': 'چک پرداختنی',
    'credit': 'نسیه'
  };
  return labels[paymentMethod] || paymentMethod;
}

// =================================================================
// 🧾 تابع برای ایجاد چک خرید (بدون تغییر)
// =================================================================
async function createPurchaseCheque(
  tx,
  chequeData,
  personId,
  bankDetailAccountId,
  expenseDetailAccountId,
  voucherId,
  supplierDetailAccountId
) {
  console.log('🧾 ایجاد چک برای خرید');
  
  try {
    // اطلاعات حساب تامین‌کننده
    let supplierDetailAccount = null;
    if (supplierDetailAccountId) {
      supplierDetailAccount = await tx.detailAccount.findUnique({
        where: { id: parseInt(supplierDetailAccountId) },
        include: { person: true }
      });
    }

    // اطلاعات حساب بانک
    let bankName = "بانک";
    let branchName = "مرکزی";
    
    if (bankDetailAccountId) {
      const bankDetailAccount = await tx.detailAccount.findUnique({
        where: { id: parseInt(bankDetailAccountId) },
        select: { name: true }
      });
      
      if (bankDetailAccount) {
        const nameParts = bankDetailAccount.name.split('-');
        bankName = nameParts[0]?.trim() || bankDetailAccount.name;
        branchName = nameParts[1]?.trim() || "مرکزی";
      }
    }
    
    // نام تامین‌کننده
    const payee = supplierDetailAccount?.person?.name || 
                 supplierDetailAccount?.name || 
                 "تامین‌کننده";
    
    // ایجاد چک
    const cheque = await tx.cheque.create({
      data: {
        chequeNumber: chequeData.chequeNumber.trim(),
        bankName: bankName,
        branchName: branchName,
        amount: parseFloat(chequeData.amount),
        issueDate: new Date(chequeData.issueDate),
        dueDate: new Date(chequeData.dueDate),
        drawer: "شرکت ما",
        payee: payee,
        type: "payable",
        description: `چک خرید مواد اولیه - ${chequeData.description || ''}`,
        status: "pending",
        issueReason: "expense",
        
        // ارتباط‌ها
        personId: personId,
        bankDetailAccountId: bankDetailAccountId ? parseInt(bankDetailAccountId) : null,
        expenseDetailAccountId: expenseDetailAccountId ? parseInt(expenseDetailAccountId) : null,
        payeeDetailAccountId: supplierDetailAccountId ? parseInt(supplierDetailAccountId) : null,
        voucherId: voucherId
      }
    });
    
    console.log(`✅ چک خرید ایجاد شد: ${cheque.chequeNumber}`);
    return cheque;
    
  } catch (error) {
    console.error('❌ خطا در ایجاد چک خرید:', error);
    throw error;
  }
}