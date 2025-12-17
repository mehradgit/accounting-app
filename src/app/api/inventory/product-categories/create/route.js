// src/app/inventory/product-categories/create/route.js
import { prisma } from "@/lib/prisma";
import { getNextSequenceTx, formatCategoryCode } from "@/lib/codeGenerator";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "نام گروه الزامی است" }), { status: 400 });
    }

    const year = new Date().getFullYear().toString();

    const created = await prisma.$transaction(async (tx) => {
      const counter = await getNextSequenceTx(tx, "product_category", year);
      const code = formatCategoryCode(year, counter);
      const cat = await tx.productCategory.create({
        data: { name: name.trim(), description: description || "", code },
      });
      return cat;
    });

    return new Response(JSON.stringify({ success: true, category: created }), { status: 201 });
  } catch (err) {
    console.error("Error creating product category:", err);
    const message = err?.message || "Server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}