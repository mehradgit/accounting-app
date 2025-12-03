// src/app/api/detail-accounts/for-products/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request) {
  try {
    // حساب کل "موجودی کالا و مواد" کد آن باید "1-04" باشد
    const mainAccount = await prisma.accountCategory.findFirst({
      where: {
        code: "1-04"
      }
    });

    if (!mainAccount) {
      return NextResponse.json(
        { error: "حساب کل موجودی کالا و مواد یافت نشد" },
        { status: 404 }
      );
    }

    // دریافت تمام حساب‌های معین زیرمجموعه حساب کل 1-04
    const subAccounts = await prisma.subAccount.findMany({
      where: {
        categoryId: mainAccount.id
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    });

    // اگر حساب معینی وجود ندارد، آرایه خالی برگردانید
    if (subAccounts.length === 0) {
      return NextResponse.json([]);
    }

    const subAccountIds = subAccounts.map(sub => sub.id);

    // دریافت حساب‌های تفصیلی زیرمجموعه این حساب‌های معین
    const detailAccounts = await prisma.detailAccount.findMany({
      where: {
        subAccountId: {
          in: subAccountIds
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
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        code: "asc"
      }
    });

    // فرمت کردن خروجی برای نمایش بهتر
    const formattedAccounts = detailAccounts.map(account => ({
      id: account.id,
      code: account.code,
      name: account.name,
      fullName: `${account.code} - ${account.name}`,
      subAccount: account.subAccount
        ? {
            id: account.subAccount.id,
            code: account.subAccount.code,
            name: account.subAccount.name,
            fullName: `${account.subAccount.code} - ${account.subAccount.name}`
          }
        : null,
      category: account.subAccount?.category
        ? {
            code: account.subAccount.category.code,
            name: account.subAccount.category.name
          }
        : null
    }));

    return NextResponse.json(formattedAccounts);
  } catch (error) {
    console.error("Error in GET /api/detail-accounts/for-products:", error);
    return NextResponse.json(
      { error: `خطا در دریافت حساب‌های تفصیلی برای کالاها: ${error.message}` },
      { status: 500 }
    );
  }
}