// src/app/api/inventory/documents/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ایجاد شماره سند ساده
function generateDocNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    const where = {};

    if (type) {
      where.type = {
        code: type,
      };
    }

    if (startDate || endDate) {
      where.documentDate = {};

      if (startDate) {
        where.documentDate.gte = new Date(startDate);
      }

      if (endDate) {
        where.documentDate.lte = new Date(endDate);
      }
    }

    const [documents, total] = await Promise.all([
      prisma.inventoryDocument.findMany({
        where,
        include: {
          type: true,
          warehouse: true,
          person: true,
          voucher: true,
          ledgerEntries: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { documentDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryDocument.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching inventory documents:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات اسناد انبار" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📥 دریافت داده‌های سند انبار:", JSON.stringify(body, null, 2));

    const {
      typeId,
      warehouseId,
      personId,
      documentDate,
      referenceNumber,
      description,
      items = [],
      createVoucher = false,
    } = body;

    // اعتبارسنجی
    if (!typeId || !warehouseId || !documentDate) {
      return NextResponse.json(
        { error: "نوع سند، انبار و تاریخ سند الزامی هستند" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "حداقل یک کالا باید اضافه شود" },
        { status: 400 }
      );
    }

    // اعتبارسنجی آیتم‌ها
    for (const [index, item] of items.entries()) {
      if (!item.productId) {
        return NextResponse.json(
          { error: `کالا شماره ${index + 1}: انتخاب کالا الزامی است` },
          { status: 400 }
        );
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        return NextResponse.json(
          { error: `کالا شماره ${index + 1}: مقدار باید بزرگتر از صفر باشد` },
          { status: 400 }
        );
      }
    }

    // محاسبه جمع مقادیر
    const totalQuantity = items.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0
    );
    const totalAmount = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);

    console.log("📊 محاسبات:", { totalQuantity, totalAmount });

    // ایجاد شماره سند
    const documentNumber = generateDocNumber();
    console.log("🔢 شماره سند ایجاد شده:", documentNumber);

    // شروع تراکنش
    const result = await prisma.$transaction(async (tx) => {
      // ۱. ایجاد سند انبار
      const document = await tx.inventoryDocument.create({
        data: {
          documentNumber,
          documentDate: new Date(documentDate),
          typeId: parseInt(typeId),
          warehouseId: parseInt(warehouseId),
          personId: personId ? parseInt(personId) : null,
          referenceNumber: referenceNumber?.trim() || null,
          description: description?.trim() || null,
          totalQuantity,
          totalAmount,
          createdBy: 1,
        },
        include: {
          type: true,
          warehouse: true,
          person: true,
        },
      });

      console.log(`✅ سند انبار ایجاد شد:`, {
        id: document.id,
        number: document.documentNumber,
        type: document.type?.name,
        warehouse: document.warehouse?.name,
      });

      // ۲. ایجاد ردیف‌های کاردکس و به‌روزرسانی موجودی
      const ledgerEntries = [];

      for (const item of items) {
        const productId = parseInt(item.productId);
        const quantity = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const totalPrice = quantity * unitPrice;

        // پیدا کردن نوع تراکنش برای تعیین effect
        const transactionType = await tx.inventoryTransactionType.findUnique({
          where: { id: parseInt(typeId) },
        });

        if (!transactionType) {
          throw new Error(`نوع تراکنش با شناسه ${typeId} یافت نشد`);
        }

        // تعیین مقادیر ورودی/خروجی
        const quantityIn = transactionType.effect === "increase" ? quantity : 0;
        const quantityOut =
          transactionType.effect === "decrease" ? quantity : 0;

        // محاسبه موجودی انباشته
        // ابتدا آخرین موجودی این کالا در این انبار را پیدا کن
        const lastLedgerEntry = await tx.inventoryLedger.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(warehouseId),
          },
          orderBy: [
            { transactionDate: "desc" },
            { id: "desc" }
          ], // اصلاح این خط - آرایه باشد
        });

        const lastBalanceQuantity = lastLedgerEntry?.balanceQuantity || 0;
        const lastBalanceValue = lastLedgerEntry?.balanceValue || 0;

        // محاسبه موجودی جدید
        const newBalanceQuantity =
          lastBalanceQuantity + quantityIn - quantityOut;
        const newBalanceValue =
          lastBalanceValue + quantityIn * unitPrice - quantityOut * unitPrice;

        // ایجاد ردیف کاردکس
        const ledgerEntry = await tx.inventoryLedger.create({
          data: {
            documentId: document.id,
            productId: productId,
            warehouseId: parseInt(warehouseId),
            transactionDate: new Date(documentDate),
            reference: referenceNumber?.trim() || documentNumber,
            quantityIn,
            quantityOut,
            unitPrice,
            totalPrice,
            balanceQuantity: newBalanceQuantity,
            balanceValue: newBalanceValue,
            personId: personId ? parseInt(personId) : null,
            description: item.description?.trim() || null,
            createdBy: 1,
          },
          include: {
            product: true,
            warehouse: true,
            person: true,
          },
        });

        ledgerEntries.push(ledgerEntry);
        console.log(`📝 ردیف کاردکس ایجاد شد:`, {
          product: ledgerEntry.product?.name,
          quantityIn,
          quantityOut,
          balance: newBalanceQuantity,
        });

        // ۳. به‌روزرسانی موجودی انبار (StockItem)
        const existingStock = await tx.stockItem.findFirst({
          where: {
            productId: productId,
            warehouseId: parseInt(warehouseId),
          },
        });

        if (existingStock) {
          // موجودی قبلی وجود دارد
          const newQuantity =
            transactionType.effect === "increase"
              ? existingStock.quantity + quantity
              : existingStock.quantity - quantity;

          await tx.stockItem.update({
            where: { id: existingStock.id },
            data: {
              quantity: newQuantity,
              updatedAt: new Date(),
            },
          });

          console.log(`📦 موجودی به‌روزرسانی شد:`, {
            product: productId,
            oldQuantity: existingStock.quantity,
            newQuantity: newQuantity,
            change:
              transactionType.effect === "increase"
                ? `+${quantity}`
                : `-${quantity}`,
          });
        } else {
          // موجودی قبلی وجود ندارد (فقط برای افزایش موجودی ایجاد کن)
          if (transactionType.effect === "increase") {
            await tx.stockItem.create({
              data: {
                productId: productId,
                warehouseId: parseInt(warehouseId),
                quantity: quantity,
                minStock: 0,
                maxStock: 0,
              },
            });

            console.log(`🆕 موجودی جدید ایجاد شد:`, {
              product: productId,
              quantity: quantity,
            });
          } else {
            console.warn(
              `⚠️ نمی‌توان موجودی منفی ایجاد کرد برای محصول ${productId}`
            );
            // می‌توانید خطا بدهید یا صرفاً لاگ کنید
            // throw new Error(`موجودی کالا ${productId} در انبار ${warehouseId} وجود ندارد`);
          }
        }
      }

      return { document, ledgerEntries };
    });

    // ۴. اگر باید سند حسابداری ایجاد شود
    if (createVoucher) {
      console.log("💰 درخواست ایجاد سند حسابداری");
      // TODO: منطق ایجاد سند حسابداری
    }

    return NextResponse.json(
      {
        success: true,
        message: "سند انبار با موفقیت ایجاد شد",
        data: {
          document: result.document,
          ledgerEntries: result.ledgerEntries,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ خطا در ایجاد سند انبار:", error);

    // خطاهای خاص Prisma
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "شماره سند تکراری است" },
        { status: 400 }
      );
    }

    if (error.code === "P2003") {
      const field = error.meta?.field_name || "اطلاعات ارجاعی";
      return NextResponse.json(
        { error: `${field} نامعتبر است` },
        { status: 400 }
      );
    }

    // خطای موجودی منفی
    if (error.message && error.message.includes("موجودی کالا")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "خطا در ایجاد سند انبار",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}