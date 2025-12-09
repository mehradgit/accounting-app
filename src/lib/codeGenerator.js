// src/lib/codeGenerator.js

/**
 * تولید کد جدید بر اساس نوع حساب و والد
 */
export function generateNextCode(
  accountType,
  parentAccount = null,
  existingCodes = {}
) {
  if (accountType === "category") {
    return generateCategoryCode(parentAccount, existingCodes.category);
  } else if (accountType === "subAccount") {
    return generateSubAccountCode(parentAccount, existingCodes.subAccount);
  } else if (accountType === "detailAccount") {
    return generateDetailAccountCode(
      parentAccount,
      existingCodes.detailAccount
    );
  }
  return "001";
}

/**
 * تولید کد برای حساب کل
 */
function generateCategoryCode(parentCategory, lastCategoryCode = "0") {
  // اگر والد داریم، کد را بر اساس والد تولید می‌کنیم
  if (parentCategory) {
    const parentCode = parentCategory.code;
    // پیدا کردن آخرین فرزند والد
    const childrenCodes = getChildrenCodes(parentCode, "category");
    const lastChildNumber = getLastChildNumber(childrenCodes);
    const nextNumber = lastChildNumber + 1;
    return `${parentCode}-${nextNumber.toString().padStart(2, "0")}`;
  }

  // حساب کل اصلی - بر اساس نوع
  const lastCode = parseInt(lastCategoryCode.split("-")[0]) || 0;
  const nextNumber = lastCode + 1;
  return nextNumber.toString();
}

/**
 * تولید کد برای حساب معین
 */
function generateSubAccountCode(parentCategory, lastSubAccountCode = "0") {
  if (!parentCategory) return "001";

  const parentCode = parentCategory.code;
  // پیدا کردن آخرین حساب معین این حساب کل
  const childrenCodes = getChildrenCodes(parentCode, "subAccount");
  const lastChildNumber = getLastChildNumber(childrenCodes);
  const nextNumber = lastChildNumber + 1;
  return `${parentCode}-${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * تولید کد برای حساب تفصیلی
 */
function generateDetailAccountCode(
  parentSubAccount,
  lastDetailAccountCode = "0"
) {
  if (!parentSubAccount) return "001";

  const parentCode = parentSubAccount.code;
  // پیدا کردن آخرین حساب تفصیلی این حساب معین
  const childrenCodes = getChildrenCodes(parentCode, "detailAccount");
  const lastChildNumber = getLastChildNumber(childrenCodes);
  const nextNumber = lastChildNumber + 1;
  return `${parentCode}-${nextNumber.toString().padStart(2, "0")}`;
}

/**
 * پیدا کردن کدهای فرزندان یک والد
 */
function getChildrenCodes(parentCode, accountType) {
  // این تابع باید از دیتابیس کدهای موجود را بخواند
  // فعلاً یک نمونه ساده برمی‌گردانیم
  return [];
}

/**
 * پیدا کردن آخرین شماره فرزند
 */
function getLastChildNumber(childrenCodes) {
  if (childrenCodes.length === 0) return 0;

  const lastCode = childrenCodes[childrenCodes.length - 1];
  const parts = lastCode.split("-");
  const lastPart = parts[parts.length - 1];
  return parseInt(lastPart) || 0;
}

/**
 * فرمت زیبا برای نمایش کد
 */
export function formatCodeForDisplay(code) {
  return code;
}

// تولید کد خودکار برای کالا
export function generateProductCode(categoryCode, lastCode) {
  if (!lastCode) {
    return `${categoryCode}-0001`;
  }

  const parts = lastCode.split("-");
  if (parts.length === 2) {
    const num = parseInt(parts[1]);
    return `${categoryCode}-${(num + 1).toString().padStart(4, "0")}`;
  }

  return generateSequentialCode(lastCode);
}

// تولید کد خودکار برای انبار
export function generateWarehouseCode(lastCode) {
  if (!lastCode) {
    return "WH-01";
  }

  const parts = lastCode.split("-");
  if (parts.length === 2) {
    const num = parseInt(parts[1]);
    return `WH-${(num + 1).toString().padStart(2, "0")}`;
  }

  return generateSequentialCode(lastCode);
}
export function generateInventoryDocumentNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // از شمارنده استفاده کن یا یک شماره ساده بساز
  return `INV-${year}${month}-${String(
    Math.floor(Math.random() * 10000)
  ).padStart(4, "0")}`;
}

export async function generateVoucherNumber(tx) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // شمارش اسناد امروز
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    let voucherCount;

    if (tx) {
      // اگر داخل تراکنیم هستیم
      voucherCount = await tx.voucher.count({
        where: {
          voucherDate: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });
    } else {
      // اگر خارج از تراکنش هستیم
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      voucherCount = await prisma.voucher.count({
        where: {
          voucherDate: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });

      await prisma.$disconnect();
    }

    const sequenceNumber = (voucherCount + 1).toString().padStart(4, "0");
    return `${year}${month}${sequenceNumber}`;
  } catch (error) {
    console.error("خطا در تولید شماره سند:", error);
    // شماره سند اضطراری
    const timestamp = Date.now().toString().slice(-6);
    return `V-${timestamp}`;
  }
}
