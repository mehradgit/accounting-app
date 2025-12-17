// src/lib/codeGenerator.js
export async function getNextSequenceTx(tx, key, period) {
  // خواندن ردیف با قفل FOR UPDATE تا همزمانی کنترل شود
  const rows = await tx.$queryRawUnsafe(
    "SELECT id, `last` FROM `Sequence` WHERE `key` = ? AND `period` = ? FOR UPDATE",
    key,
    period
  );

  if (!rows || rows.length === 0) {
    // ایجاد ردیف جدید با last = 1
    await tx.$executeRawUnsafe(
      "INSERT INTO `Sequence` (`key`, `period`, `last`, `updatedAt`) VALUES (?, ?, 1, NOW())",
      key,
      period
    );
    return 1;
  } else {
    const id = rows[0].id;
    // افزایش atomic مقدار last
    await tx.$executeRawUnsafe(
      "UPDATE `Sequence` SET `last` = `last` + 1, `updatedAt` = NOW() WHERE id = ?",
      id
    );
    const newRow = await tx.$queryRawUnsafe(
      "SELECT `last` FROM `Sequence` WHERE id = ?",
      id
    );
    return Number(newRow[0].last);
  }
}

/* Formatters */

// دسته کالا: CAT-YYYY-0001
export function formatCategoryCode(year, counter, pad = 4) {
  return `CAT-${String(counter).padStart(pad, "0")}`;
}

// محصول: عددی ساده 4 رقمی
export function formatProductCode(counter, pad = 4) {
  return String(counter).padStart(pad, "0");
}

// دستور تولید: PRD-YYYY-0001
export function formatProductionOrderNumber(year, counter, pad = 4) {
  return `PRD-${year}-${String(counter).padStart(pad, "0")}`;
}

// خرید مواد: PUR-YYYY-0001
export function formatPurchaseNumber(year, counter, pad = 4) {
  return `PUR-${year}-${String(counter).padStart(pad, "0")}`;
}

// فاکتور فروش: SI-YYYY-0001
export function formatSalesInvoiceNumber(year, counter, pad = 4) {
  return `SI-${year}-${String(counter).padStart(pad, "0")}`;
}
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
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    // شمارنده برای این ماه
    const counter = await tx.voucher.aggregate({
      _count: {
        id: true,
      },
      where: {
        voucherNumber: {
          startsWith: `V-${year}${month}`,
        },
      },
    });

    const count = counter._count.id + 1;
    const serial = String(count).padStart(4, "0");

    const voucherNumber = `V-${year}${month}-${serial}`;

    // بررسی عدم تکراری بودن
    const existing = await tx.voucher.findUnique({
      where: { voucherNumber },
    });

    if (existing) {
      // اگر تکراری بود، شماره بعدی را امتحان کن
      return generateUniqueVoucherNumber(tx, year, month, count + 1);
    }

    return voucherNumber;
  } catch (error) {
    console.error("❌ خطا در تولید شماره سند:", error);
    // شماره اضطراری
    return `V-${Date.now()}`;
  }
}

async function generateUniqueVoucherNumber(tx, year, month, startCount) {
  for (let i = startCount; i < startCount + 100; i++) {
    const serial = String(i).padStart(4, "0");
    const voucherNumber = `V-${year}${month}-${serial}`;

    const existing = await tx.voucher.findUnique({
      where: { voucherNumber },
    });

    if (!existing) {
      return voucherNumber;
    }
  }

  // اگر همه تکراری بودند، از timestamp استفاده کن
  return `V-${year}${month}-${Date.now().toString().slice(-4)}`;
}
