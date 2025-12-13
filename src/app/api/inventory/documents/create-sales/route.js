// src/app/api/inventory/documents/create-sales/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  generateVoucherNumber,
  generateInventoryDocumentNumber,
} from "@/lib/codeGenerator";

const prisma = new PrismaClient();

export async function POST(request) {
  let transactionResult = null;

  try {
    const data = await request.json();

    // ==================== لاگ کامل داده‌های ورودی ====================
    console.log("\n" + "=".repeat(80));
    console.log("🚀 API CREATE-SALES شروع شد");
    console.log("=".repeat(80));
    console.log("📥 دریافت داده‌های فروش ترکیبی:");
    console.log(
      JSON.stringify(
        {
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate,
          customerDetailAccountId: data.customerDetailAccountId,
          warehouseId: data.warehouseId,
          inventoryAccountId: data.inventoryAccountId,
          itemsCount: data.items?.length || 0,
          totalSaleAmount: data.totalSaleAmount,
          totalCostAmount: data.totalCostAmount,
          profit: data.profit,
          hasPaymentDistribution: !!data.paymentDistribution,
          paymentDistribution: data.paymentDistribution
            ? {
                totalAmount: data.paymentDistribution.totalAmount,
                cash: data.paymentDistribution.cash
                  ? {
                      amount: data.paymentDistribution.cash.amount,
                      hasAccount: !!data.paymentDistribution.cash.cashAccountId,
                    }
                  : null,
                cheque: data.paymentDistribution.cheque
                  ? {
                      amount: data.paymentDistribution.cheque.amount,
                      chequesCount:
                        data.paymentDistribution.cheque.cheques?.length || 0,
                      hasAccount:
                        !!data.paymentDistribution.cheque.chequeAccountId,
                    }
                  : null,
                transfer: data.paymentDistribution.transfer
                  ? {
                      amount: data.paymentDistribution.transfer.amount,
                      hasAccount:
                        !!data.paymentDistribution.transfer.bankDetailAccountId,
                    }
                  : null,
                credit: data.paymentDistribution.credit
                  ? {
                      amount: data.paymentDistribution.credit.amount,
                    }
                  : null,
              }
            : null,
        },
        null,
        2
      )
    );

    // ==================== لاگ کامل اقلام ====================
    console.log("\n📦 جزئیات اقلام فاکتور:");
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, index) => {
        console.log(`   آیتم ${index + 1}:`, {
          productId: item.productId,
          quantity: item.quantity,
          salePrice: item.salePrice,
          costPrice: item.costPrice,
          description: item.description || "بدون شرح",
          calculated: {
            saleTotal: parseFloat(item.quantity) * parseFloat(item.salePrice),
            costTotal: parseFloat(item.quantity) * parseFloat(item.costPrice),
            profit:
              parseFloat(item.quantity) * parseFloat(item.salePrice) -
              parseFloat(item.quantity) * parseFloat(item.costPrice),
          },
        });
      });
    } else {
      console.log("   ❌ هیچ آیتمی در فاکتور وجود ندارد");
    }

    // ==================== اعتبارسنجی داده‌های ورودی ====================
    console.log("\n🔍 شروع اعتبارسنجی...");

    if (!data.invoiceNumber || !data.items || data.items.length === 0) {
      console.log("❌ اعتبارسنجی شکست خورد: اطلاعات ضروری ارسال نشده است");
      return NextResponse.json(
        { error: "اطلاعات ضروری ارسال نشده است" },
        { status: 400 }
      );
    }

    if (!data.warehouseId) {
      console.log("❌ اعتبارسنجی شکست خورد: انبار کالا مشخص نشده است");
      return NextResponse.json(
        { error: "انبار کالا مشخص نشده است" },
        { status: 400 }
      );
    }

    if (!data.inventoryAccountId) {
      console.log("❌ اعتبارسنجی شکست خورد: حساب موجودی کالا مشخص نشده است");
      return NextResponse.json(
        { error: "حساب موجودی کالا مشخص نشده است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی پرداخت ترکیبی
    if (!data.paymentDistribution) {
      console.log(
        "❌ اعتبارسنجی شکست خورد: اطلاعات توزیع پرداخت ارسال نشده است"
      );
      return NextResponse.json(
        { error: "اطلاعات توزیع پرداخت ارسال نشده است" },
        { status: 400 }
      );
    }

    const { cash, cheque, transfer, credit, totalAmount } =
      data.paymentDistribution;

    // اعتبارسنجی مبالغ
    const totalPaid =
      (cash?.amount || 0) + (cheque?.amount || 0) + (transfer?.amount || 0);
    const calculatedCredit = credit?.amount || 0;

    console.log("💰 اعتبارسنجی مبالغ:", {
      totalAmount: totalAmount,
      totalPaid: totalPaid,
      calculatedCredit: calculatedCredit,
      creditFromData: credit?.amount || 0,
      difference: Math.abs(totalPaid + calculatedCredit - totalAmount),
    });

    if (Math.abs(totalPaid + calculatedCredit - totalAmount) > 0.01) {
      console.log(
        "❌ اعتبارسنجی شکست خورد: مجموع پرداخت‌ها با مبلغ فاکتور برابر نیست"
      );
      return NextResponse.json(
        { error: "مجموع پرداخت‌ها با مبلغ فاکتور برابر نیست" },
        { status: 400 }
      );
    }

    console.log("✅ اعتبارسنجی موفق");

    // ==================== شروع تراکنش ====================
    console.log("\n🔄 شروع تراکنش دیتابیس...");
    transactionResult = await prisma.$transaction(async (tx) => {
      // ۱. پیدا کردن حساب مشتری (حساب تفصیلی)
      console.log("\n🔎 جستجوی حساب مشتری...");
      const customerDetailAccount = await tx.detailAccount.findUnique({
        where: { id: data.customerDetailAccountId },
        include: {
          subAccount: true,
          person: true,
        },
      });

      if (!customerDetailAccount) {
        console.log("❌ حساب مشتری یافت نشد");
        throw new Error("حساب مشتری یافت نشد");
      }
      console.log("✅ حساب مشتری یافت شد:", {
        id: customerDetailAccount.id,
        code: customerDetailAccount.code,
        name: customerDetailAccount.name,
        personName: customerDetailAccount.person?.name,
      });

      // ۲. پیدا کردن حساب موجودی کالا (حساب معین)
      console.log("\n🔎 جستجوی حساب موجودی کالا...");
      const inventoryAccount = await tx.subAccount.findUnique({
        where: { id: data.inventoryAccountId },
      });

      if (!inventoryAccount) {
        console.log("❌ حساب موجودی کالا یافت نشد");
        throw new Error("حساب موجودی کالا یافت نشد");
      }
      console.log("✅ حساب موجودی کالا یافت شد:", {
        id: inventoryAccount.id,
        code: inventoryAccount.code,
        name: inventoryAccount.name,
      });

      // ۳. پیدا کردن نوع تراکنش فروش (SALE)
      console.log("\n🔎 جستجوی نوع تراکنش فروش...");
      const saleTransactionType = await tx.inventoryTransactionType.findFirst({
        where: {
          OR: [
            { code: "SALE" },
            { name: { contains: "فروش" } },
            { name: { contains: "خروج" } },
          ],
        },
      });

      if (!saleTransactionType) {
        console.log("❌ نوع تراکنش فروش یافت نشد");
        throw new Error("نوع تراکنش فروش یافت نشد");
      }
      console.log("✅ نوع تراکنش فروش یافت شد:", {
        id: saleTransactionType.id,
        code: saleTransactionType.code,
        name: saleTransactionType.name,
        effect: saleTransactionType.effect,
      });

      // ۴. ایجاد سند انبار (برای کاهش موجودی)
      console.log("\n📄 ایجاد سند انبار...");
      const inventoryDocumentNumber = generateInventoryDocumentNumber();

      console.log("📝 اطلاعات سند انبار:", {
        documentNumber: inventoryDocumentNumber,
        documentDate: data.invoiceDate,
        typeId: saleTransactionType.id,
        warehouseId: parseInt(data.warehouseId),
        personId: customerDetailAccount.personId,
        referenceNumber: data.invoiceNumber,
        totalQuantity: data.totalQuantity,
        totalAmount: data.totalCostAmount,
      });

      const inventoryDocument = await tx.inventoryDocument.create({
        data: {
          documentNumber: inventoryDocumentNumber,
          documentDate: new Date(data.invoiceDate),
          typeId: saleTransactionType.id,
          warehouseId: parseInt(data.warehouseId),
          // هر دو فیلد را پر می‌کنیم برای سازگاری
          personId: customerDetailAccount.person?.id || null,
          detailAccountId: customerDetailAccount.id, // ← این مهم است
          referenceNumber: data.invoiceNumber,
          description: data.description || `فاکتور ${data.invoiceNumber}`,
          totalQuantity: data.totalQuantity,
          totalAmount: data.totalCostAmount,
          createdBy: 1,
        },
      });

      console.log("✅ سند انبار ایجاد شد با ID:", inventoryDocument.id);
      console.log("   اطلاعات مشتری ذخیره شده:", {
        detailAccountId: customerDetailAccount.id,
        detailAccountCode: customerDetailAccount.code,
        detailAccountName: customerDetailAccount.name,
        personId: customerDetailAccount.person?.id || "ندارد",
      }); // ۵. ثبت ردیف‌های کاردکس و کاهش موجودی
      console.log("\n📝 ثبت ردیف‌های کاردکس...");
      const ledgerEntries = [];

      for (const item of data.items) {
        const productId = parseInt(item.productId);
        const quantity = parseFloat(item.quantity);

        // ============ این بخش حیاتی است ============
        const salePrice = parseFloat(item.salePrice) || 0;
        const costPrice = parseFloat(item.costPrice) || 0;
        const totalSalePrice = quantity * salePrice;
        const totalCostPrice = quantity * costPrice;

        console.log(`\n🔍 پردازش آیتم محصول ${productId}:`, {
          quantity: quantity,
          salePrice: salePrice,
          costPrice: costPrice,
          totalSalePrice: totalSalePrice,
          totalCostPrice: totalCostPrice,
          description: item.description,
        });

        // محاسبه موجودی قبلی
        const lastLedger = await tx.inventoryLedger.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(data.warehouseId),
          },
          orderBy: { id: "desc" },
        });

        const previousBalanceQty = lastLedger?.balanceQuantity || 0;
        const previousBalanceValue = lastLedger?.balanceValue || 0;

        // محاسبه موجودی جدید (کاهش)
        const newBalanceQty = previousBalanceQty - quantity;
        const newBalanceValue = previousBalanceValue - totalCostPrice;

        console.log(`   📊 محاسبات موجودی:`, {
          previousBalanceQty: previousBalanceQty,
          previousBalanceValue: previousBalanceValue,
          newBalanceQty: newBalanceQty,
          newBalanceValue: newBalanceValue,
          quantityReduction: quantity,
          valueReduction: totalCostPrice,
        });

        // ایجاد ردیف کاردکس - اینجا قیمت‌ها باید ذخیره شوند
        console.log(`   💾 ذخیره سازی در InventoryLedger:`);
        console.log(`      unitPrice: ${salePrice} (قیمت فروش)`);
        console.log(`      totalPrice: ${totalSalePrice} (کل فروش)`);

        const ledgerEntry = await tx.inventoryLedger.create({
          data: {
            documentId: inventoryDocument.id,
            productId: productId,
            warehouseId: parseInt(data.warehouseId),
            transactionDate: new Date(data.invoiceDate),
            reference: data.invoiceNumber,
            quantityIn: 0,
            quantityOut: quantity,
            // ============ این دو فیلد مهم هستند ============
            unitPrice: salePrice, // قیمت فروش
            totalPrice: totalSalePrice, // کل مبلغ فروش
            // ==============================================
            balanceQuantity: newBalanceQty,
            balanceValue: newBalanceValue,
            personId: customerDetailAccount.personId,
            description: item.description || `فاکتور ${data.invoiceNumber}`,
            createdBy: 1,
            // ذخیره metadata برای اطمینان
            metadata: {
              salePrice: salePrice,
              costPrice: costPrice,
              saleTotal: totalSalePrice,
              costTotal: totalCostPrice,
              invoiceNumber: data.invoiceNumber,
              productId: productId,
              timestamp: new Date().toISOString(),
              source: "create-sales-api",
            },
          },
        });

        console.log(`   ✅ ledger ثبت شد با ID ${ledgerEntry.id}:`, {
          quantityOut: ledgerEntry.quantityOut,
          unitPrice: ledgerEntry.unitPrice,
          totalPrice: ledgerEntry.totalPrice,
          hasMetadata: !!ledgerEntry.metadata,
        });

        ledgerEntries.push(ledgerEntry);

        // به‌روزرسانی موجودی انبار (StockItem)
        console.log(`   🔄 به‌روزرسانی موجودی انبار...`);
        const existingStock = await tx.stockItem.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(data.warehouseId),
          },
        });

        if (existingStock) {
          const newQuantity = existingStock.quantity - quantity;

          await tx.stockItem.update({
            where: { id: existingStock.id },
            data: {
              quantity: newQuantity,
              updatedAt: new Date(),
            },
          });

          console.log(`   ✅ موجودی محصول ${productId} کاهش یافت:`, {
            previousQuantity: existingStock.quantity,
            newQuantity: newQuantity,
            reduction: quantity,
          });
        } else {
          console.log(
            `   ❌ محصول ${productId} در انبار ${data.warehouseId} موجود نیست`
          );
          throw new Error(
            `محصول ${productId} در انبار ${data.warehouseId} موجود نیست`
          );
        }
      }

      console.log(`\n✅ ${ledgerEntries.length} ردیف کاردکس ثبت شد`);

      // ۶. ایجاد سند حسابداری
      console.log("\n📄 ایجاد سند حسابداری...");
      const voucherNumber = await generateVoucherNumber(tx);

      const metadata = {
        paymentDistribution: {
          totalAmount: data.paymentDistribution.totalAmount,
          cash: data.paymentDistribution.cash
            ? {
                amount: data.paymentDistribution.cash.amount,
                cashAccountId: data.paymentDistribution.cash.cashAccountId,
              }
            : null,
          cheque: data.paymentDistribution.cheque
            ? {
                amount: data.paymentDistribution.cheque.amount,
                chequeAccountId:
                  data.paymentDistribution.cheque.chequeAccountId,
                chequesCount:
                  data.paymentDistribution.cheque.cheques?.length || 0,
              }
            : null,
          transfer: data.paymentDistribution.transfer
            ? {
                amount: data.paymentDistribution.transfer.amount,
                bankDetailAccountId:
                  data.paymentDistribution.transfer.bankDetailAccountId,
              }
            : null,
          credit: data.paymentDistribution.credit
            ? {
                amount: data.paymentDistribution.credit.amount,
              }
            : null,
        },
        invoiceNumber: data.invoiceNumber,
        warehouseId: data.warehouseId,
        customerId: data.customerDetailAccountId,
        itemsCount: data.items.length,
        ledgerEntriesCount: ledgerEntries.length,
        timestamp: new Date().toISOString(),
      };

      console.log("📝 اطلاعات سند حسابداری:", {
        voucherNumber: voucherNumber,
        voucherDate: data.invoiceDate,
        totalAmount: data.totalSaleAmount,
        metadataSize: JSON.stringify(metadata).length,
      });

      const voucher = await tx.voucher.create({
        data: {
          voucherNumber,
          voucherDate: new Date(data.invoiceDate),
          description: data.description || `فاکتور فروش ${data.invoiceNumber}`,
          totalAmount: data.totalSaleAmount,
          createdBy: 1,
          metadata: metadata,
        },
      });

      console.log("✅ سند حسابداری ایجاد شد با ID:", voucher.id);

      const voucherItems = [];

      // ۷. ردیف اول: بستانکار موجودی کالا، بدهکار مشتری (کل مبلغ فاکتور)
      console.log("\n📝 ایجاد ردیف‌های سند حسابداری...");

      // ردیف ۱: بستانکار موجودی کالا
      voucherItems.push({
        voucherId: voucher.id,
        subAccountId: inventoryAccount.id,
        detailAccountId: null,
        description: `فروش ${data.invoiceNumber} - کسر موجودی کالا`,
        credit: data.totalSaleAmount,
        debit: 0,
      });

      // ردیف ۲: بدهکار مشتری
      voucherItems.push({
        voucherId: voucher.id,
        subAccountId: customerDetailAccount.subAccountId,
        detailAccountId: customerDetailAccount.id,
        description: `فاکتور ${data.invoiceNumber} - بدهکار مشتری`,
        credit: 0,
        debit: data.totalSaleAmount,
      });

      console.log("   ✅ ردیف اول و دوم سند ثبت شد");

      // ۸. ردیف‌های تسویه حساب بر اساس پرداخت ترکیبی
      let paymentCounter = 2;

      // پرداخت نقدی
      if (cash?.amount > 0) {
        paymentCounter++;

        console.log(`   💰 پرداخت نقدی: ${cash.amount} ریال`);

        const cashDetailAccount = await tx.detailAccount.findUnique({
          where: { id: cash.cashAccountId },
          include: { subAccount: true },
        });

        if (!cashDetailAccount) {
          throw new Error("حساب صندوق یافت نشد");
        }

        // بستانکار مشتری، بدهکار صندوق
        voucherItems.push({
          voucherId: voucher.id,
          subAccountId: customerDetailAccount.subAccountId,
          detailAccountId: customerDetailAccount.id,
          description: `تسویه نقدی ${data.invoiceNumber} - بستانکار مشتری`,
          credit: cash.amount,
          debit: 0,
        });

        voucherItems.push({
          voucherId: voucher.id,
          subAccountId: cashDetailAccount.subAccountId,
          detailAccountId: cashDetailAccount.id,
          description: `دریافت نقدی ${data.invoiceNumber} - بدهکار صندوق`,
          credit: 0,
          debit: cash.amount,
        });

        console.log(
          `   ✅ ردیف ${
            paymentCounter - 1
          } و ${paymentCounter} سند (نقدی) ثبت شد`
        );
      }

      // پرداخت چکی
      if (cheque?.amount > 0) {
        paymentCounter++;

        console.log(`   🧾 پرداخت چکی: ${cheque.amount} ریال`);

        // بستانکار مشتری، بدهکار چک‌های وارده
        voucherItems.push({
          voucherId: voucher.id,
          subAccountId: customerDetailAccount.subAccountId,
          detailAccountId: customerDetailAccount.id,
          description: `تسویه چکی ${data.invoiceNumber} - بستانکار مشتری`,
          credit: cheque.amount,
          debit: 0,
        });

        voucherItems.push({
          voucherId: voucher.id,
          subAccountId: cheque.chequeAccountId,
          detailAccountId: null,
          description: `دریافت چک ${data.invoiceNumber} - بدهکار چک‌های وارده`,
          credit: 0,
          debit: cheque.amount,
        });

        console.log(
          `   ✅ ردیف ${
            paymentCounter - 1
          } و ${paymentCounter} سند (چکی) ثبت شد`
        );

        // ثبت چک‌های دریافتنی
        if (cheque.cheques && cheque.cheques.length > 0) {
          console.log(`   📝 ثبت ${cheque.cheques.length} فقره چک...`);

          for (const chequeData of cheque.cheques) {
            const chequeRecord = await tx.cheque.create({
              data: {
                chequeNumber: chequeData.chequeNumber,
                bankName: chequeData.bankName || "نامشخص",
                amount: parseFloat(chequeData.amount),
                issueDate: new Date(chequeData.issueDate),
                dueDate: new Date(chequeData.dueDate),
                drawer: customerDetailAccount.name,
                payee: "شرکت",
                type: "receivable",
                status: "pending",
                description:
                  chequeData.description || `فاکتور ${data.invoiceNumber}`,
                drawerDetailAccountId: customerDetailAccount.id,
                payeeDetailAccountId: null,
                voucherId: voucher.id,
                personId: customerDetailAccount.personId,
              },
            });
            console.log(
              `      ✅ چک ${chequeData.chequeNumber} ثبت شد: ${chequeData.amount} ریال`
            );
          }
        }
      }

      // پرداخت حواله
      if (transfer?.amount > 0) {
        paymentCounter++;

        console.log(`   🏦 پرداخت حواله: ${transfer.amount} ریال`);

        const bankDetailAccount = await tx.detailAccount.findUnique({
          where: { id: transfer.bankDetailAccountId },
          include: { subAccount: true },
        });

        if (!bankDetailAccount) {
          throw new Error("حساب بانک یافت نشد");
        }

        // بستانکار مشتری، بدهکار حساب بانک
        voucherItems.push({
          voucherId: voucher.id,
          subAccountId: customerDetailAccount.subAccountId,
          detailAccountId: customerDetailAccount.id,
          description: `تسویه حواله ${data.invoiceNumber} - بستانکار مشتری`,
          credit: transfer.amount,
          debit: 0,
        });

        voucherItems.push({
          voucherId: voucher.id,
          subAccountId: bankDetailAccount.subAccountId,
          detailAccountId: bankDetailAccount.id,
          description: `دریافت حواله ${data.invoiceNumber} - ${bankDetailAccount.name}`,
          credit: 0,
          debit: transfer.amount,
        });

        console.log(
          `   ✅ ردیف ${
            paymentCounter - 1
          } و ${paymentCounter} سند (حواله) ثبت شد`
        );
      }

      // نسیه (باقیمانده)
      if (credit?.amount > 0) {
        console.log(
          `   📝 نسیه باقیمانده: ${credit.amount} ریال در حساب مشتری باقی ماند`
        );
      }

      // ۹. ثبت ردیف‌های سند
      console.log(`\n💾 ثبت ${voucherItems.length} ردیف سند حسابداری...`);
      await tx.voucherItem.createMany({
        data: voucherItems,
      });
      console.log("✅ ردیف‌های سند ثبت شدند");

      // ۱۰. اتصال سند حسابداری به سند انبار
      console.log("\n🔗 اتصال سند حسابداری به سند انبار...");
      await tx.inventoryDocument.update({
        where: { id: inventoryDocument.id },
        data: { voucherId: voucher.id },
      });
      console.log("✅ اتصال انجام شد");

      // ۱۱. به‌روزرسانی مانده حساب‌ها
      console.log("\n💰 به‌روزرسانی مانده حساب‌ها...");
      await updateAccountBalancesForCombinedPayment(
        tx,
        data.paymentDistribution,
        inventoryAccount.id,
        customerDetailAccount.subAccountId,
        customerDetailAccount.id
      );

      console.log("\n" + "=".repeat(80));
      console.log("🎉 تراکنش با موفقیت کامل شد!");
      console.log("=".repeat(80));

      return {
        voucher,
        inventoryDocument,
        chequeCount: cheque?.cheques?.length || 0,
        voucherItemsCount: voucherItems.length,
        ledgerEntriesCount: ledgerEntries.length,
        paymentSummary: {
          cash: cash?.amount || 0,
          cheque: cheque?.amount || 0,
          transfer: transfer?.amount || 0,
          credit: credit?.amount || 0,
          total: data.totalSaleAmount,
        },
        debug: {
          ledgerEntriesSample: ledgerEntries.slice(0, 2).map((le) => ({
            id: le.id,
            productId: le.productId,
            quantityOut: le.quantityOut,
            unitPrice: le.unitPrice,
            totalPrice: le.totalPrice,
            metadata: le.metadata,
          })),
        },
      };
    });

    // ==================== پاسخ موفق ====================
    console.log("\n📤 ارسال پاسخ موفق به کلاینت...");

    const successMessage = `✅ فاکتور فروش با موفقیت ثبت شد\n📄 شماره فاکتور: ${data.invoiceNumber}`;

    if (transactionResult.voucher) {
      console.log(
        `   📄 سند حسابداری: ${transactionResult.voucher.voucherNumber}`
      );
      console.log(
        `   💰 جمع فروش: ${transactionResult.voucher.totalAmount.toLocaleString()} ریال`
      );
    }

    if (transactionResult.chequeCount > 0) {
      console.log(`   🧾 تعداد چک‌ها: ${transactionResult.chequeCount} فقره`);
    }

    console.log(`   📊 ردیف‌های سند: ${transactionResult.voucherItemsCount}`);
    console.log(
      `   📦 ردیف‌های کاردکس: ${transactionResult.ledgerEntriesCount}`
    );

    return NextResponse.json({
      success: true,
      message: "فروش با پرداخت ترکیبی با موفقیت ثبت شد",
      ...transactionResult,
    });
  } catch (error) {
    console.error("\n" + "❌".repeat(40));
    console.error("❌ خطا در ثبت فروش ترکیبی:");
    console.error("❌".repeat(40));
    console.error("خطا:", error.message);
    console.error("کد خطا:", error.code);
    console.error("جزئیات:", error.meta);
    console.error("استک:", error.stack);

    if (transactionResult) {
      console.error(
        "داده‌های تراکنش:",
        JSON.stringify(transactionResult, null, 2)
      );
    }

    return NextResponse.json(
      {
        error: "خطا در ثبت فروش",
        message: error.message,
        code: error.code,
        meta: error.meta,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    console.log("\n🔚 اتصال به دیتابیس قطع شد");
  }
}

// =================================================================
// 📊 تابع به‌روزرسانی مانده حساب‌ها برای پرداخت ترکیبی
// =================================================================
async function updateAccountBalancesForCombinedPayment(
  tx,
  paymentDistribution,
  inventoryAccountId,
  customerSubAccountId,
  customerDetailAccountId
) {
  console.log("\n💰 شروع به‌روزرسانی مانده حساب‌ها برای پرداخت ترکیبی");

  const { cash, cheque, transfer, credit, totalAmount } = paymentDistribution;

  console.log("📊 اطلاعات پرداخت:", {
    totalAmount: totalAmount,
    cash: cash?.amount || 0,
    cheque: cheque?.amount || 0,
    transfer: transfer?.amount || 0,
    credit: credit?.amount || 0,
  });

  // ۱. کاهش مانده حساب موجودی کالا
  console.log(`\n📉 کاهش مانده حساب موجودی کالا (${inventoryAccountId})`);
  console.log(`   کاهش: ${totalAmount} ریال`);

  const inventoryBefore = await tx.subAccount.findUnique({
    where: { id: inventoryAccountId },
    select: { balance: true },
  });

  await tx.subAccount.update({
    where: { id: inventoryAccountId },
    data: { balance: { decrement: totalAmount } },
  });

  const inventoryAfter = await tx.subAccount.findUnique({
    where: { id: inventoryAccountId },
    select: { balance: true },
  });

  console.log(`   قبل: ${inventoryBefore?.balance || 0} ریال`);
  console.log(`   بعد: ${inventoryAfter?.balance || 0} ریال`);

  // ۲. افزایش مانده حساب مشتری (کل مبلغ فاکتور)
  console.log(`\n📈 افزایش مانده حساب مشتری (${customerSubAccountId})`);
  console.log(`   افزایش: ${totalAmount} ریال`);

  const customerSubBefore = await tx.subAccount.findUnique({
    where: { id: customerSubAccountId },
    select: { balance: true },
  });

  await tx.subAccount.update({
    where: { id: customerSubAccountId },
    data: { balance: { increment: totalAmount } },
  });

  const customerSubAfter = await tx.subAccount.findUnique({
    where: { id: customerSubAccountId },
    select: { balance: true },
  });

  console.log(`   قبل: ${customerSubBefore?.balance || 0} ریال`);
  console.log(`   بعد: ${customerSubAfter?.balance || 0} ریال`);

  if (customerDetailAccountId) {
    const customerDetailBefore = await tx.detailAccount.findUnique({
      where: { id: customerDetailAccountId },
      select: { balance: true },
    });

    await tx.detailAccount.update({
      where: { id: customerDetailAccountId },
      data: { balance: { increment: totalAmount } },
    });

    const customerDetailAfter = await tx.detailAccount.findUnique({
      where: { id: customerDetailAccountId },
      select: { balance: true },
    });

    console.log(
      `   (حساب تفصیلی) قبل: ${customerDetailBefore?.balance || 0} ریال`
    );
    console.log(
      `   (حساب تفصیلی) بعد: ${customerDetailAfter?.balance || 0} ریال`
    );
  }

  console.log("\n💵 پردازش روش‌های پرداخت...");

  // ۳. کاهش مانده حساب مشتری برای پرداخت‌های انجام شده
  let totalPaid = 0;

  // پرداخت نقدی
  if (cash?.amount > 0 && cash?.cashAccountId) {
    totalPaid += cash.amount;
    console.log(`\n💰 پرداخت نقدی: ${cash.amount} ریال`);

    // کاهش مانده حساب مشتری
    console.log(`   کاهش مانده حساب مشتری: ${cash.amount} ریال`);
    await tx.subAccount.update({
      where: { id: customerSubAccountId },
      data: { balance: { decrement: cash.amount } },
    });

    if (customerDetailAccountId) {
      await tx.detailAccount.update({
        where: { id: customerDetailAccountId },
        data: { balance: { decrement: cash.amount } },
      });
    }

    // افزایش مانده حساب صندوق
    console.log(
      `   افزایش مانده حساب صندوق (${cash.cashAccountId}): ${cash.amount} ریال`
    );
    const cashAccountBefore = await tx.detailAccount.findUnique({
      where: { id: cash.cashAccountId },
      select: { balance: true },
    });

    await tx.detailAccount.update({
      where: { id: cash.cashAccountId },
      data: { balance: { increment: cash.amount } },
    });

    const cashAccountAfter = await tx.detailAccount.findUnique({
      where: { id: cash.cashAccountId },
      select: { balance: true },
    });

    console.log(`   صندوق قبل: ${cashAccountBefore?.balance || 0} ریال`);
    console.log(`   صندوق بعد: ${cashAccountAfter?.balance || 0} ریال`);
  }

  // پرداخت چکی
  if (cheque?.amount > 0 && cheque?.chequeAccountId) {
    totalPaid += cheque.amount;
    console.log(`\n🧾 پرداخت چکی: ${cheque.amount} ریال`);

    // کاهش مانده حساب مشتری
    console.log(`   کاهش مانده حساب مشتری: ${cheque.amount} ریال`);
    await tx.subAccount.update({
      where: { id: customerSubAccountId },
      data: { balance: { decrement: cheque.amount } },
    });

    if (customerDetailAccountId) {
      await tx.detailAccount.update({
        where: { id: customerDetailAccountId },
        data: { balance: { decrement: cheque.amount } },
      });
    }

    // افزایش مانده حساب چک‌های وارده
    console.log(
      `   افزایش مانده حساب چک‌های وارده (${cheque.chequeAccountId}): ${cheque.amount} ریال`
    );
    const chequeAccountBefore = await tx.subAccount.findUnique({
      where: { id: cheque.chequeAccountId },
      select: { balance: true },
    });

    await tx.subAccount.update({
      where: { id: cheque.chequeAccountId },
      data: { balance: { increment: cheque.amount } },
    });

    const chequeAccountAfter = await tx.subAccount.findUnique({
      where: { id: cheque.chequeAccountId },
      select: { balance: true },
    });

    console.log(`   چک‌ها قبل: ${chequeAccountBefore?.balance || 0} ریال`);
    console.log(`   چک‌ها بعد: ${chequeAccountAfter?.balance || 0} ریال`);
  }

  // پرداخت حواله
  if (transfer?.amount > 0 && transfer?.bankDetailAccountId) {
    totalPaid += transfer.amount;
    console.log(`\n🏦 پرداخت حواله: ${transfer.amount} ریال`);

    // کاهش مانده حساب مشتری
    console.log(`   کاهش مانده حساب مشتری: ${transfer.amount} ریال`);
    await tx.subAccount.update({
      where: { id: customerSubAccountId },
      data: { balance: { decrement: transfer.amount } },
    });

    if (customerDetailAccountId) {
      await tx.detailAccount.update({
        where: { id: customerDetailAccountId },
        data: { balance: { decrement: transfer.amount } },
      });
    }

    // افزایش مانده حساب بانک
    console.log(`   افزایش مانده حساب بانک (${transfer.bankDetailAccountId})`);
    const bankDetailAccount = await tx.detailAccount.findUnique({
      where: { id: transfer.bankDetailAccountId },
      include: { subAccount: true },
    });

    if (bankDetailAccount && bankDetailAccount.subAccount) {
      const bankSubBefore = await tx.subAccount.findUnique({
        where: { id: bankDetailAccount.subAccount.id },
        select: { balance: true },
      });

      await tx.subAccount.update({
        where: { id: bankDetailAccount.subAccount.id },
        data: { balance: { increment: transfer.amount } },
      });

      const bankSubAfter = await tx.subAccount.findUnique({
        where: { id: bankDetailAccount.subAccount.id },
        select: { balance: true },
      });

      console.log(`   بانک (معین) قبل: ${bankSubBefore?.balance || 0} ریال`);
      console.log(`   بانک (معین) بعد: ${bankSubAfter?.balance || 0} ریال`);

      const bankDetailBefore = await tx.detailAccount.findUnique({
        where: { id: transfer.bankDetailAccountId },
        select: { balance: true },
      });

      await tx.detailAccount.update({
        where: { id: transfer.bankDetailAccountId },
        data: { balance: { increment: transfer.amount } },
      });

      const bankDetailAfter = await tx.detailAccount.findUnique({
        where: { id: transfer.bankDetailAccountId },
        select: { balance: true },
      });

      console.log(
        `   بانک (تفصیلی) قبل: ${bankDetailBefore?.balance || 0} ریال`
      );
      console.log(
        `   بانک (تفصیلی) بعد: ${bankDetailAfter?.balance || 0} ریال`
      );
    }
  }

  // نسیه (باقیمانده)
  const creditAmount = credit?.amount || 0;
  console.log(`\n📝 نسیه باقیمانده: ${creditAmount} ریال`);

  // ۴. بررسی صحت محاسبات
  console.log("\n🔍 بررسی صحت محاسبات:");
  console.log(`   مبلغ کل فاکتور: ${totalAmount} ریال`);
  console.log(`   مجموع پرداخت‌ها: ${totalPaid} ریال`);
  console.log(`   نسیه باقیمانده: ${creditAmount} ریال`);
  console.log(`   مجموع: ${totalPaid + creditAmount} ریال`);

  const calculatedCredit = totalAmount - totalPaid;
  console.log(`   نسیه محاسبه شده: ${calculatedCredit} ریال`);

  if (Math.abs(creditAmount - calculatedCredit) > 0.01) {
    console.warn(
      `⚠️ اختلاف در محاسبه نسیه: ${creditAmount} vs ${calculatedCredit}`
    );
  }

  // مانده نهایی حساب مشتری
  const finalCustomerBalance = totalAmount - totalPaid;
  console.log(`\n📊 مانده نهایی حساب مشتری: ${finalCustomerBalance} ریال`);

  console.log("✅ مانده حساب‌ها با موفقیت به‌روزرسانی شد");
}
