import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    // اگر query خالی است، نتیجه خالی برمی‌گردانیم (یا می‌توان محبوب‌ها را برگرداند)
    if (!q) {
      return NextResponse.json({ products: [] });
    }

    // توجه: برخی نسخه‌های Prisma از 'mode: "insensitive"' پشتیبانی نمی‌کنند.
    // برای اجتناب از خطای Validation، 'mode' حذف شده و از contains ساده استفاده شده.
    const where = {
      OR: [
        { code: { contains: q } },
        { name: { contains: q } },
        { barcode: { contains: q } },
      ],
    };

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        barcode: true,
        defaultPurchasePrice: true,
        unit: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { code: "asc" },
      take: limit,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error in products/search:", error);
    return NextResponse.json({ error: "خطا در جستجوی محصولات" }, { status: 500 });
  }
}