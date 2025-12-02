// src/app/api/banks/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log("Received bank ID from params:", id);

    if (!id) {
      return NextResponse.json(
        { error: "شناسه حساب بانکی ارسال نشده است" },
        { status: 400 }
      );
    }

    const bankId = parseInt(id);
    if (isNaN(bankId)) {
      return NextResponse.json(
        { error: "شناسه حساب بانکی باید عددی باشد" },
        { status: 400 }
      );
    }

    console.log("Searching for bank with ID:", bankId);

    // ۱. دریافت اطلاعات بانک
    const bank = await prisma.bank.findUnique({
      where: {
        id: bankId,
      },
    });

    if (!bank) {
      return NextResponse.json(
        { error: "حساب بانکی یافت نشد" },
        { status: 404 }
      );
    }

    // ۲. پیدا کردن حساب تفصیلی مرتبط با این بانک
    const bankDetailAccount = await prisma.detailAccount.findFirst({
      where: {
        name: {
          contains: bank.name,
        },
        subAccount: {
          code: "1-01-0001",
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        balance: true,
        createdAt: true,
      },
    });

    // ۳. دریافت تراکنش‌های مرتبط با این حساب تفصیلی
    let transactions = [];
    if (bankDetailAccount) {
      transactions = await prisma.voucherItem.findMany({
        where: {
          detailAccountId: bankDetailAccount.id,
        },
        include: {
          voucher: {
            select: {
              id: true,
              voucherNumber: true,
              voucherDate: true,
              description: true,
            },
          },
          subAccount: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          person: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          voucher: {
            voucherDate: "desc",
          },
        },
        take: 50, // آخرین ۵۰ تراکنش
      });
    }

    // ۴. محاسبه آمارهای مالی
    const financialStats = {
      totalDebit: 0,
      totalCredit: 0,
      transactionCount: transactions.length,
      lastTransactionDate:
        transactions.length > 0 ? transactions[0].voucher.voucherDate : null,
    };

    transactions.forEach((transaction) => {
      financialStats.totalDebit += transaction.debit || 0;
      financialStats.totalCredit += transaction.credit || 0;
    });

    // ۵. جمع‌آوری اطلاعات کامل
    const bankWithDetails = {
      ...bank,
      detailAccount: bankDetailAccount,
      transactions: transactions,
      financialStats: financialStats,
    };

    console.log("Bank details retrieved successfully");

    return NextResponse.json(bankWithDetails);
  } catch (error) {
    console.error("Error in GET bank API:", error);
    return NextResponse.json(
      { error: `خطای سرور: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "شناسه حساب بانکی ارسال نشده است" },
        { status: 400 }
      );
    }

    const bankId = parseInt(id);
    if (isNaN(bankId)) {
      return NextResponse.json(
        { error: "شناسه حساب بانکی باید عددی باشد" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, accountNumber, balance } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام حساب بانکی الزامی است" },
        { status: 400 }
      );
    }

    const bank = await prisma.bank.update({
      where: { id: bankId },
      data: {
        name: name.trim(),
        accountNumber: accountNumber?.trim() || null,
        balance: parseFloat(balance) || 0,
      },
    });

    return NextResponse.json(bank);
  } catch (error) {
    console.error("Error updating bank:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "شناسه حساب بانکی ارسال نشده است" },
        { status: 400 }
      );
    }

    const bankId = parseInt(id);
    if (isNaN(bankId)) {
      return NextResponse.json(
        { error: "شناسه حساب بانکی باید عددی باشد" },
        { status: 400 }
      );
    }

    await prisma.bank.delete({
      where: { id: bankId },
    });

    return NextResponse.json({ message: "حساب بانکی حذف شد" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
