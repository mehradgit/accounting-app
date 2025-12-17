// src/app/api/inventory/product-categories/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextSequenceTx, formatCategoryCode } from "@/lib/codeGenerator";

// GET: دریافت لیست گروه‌های کالا
export async function GET(request) {
  try {
    console.log("Fetching product categories...");

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const whereCondition = parentId
      ? { parentId: parseInt(parentId) }
      : { parentId: null };

    console.log("Where condition:", whereCondition);

    const categories = await prisma.productCategory.findMany({
      where: whereCondition,
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                products: true,
                children: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    console.log("Categories found:", categories.length);

    // اگر هیچ گروهی یافت نشد، یک گروه نمونه ایجاد کن (قبلاً فقط لاگ می‌زد)
    if (categories.length === 0) {
      console.log("No categories found.");
      // در صورت نیاز می‌توانید نمونه‌سازی را اینجا اضافه کنید
    }

    // برگرداندن آرایه مستقیم
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return NextResponse.json(
      { error: `خطا در دریافت لیست گروه‌های کالا: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST: ایجاد گروه کالا جدید — کد به صورت اتوماتیک تولید می‌شود
export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Creating product category:", data);

    const name = data.name?.trim();
    const description = data.description || "";
    const parentId = data.parentId ? parseInt(data.parentId) : null;

    if (!name) {
      return NextResponse.json({ error: "نام گروه الزامی است" }, { status: 400 });
    }

    // اگر می‌خواهید تکراری نبودن نام را بررسی کنید (اختیاری)
    const existingByName = await prisma.productCategory.findFirst({
      where: { name },
    });
    if (existingByName) {
      return NextResponse.json({ error: "گروهی با این نام قبلاً وجود دارد" }, { status: 400 });
    }

    // تولید کد به صورت atomically درون یک تراکنش (بدون رزرو پیش از ذخیره)
    const year = new Date().getFullYear().toString();

    const created = await prisma.$transaction(async (tx) => {
      const counter = await getNextSequenceTx(tx, "product_category", year);
      const code = formatCategoryCode(year, counter); // مثال: CAT-2025-0001

      const cat = await tx.productCategory.create({
        data: {
          code,
          name,
          description,
          parentId,
        },
        include: {
          parent: true,
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      });

      return cat;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating product category:", error);

    // handle unique constraint violation more politely if needed
    const msg = error?.message || "Server error";
    return NextResponse.json({ error: `خطا در ایجاد گروه کالا: ${msg}` }, { status: 500 });
  }
}