// src/app/api/banks/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { generateDetailAccountCode } from "@lib/codeGenerator"; // فرض می‌کنیم این تابع وجود دارد

export async function GET() {
  try {
    // دریافت بانک‌ها از جدول banks
    const banks = await prisma.bank.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // برای هر بانک، موجودی واقعی را از حساب تفصیلی مرتبط محاسبه کنیم
    const banksWithRealBalance = await Promise.all(
      banks.map(async (bank) => {
        // پیدا کردن حساب تفصیلی مرتبط با این بانک
        const detailAccount = await prisma.detailAccount.findFirst({
          where: {
            OR: [{ name: bank.name }, { name: { contains: bank.name } }],
            subAccount: {
              code: "1-01-0001", // حساب معین بانک‌ها
            },
          },
          select: {
            id: true,
            code: true,
            name: true,
            balance: true,
          },
        });

        // اگر حساب تفصیلی پیدا شد، مانده آن را محاسبه کن
        let realBalance = 0;
        if (detailAccount) {
          // جمع تمام بدهکارها و بستانکارهای این حساب تفصیلی
          const voucherItems = await prisma.voucherItem.findMany({
            where: {
              detailAccountId: detailAccount.id,
            },
            select: {
              debit: true,
              credit: true,
            },
          });

          // محاسبه مانده واقعی
          voucherItems.forEach((item) => {
            realBalance += (item.debit || 0) - (item.credit || 0);
          });
        }

        return {
          ...bank,
          realBalance, // موجودی محاسبه شده از تراکنش‌ها
          storedBalance: bank.balance, // موجودی ذخیره شده در جدول banks
          detailAccount: detailAccount, // اطلاعات حساب تفصیلی مرتبط
        };
      })
    );

    return NextResponse.json(banksWithRealBalance);
  } catch (error) {
    console.error("Error in GET /api/banks:", error);
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات حساب‌های بانکی: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, accountNumber, balance } = body;

    // ۱. ایجاد حساب بانک
    const bank = await prisma.bank.create({
      data: {
        name,
        accountNumber,
        balance: parseFloat(balance) || 0,
      },
    });

    // ۲. یافتن حساب معین بانک (1-01-0001)
    const bankSubAccount = await prisma.subAccount.findFirst({
      where: {
        code: "1-01-0001",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!bankSubAccount) {
      // اگر حساب معین بانک وجود نداشت، آن را ایجاد می‌کنیم
      // اول حساب کل بانک‌ها را پیدا می‌کنیم
      const bankCategory = await prisma.accountCategory.findFirst({
        where: {
          code: "1-01",
          type: "asset",
        },
      });

      if (!bankCategory) {
        // اگر حساب کل بانک‌ها هم وجود ندارد، آن را ایجاد می‌کنیم
        const newCategory = await prisma.accountCategory.create({
          data: {
            code: "1-01",
            name: "بانک‌ها",
            type: "asset",
          },
        });

        // حالا حساب معین بانک را ایجاد می‌کنیم
        const newSubAccount = await prisma.subAccount.create({
          data: {
            code: "1-01-0001",
            name: "بانک‌ها",
            categoryId: newCategory.id,
          },
        });

        // ۳. ایجاد حساب تفصیلی جدید
        await createDetailAccountForBank(bank, newSubAccount.id);
      } else {
        // حساب معین بانک را ایجاد می‌کنیم
        const newSubAccount = await prisma.subAccount.create({
          data: {
            code: "1-01-0001",
            name: "بانک‌ها",
            categoryId: bankCategory.id,
          },
        });

        // ۳. ایجاد حساب تفصیلی جدید
        await createDetailAccountForBank(bank, newSubAccount.id);
      }
    } else {
      // ۳. ایجاد حساب تفصیلی جدید
      await createDetailAccountForBank(bank, bankSubAccount.id);
    }

    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/banks:", error);
    return NextResponse.json(
      { error: `خطا در ایجاد حساب بانک: ${error.message}` },
      { status: 500 }
    );
  }
}

// تابع کمکی برای ایجاد حساب تفصیلی بانک
async function createDetailAccountForBank(bank, subAccountId) {
  try {
    // تولید کد حساب تفصیلی (مثلاً 1-01-0001-001)
    const lastDetailAccount = await prisma.detailAccount.findFirst({
      where: {
        subAccountId: subAccountId,
      },
      orderBy: {
        code: "desc",
      },
    });

    let nextNumber = "001";
    if (lastDetailAccount && lastDetailAccount.code) {
      const parts = lastDetailAccount.code.split("-");
      if (parts.length >= 4) {
        const lastNumber = parseInt(parts[3]);
        nextNumber = (lastNumber + 1).toString().padStart(3, "0");
      }
    }

    const detailAccountCode = `1-01-0001-${nextNumber}`;

    // ایجاد حساب تفصیلی
    const detailAccount = await prisma.detailAccount.create({
      data: {
        code: detailAccountCode,
        name: bank.name,
        subAccountId: subAccountId,
        balance: parseFloat(bank.balance) || 0,
      },
    });

    console.log(
      `✅ حساب تفصیلی بانک ایجاد شد: ${detailAccountCode} - ${bank.name}`
    );

    return detailAccount;
  } catch (error) {
    console.error("Error creating detail account for bank:", error);
    throw error;
  }
}
