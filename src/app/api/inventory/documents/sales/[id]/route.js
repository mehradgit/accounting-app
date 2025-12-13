import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "شناسه فاکتور نامعتبر است" },
        { status: 400 }
      );
    }

    // پیدا کردن سند انبار (فاکتور فروش)
    const document = await prisma.inventoryDocument.findUnique({
      where: { id: parseInt(id) },
      include: {
        type: true,
        warehouse: true,
        person: {
          include: {
            detailAccount: true,
          },
        },
        detailAccount: true, // ← این خط مهم است
        voucher: {
          include: {
            items: {
              include: {
                subAccount: true,
                detailAccount: true,
                person: true,
              },
            },
            cheques: {
              include: {
                bankDetailAccount: true,
                drawerDetailAccount: true,
              },
            },
          },
        },
        ledgerEntries: {
          include: {
            product: {
              include: {
                unit: true,
                category: true,
              },
            },
            warehouse: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "فاکتور فروش یافت نشد" },
        { status: 404 }
      );
    }

    // ============ اینجا لاگ بگذارید ============
    console.log("🔍 بررسی قیمت‌های ذخیره شده در دیتابیس:");
    if (document.ledgerEntries && document.ledgerEntries.length > 0) {
      document.ledgerEntries.forEach((entry, index) => {
        console.log(`   آیتم ${index + 1}:`, {
          product: entry.product?.name,
          quantityOut: entry.quantityOut,
          unitPriceInDB: entry.unitPrice,
          totalPriceInDB: entry.totalPrice,
          hasMetadata: !!entry.metadata,
          metadata: entry.metadata,
        });
      });
    }

    // محاسبه جمع‌های فاکتور
    const totals = {
      quantity: document.ledgerEntries.reduce(
        (sum, item) => sum + item.quantityOut,
        0
      ),
      amount: document.ledgerEntries.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      ),
      itemsCount: document.ledgerEntries.length,
    };

    // استخراج اطلاعات پرداخت ترکیبی از metadata
    const paymentDistribution = extractPaymentDistribution(document.voucher);

    // اطلاعات پرداخت
    const paymentInfo = {
      distribution: paymentDistribution,
      summary: calculatePaymentSummary(paymentDistribution, totals.amount),
      method: determinePaymentMethod(document.voucher, paymentDistribution),
      details: await getPaymentDetails(document, paymentDistribution),
    };

    return NextResponse.json({
      success: true,
      document,
      totals,
      payment: paymentInfo,
    });
  } catch (error) {
    console.error("خطا در دریافت جزئیات فاکتور:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در دریافت اطلاعات",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// استخراج توزیع پرداخت از metadata
function extractPaymentDistribution(voucher) {
  if (!voucher) return null;

  try {
    // اگر metadata وجود دارد
    if (voucher.metadata) {
      let metadata;
      if (typeof voucher.metadata === "string") {
        metadata = JSON.parse(voucher.metadata);
      } else {
        metadata = voucher.metadata;
      }
      return metadata.paymentDistribution || null;
    }
  } catch (error) {
    console.error("خطا در استخراج توزیع پرداخت:", error);
  }

  return null;
}

// محاسبه خلاصه پرداخت‌ها
function calculatePaymentSummary(paymentDistribution, totalAmount) {
  // اطمینان از وجود مقدار کل
  if (!totalAmount && paymentDistribution?.totalAmount) {
    totalAmount = paymentDistribution.totalAmount;
  }

  totalAmount = totalAmount || 0;

  if (!paymentDistribution) {
    return {
      cash: 0,
      cheque: 0,
      transfer: 0,
      credit: totalAmount,
      totalPaid: 0,
      remaining: totalAmount,
      totalAmount: totalAmount,
    };
  }

  const cash = paymentDistribution.cash?.amount || 0;
  const cheque = paymentDistribution.cheque?.amount || 0;
  const transfer = paymentDistribution.transfer?.amount || 0;
  const credit = paymentDistribution.credit?.amount || 0;

  // اگر totalAmount در distribution وجود دارد، استفاده کنیم
  const calculatedTotal =
    paymentDistribution.totalAmount || cash + cheque + transfer + credit;

  const totalPaid = cash + cheque + transfer;
  const remaining = credit;

  return {
    cash,
    cheque,
    transfer,
    credit,
    totalPaid,
    remaining,
    totalAmount: calculatedTotal || totalAmount,
  };
}

// تابع تشخیص روش پرداخت
function determinePaymentMethod(voucher, paymentDistribution) {
  if (paymentDistribution) {
    // اگر توزیع پرداخت ترکیبی داریم
    const summary = calculatePaymentSummary(paymentDistribution, 0);

    const methods = [];
    if (summary.cash > 0) methods.push("cash");
    if (summary.cheque > 0) methods.push("cheque");
    if (summary.transfer > 0) methods.push("transfer");
    if (summary.credit > 0) methods.push("credit");

    if (methods.length === 1) return methods[0];
    if (methods.length > 1) return "combined";
    return "unknown";
  }

  // روش قدیمی
  if (!voucher) return "نامشخص";

  const items = voucher.items || [];

  // بررسی صندوق
  const hasCash = items.some(
    (item) =>
      item.subAccount?.code === "1-01-0002" ||
      item.subAccount?.name?.includes("صندوق")
  );
  if (hasCash) return "cash";

  // بررسی چک
  const hasCheque = items.some(
    (item) =>
      item.subAccount?.code === "1-02-0001" ||
      item.subAccount?.name?.includes("چک")
  );
  if (hasCheque) return "cheque";

  // بررسی بانک
  const hasBank = items.some(
    (item) =>
      item.subAccount?.code === "1-01-0001" ||
      item.detailAccount?.subAccount?.code === "1-01-0001"
  );
  if (hasBank) return "transfer";

  // نسیه
  return "credit";
}

// تابع دریافت اطلاعات پرداخت
async function getPaymentDetails(document, paymentDistribution) {
  const details = {
    cash: null,
    cheques: [],
    transfer: null,
    credit: null,
  };

  // اگر توزیع پرداخت داریم
  if (paymentDistribution) {
    // اطلاعات نقدی
    if (paymentDistribution.cash?.amount > 0) {
      details.cash = {
        amount: paymentDistribution.cash.amount,
        accountId: paymentDistribution.cash.cashAccountId,
        accountName: await getAccountName(
          paymentDistribution.cash.cashAccountId
        ),
      };
    }

    // اطلاعات چک
    if (paymentDistribution.cheque?.amount > 0) {
      details.cheques = paymentDistribution.cheque.cheques || [];
      details.chequeAccountName = await getAccountName(
        paymentDistribution.cheque.chequeAccountId
      );
    }

    // اطلاعات حواله
    if (paymentDistribution.transfer?.amount > 0) {
      details.transfer = {
        amount: paymentDistribution.transfer.amount,
        bankAccountId: paymentDistribution.transfer.bankDetailAccountId,
        bankAccountName: await getBankAccountName(
          paymentDistribution.transfer.bankDetailAccountId
        ),
        description: paymentDistribution.transfer.description || "",
        trackingNumber: paymentDistribution.transfer.trackingNumber || "",
        transferDate: paymentDistribution.transfer.transferDate || "",
      };
    }

    // اطلاعات نسیه
    if (paymentDistribution.credit?.amount > 0) {
      details.credit = {
        amount: paymentDistribution.credit.amount,
      };
    }

    return details;
  }

  // روش قدیمی - اطلاعات از چک‌های ثبت شده
  if (document.voucher?.cheques && document.voucher.cheques.length > 0) {
    details.cheques = document.voucher.cheques.map((cheque) => ({
      chequeNumber: cheque.chequeNumber,
      bankName: cheque.bankName,
      dueDate: cheque.dueDate,
      amount: cheque.amount,
      description: cheque.description,
      status: cheque.status,
    }));
  }

  return details;
}

// تابع کمکی برای دریافت نام حساب
async function getAccountName(accountId) {
  if (!accountId) return "نامشخص";

  try {
    const account = await prisma.subAccount.findUnique({
      where: { id: accountId },
      select: { name: true, code: true },
    });

    if (account) {
      return `${account.code} - ${account.name}`;
    }

    const detailAccount = await prisma.detailAccount.findUnique({
      where: { id: accountId },
      select: { name: true, code: true },
    });

    if (detailAccount) {
      return `${detailAccount.code} - ${detailAccount.name}`;
    }

    return `حساب ${accountId}`;
  } catch (error) {
    console.error("خطا در دریافت نام حساب:", error);
    return "نامشخص";
  }
}

// تابع کمکی برای دریافت نام حساب بانک
async function getBankAccountName(accountId) {
  if (!accountId) return "نامشخص";

  try {
    const bank = await prisma.bank.findFirst({
      where: { detailAccountId: accountId },
      select: { name: true },
    });

    if (bank) {
      return bank.name;
    }

    const detailAccount = await prisma.detailAccount.findUnique({
      where: { id: accountId },
      select: { name: true, code: true },
    });

    if (detailAccount) {
      return `${detailAccount.code} - ${detailAccount.name}`;
    }

    return `حساب بانک ${accountId}`;
  } catch (error) {
    console.error("خطا در دریافت نام حساب بانک:", error);
    return "نامشخص";
  }
}

// امکان حذف فاکتور
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // بررسی وجود فاکتور
    const document = await prisma.inventoryDocument.findUnique({
      where: { id: parseInt(id) },
      include: { voucher: true, ledgerEntries: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: "فاکتور فروش یافت نشد" },
        { status: 404 }
      );
    }

    // عدم امکان حذف فاکتورهای دارای سند حسابداری
    if (document.voucherId) {
      return NextResponse.json(
        { error: "امکان حذف فاکتور دارای سند حسابداری وجود ندارد" },
        { status: 400 }
      );
    }

    // شروع تراکنش برای برگشت موجودی
    await prisma.$transaction(async (tx) => {
      // برگشت موجودی
      for (const ledger of document.ledgerEntries) {
        await tx.stockItem.updateMany({
          where: {
            productId: ledger.productId,
            warehouseId: ledger.warehouseId,
          },
          data: {
            quantity: { increment: ledger.quantityOut },
          },
        });
      }

      // حذف کاردکس
      await tx.inventoryLedger.deleteMany({
        where: { documentId: parseInt(id) },
      });

      // حذف سند انبار
      await tx.inventoryDocument.delete({
        where: { id: parseInt(id) },
      });
    });

    return NextResponse.json({
      success: true,
      message: "فاکتور فروش با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("خطا در حذف فاکتور:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطا در حذف فاکتور",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
