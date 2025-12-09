// src/app/api/detail-accounts/for-customers/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

// 👥 GET: دریافت حساب‌های تفصیلی مشتریان (بدهکاران تجاری)
export async function GET(request) {
  try {
    console.log("👥 دریافت حساب‌های تفصیلی مشتریان...");

    // پیدا کردن حساب معین بدهکاران تجاری (کد: 1-03-0001)
    const tradeDebtorsSubAccount = await prisma.subAccount.findFirst({
      where: {
        code: "1-03-0001",
      },
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
    });

    if (!tradeDebtorsSubAccount) {
      console.warn("⚠️ حساب معین بدهکاران تجاری (1-03-0001) یافت نشد");
      
      // تلاش برای ایجاد حساب معین اگر وجود ندارد
      try {
        // ابتدا حساب کل مربوطه را پیدا کن
        const parentCategory = await prisma.accountCategory.findFirst({
          where: {
            code: "1-03"
          }
        });

        if (parentCategory) {
          const newSubAccount = await prisma.subAccount.create({
            data: {
              code: "1-03-0001",
              name: "بدهکاران تجاری",
              categoryId: parentCategory.id,
            },
          });
          console.log("✅ حساب معین بدهکاران تجاری ایجاد شد:", newSubAccount);
          
          return NextResponse.json({
            accounts: [],
            subAccount: newSubAccount,
            message: "حساب معین بدهکاران تجاری ایجاد شد. لطفاً حساب‌های تفصیلی ایجاد کنید.",
          });
        }
      } catch (createError) {
        console.error("❌ خطا در ایجاد حساب معین:", createError);
      }
      
      return NextResponse.json({
        accounts: [],
        message: "حساب معین بدهکاران تجاری یافت نشد",
      });
    }

    console.log(
      "✅ حساب معین بدهکاران تجاری پیدا شد:",
      tradeDebtorsSubAccount
    );

    // دریافت تمام حساب‌های تفصیلی زیر این حساب معین
    const customerDetailAccounts = await prisma.detailAccount.findMany({
      where: {
        subAccountId: tradeDebtorsSubAccount.id,
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
            address: true,
          },
        },
      },
      orderBy: [
        {
          person: {
            name: "asc",
          },
        },
        {
          code: "asc",
        },
      ],
    });

    console.log(
      `✅ تعداد حساب‌های تفصیلی مشتریان یافت شده: ${customerDetailAccounts.length}`
    );

    // نمایش جزئیات برای دیباگ
    customerDetailAccounts.forEach((account, index) => {
      console.log(
        `   ${index + 1}. ${account.code} - ${account.name} - شخص: ${account.person?.name || "ندارد"}`
      );
    });

    return NextResponse.json({
      success: true,
      accounts: customerDetailAccounts,
      total: customerDetailAccounts.length,
      subAccount: tradeDebtorsSubAccount,
      message: "حساب‌های تفصیلی مشتریان با موفقیت دریافت شد",
    });
  } catch (error) {
    console.error("❌ خطا در دریافت حساب‌های مشتریان:", error);
    return NextResponse.json(
      {
        success: false,
        error: `خطا در دریافت حساب‌های مشتریان: ${error.message}`,
        accounts: [],
      },
      { status: 500 }
    );
  }
}