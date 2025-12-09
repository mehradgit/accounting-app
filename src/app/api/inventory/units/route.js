import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: دریافت لیست واحدها
export async function GET(request) {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { code: "asc" },
    });

    // برگرداندن به صورت آبجکت با کلید units (مطابق انتظار کامپوننت)
    return NextResponse.json({ units });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "خطا در دریافت لیست واحدها" },
      { status: 500 }
    );
  }
}

// POST: ایجاد واحد جدید
export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.code || !data.name) {
      return NextResponse.json(
        { error: "کد و نام واحد اجباری هستند" },
        { status: 400 }
      );
    }

    // بررسی تکراری نبودن کد
    const existingUnit = await prisma.unit.findUnique({
      where: { code: data.code },
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: "کد واحد تکراری است" },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || "",
      },
    });

    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json({ error: "خطا در ایجاد واحد" }, { status: 500 });
  }
}