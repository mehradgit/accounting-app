// src/app/api/detail-accounts/for-bank-accounts/route.js - نسخه اصلاح شده
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

// 🏦 GET: دریافت حساب‌های تفصیلی بانکی (زیر حساب معین 1-01-0001)
export async function GET(request) {
  try {
    console.log("🏦 دریافت حساب‌های تفصیلی بانکی...");
    
    // پیدا کردن حساب معین بانک‌ها (کد: 1-01-0001)
    const banksSubAccount = await prisma.subAccount.findFirst({
      where: {
        code: "1-01-0001"
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    });

    if (!banksSubAccount) {
      console.warn("⚠️ حساب معین بانک‌ها (1-01-0001) یافت نشد");
      return NextResponse.json({
        accounts: [],
        message: "حساب معین بانک‌ها یافت نشد"
      });
    }

    console.log("✅ حساب معین بانک‌ها پیدا شد:", banksSubAccount);

    // دریافت تمام حساب‌های تفصیلی زیر این حساب معین
    const bankDetailAccounts = await prisma.detailAccount.findMany({
      where: {
        subAccountId: banksSubAccount.id
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
            type: true,
            phone: true,
            email: true
          }
        },
        banks: {
          select: {
            id: true,
            name: true,
            accountNumber: true
          }
        }
      },
      orderBy: {
        code: "asc"
      }
    });

    console.log(`✅ تعداد حساب‌های تفصیلی بانکی یافت شده: ${bankDetailAccounts.length}`);

    // همچنین حساب‌های تفصیلی که نامشان شامل "بانک" است را هم اضافه کنیم
    // برای MySQL، باید حروف کوچک/بزرگ را در خود کد مدیریت کنیم
    const allDetailAccounts = await prisma.detailAccount.findMany({
      include: {
        subAccount: {
          select: {
            id: true,
            code: true,
            name: true
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
        name: "asc"
      }
    });

    // فیلتر دستی برای حساب‌هایی که نامشان شامل "بانک" است
    const bankByNameAccounts = allDetailAccounts.filter(account => 
      account.name && account.name.toLowerCase().includes("بانک")
    );

    // ادغام دو لیست و حذف تکراری‌ها
    const allAccounts = [...bankDetailAccounts, ...bankByNameAccounts];
    const uniqueAccounts = [];
    const seenIds = new Set();

    allAccounts.forEach(account => {
      if (account && account.id && !seenIds.has(account.id)) {
        seenIds.add(account.id);
        uniqueAccounts.push(account);
      }
    });

    // مرتب‌سازی بر اساس کد
    uniqueAccounts.sort((a, b) => a.code.localeCompare(b.code));

    console.log(`✅ تعداد کل حساب‌های بانکی: ${uniqueAccounts.length}`);

    return NextResponse.json({
      accounts: uniqueAccounts,
      total: uniqueAccounts.length,
      subAccount: banksSubAccount,
      message: "حساب‌های تفصیلی بانکی با موفقیت دریافت شد"
    });

  } catch (error) {
    console.error("❌ خطا در دریافت حساب‌های بانکی:", error);
    return NextResponse.json(
      { 
        error: `خطا در دریافت حساب‌های بانکی: ${error.message}`,
        accounts: [] 
      },
      { status: 500 }
    );
  }
}