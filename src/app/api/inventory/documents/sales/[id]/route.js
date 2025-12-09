// src/app/api/inventory/documents/sales/[id]/route.js
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

    // اطلاعات اضافی
    const paymentMethod = determinePaymentMethod(document.voucher);
    const paymentInfo = await getPaymentInfo(document.voucher);

    return NextResponse.json({
      document,
      totals,
      payment: {
        method: paymentMethod,
        info: paymentInfo,
      },
    });
  } catch (error) {
    console.error("خطا در دریافت جزئیات فاکتور:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// تابع تشخیص روش پرداخت
function determinePaymentMethod(voucher) {
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
async function getPaymentInfo(voucher) {
  if (!voucher) return null;

  // اگر چک دارد
  if (voucher.cheques && voucher.cheques.length > 0) {
    const cheque = voucher.cheques[0];
    return {
      type: "cheque",
      chequeNumber: cheque.chequeNumber,
      bankName: cheque.bankName,
      dueDate: cheque.dueDate,
      amount: cheque.amount,
    };
  }

  // اطلاعات از ردیف‌های سند
  const items = voucher.items || [];
  const cashItem = items.find((item) => item.subAccount?.code === "1-01-0002");
  const bankItem = items.find((item) => item.subAccount?.code === "1-01-0001");

  if (cashItem) {
    return {
      type: "cash",
      amount: cashItem.debit || cashItem.credit,
    };
  }

  if (bankItem) {
    return {
      type: "bank",
      accountName: bankItem.detailAccount?.name,
      amount: bankItem.debit || bankItem.credit,
    };
  }

  return {
    type: "credit",
    amount: voucher.totalAmount,
  };
}

// امکان حذف فاکتور (اختیاری)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // بررسی وجود فاکتور
    const document = await prisma.inventoryDocument.findUnique({
      where: { id: parseInt(id) },
      include: { voucher: true },
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
    const result = await prisma.$transaction(async (tx) => {
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

      return { success: true };
    });

    return NextResponse.json({
      success: true,
      message: "فاکتور فروش با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("خطا در حذف فاکتور:", error);
    return NextResponse.json({ error: "خطا در حذف فاکتور" }, { status: 500 });
  }
}
