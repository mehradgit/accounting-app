// src/app/api/detail-accounts/for-expense-accounts/route.js - نسخه اصلاح شده
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

// 💰 GET: دریافت حساب‌های تفصیلی هزینه/خرید
export async function GET(request) {
  try {
    console.log("💰 دریافت حساب‌های تفصیلی هزینه/خرید...");
    
    // دریافت همه حساب‌های معین
    const allSubAccounts = await prisma.subAccount.findMany({
      select: {
        id: true,
        code: true,
        name: true
      }
    });

    // فیلتر دستی برای حساب‌های معین هزینه
    const expenseSubAccounts = allSubAccounts.filter(subAccount => {
      const code = subAccount.code || "";
      const name = subAccount.name || "";
      
      return (
        code.startsWith("6") || // حساب‌های هزینه
        code.startsWith("1-04") || // موجودی مواد اولیه
        name.toLowerCase().includes("خرید") ||
        name.toLowerCase().includes("مواد") ||
        name.toLowerCase().includes("هزینه")
      );
    });

    console.log(`✅ تعداد حساب‌های معین هزینه یافت شده: ${expenseSubAccounts.length}`);

    if (expenseSubAccounts.length === 0) {
      return NextResponse.json({
        accounts: [],
        message: "حساب معین هزینه‌ای یافت نشد"
      });
    }

    // دریافت حساب‌های تفصیلی زیر این حساب‌های معین
    const expenseDetailAccounts = await prisma.detailAccount.findMany({
      where: {
        subAccountId: {
          in: expenseSubAccounts.map(sa => sa.id)
        }
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
                name: true
              }
            }
          }
        },
        person: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        code: "asc"
      }
    });

    console.log(`✅ تعداد حساب‌های تفصیلی هزینه یافت شده: ${expenseDetailAccounts.length}`);

    return NextResponse.json({
      accounts: expenseDetailAccounts,
      total: expenseDetailAccounts.length,
      subAccounts: expenseSubAccounts,
      message: "حساب‌های تفصیلی هزینه/خرید با موفقیت دریافت شد"
    });

  } catch (error) {
    console.error("❌ خطا در دریافت حساب‌های هزینه:", error);
    return NextResponse.json(
      { 
        error: `خطا در دریافت حساب‌های هزینه: ${error.message}`,
        accounts: [] 
      },
      { status: 500 }
    );
  }
}