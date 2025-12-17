// src/app/inventory/products/create/route.js
import { prisma } from "@/lib/prisma";
import { getNextSequenceTx, formatProductCode } from "@/lib/codeGenerator";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, defaultSalePrice, defaultPurchasePrice, unitId, categoryId, sku, description } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "نام محصول لازم است" }), { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const counter = await getNextSequenceTx(tx, "product", ""); // period empty for simple numeric sequence
      const code = formatProductCode(counter, 4);

      const prod = await tx.product.create({
        data: {
          code,
          name: name.trim(),
          description: description || "",
          defaultSalePrice: defaultSalePrice ?? 0,
          defaultPurchasePrice: defaultPurchasePrice ?? 0,
          unitId: unitId ? parseInt(unitId) : null,
          categoryId: categoryId ? parseInt(categoryId) : null,
          sku: sku || null,
        },
      });

      return prod;
    });

    return new Response(JSON.stringify({ success: true, product: created }), { status: 201 });
  } catch (err) {
    console.error("Error creating product:", err);
    const message = err?.message || "Server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}