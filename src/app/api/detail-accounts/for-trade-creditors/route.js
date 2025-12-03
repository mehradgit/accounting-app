// src/app/api/detail-accounts/for-trade-creditors/route.js - نسخه اصلاح شده
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

// 🏢 GET: دریافت حساب‌های تفصیلی تامین‌کنندگان (بستانکاران تجاری)
export async function GET(request) {
  try {
    console.log("🏢 دریافت حساب‌های تفصیلی تامین‌کنندگان...");

    // پیدا کردن حساب معین بستانکاران تجاری (کد: 3-02-0001)
    const tradeCreditorsSubAccount = await prisma.subAccount.findFirst({
      where: {
        code: "3-02-0001",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!tradeCreditorsSubAccount) {
      console.warn("⚠️ حساب معین بستانکاران تجاری (3-02-0001) یافت نشد");
      return NextResponse.json({
        accounts: [],
        message: "حساب معین بستانکاران تجاری یافت نشد",
      });
    }

    console.log(
      "✅ حساب معین بستانکاران تجاری پیدا شد:",
      tradeCreditorsSubAccount
    );

    // دریافت تمام حساب‌های تفصیلی زیر این حساب معین
    const tradeCreditorsDetailAccounts = await prisma.detailAccount.findMany({
      where: {
        subAccountId: tradeCreditorsSubAccount.id,
      },
      include: {
        subAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            category: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        person: {
          select: {
            id: true,
            name: true,
            type: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    console.log(
      `✅ تعداد حساب‌های تفصیلی تامین‌کنندگان یافت شده: ${tradeCreditorsDetailAccounts.length}`
    );

    return NextResponse.json({
      accounts: tradeCreditorsDetailAccounts,
      total: tradeCreditorsDetailAccounts.length,
      subAccount: tradeCreditorsSubAccount,
      message: "حساب‌های تفصیلی تامین‌کنندگان با موفقیت دریافت شد",
    });
  } catch (error) {
    console.error("❌ خطا در دریافت حساب‌های تامین‌کنندگان:", error);
    return NextResponse.json(
      {
        error: `خطا در دریافت حساب‌های تامین‌کنندگان: ${error.message}`,
        accounts: [],
      },
      { status: 500 }
    );
  }
}
