// src/app/api/cheques/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(request, { params }) {
  try {
    // Unwrap params promise با await
    const { id } = await params;
    
    const chequeId = parseInt(id);
    
    if (isNaN(chequeId)) {
      return NextResponse.json(
        { error: "شناسه چک معتبر نیست" },
        { status: 400 }
      );
    }

    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
      include: {
        person: { select: { id: true, name: true, type: true } },
        drawerAccount: { select: { id: true, code: true, name: true } },
        payeeAccount: { select: { id: true, code: true, name: true } },
        drawerDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: { select: { id: true, name: true } },
            subAccount: { select: { id: true, code: true, name: true } },
          },
        },
        payeeDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: { select: { id: true, name: true } },
            subAccount: { select: { id: true, code: true, name: true } },
          },
        },
        expenseDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            subAccount: { select: { id: true, code: true, name: true } },
          },
        },
        bankDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            subAccount: { select: { id: true, code: true, name: true } },
          },
        },
        voucher: {
          select: {
            id: true,
            voucherNumber: true,
            voucherDate: true,
            description: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!cheque) {
      return NextResponse.json(
        { error: "چک مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(cheque);
  } catch (error) {
    console.error("Error in GET /api/cheques/[id]:", error);
    return NextResponse.json(
      { error: `خطا در دریافت اطلاعات چک: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Unwrap params promise با await
    const { id } = await params;
    
    const chequeId = parseInt(id);
    
    if (isNaN(chequeId)) {
      return NextResponse.json(
        { error: "شناسه چک معتبر نیست" },
        { status: 400 }
      );
    }

    // بررسی وجود چک
    const existingCheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
    });

    if (!existingCheque) {
      return NextResponse.json(
        { error: "چک مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // حذف چک
    await prisma.cheque.delete({
      where: { id: chequeId },
    });

    console.log(`✅ چک حذف شد: ${chequeId}`);

    return NextResponse.json(
      { message: "چک با موفقیت حذف شد" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/cheques/[id]:", error);
    return NextResponse.json(
      { error: `خطا در حذف چک: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    // Unwrap params promise با await
    const { id } = await params;
    
    const chequeId = parseInt(id);
    
    if (isNaN(chequeId)) {
      return NextResponse.json(
        { error: "شناسه چک معتبر نیست" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, description } = body;

    // بررسی وجود چک
    const existingCheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
    });

    if (!existingCheque) {
      return NextResponse.json(
        { error: "چک مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // به‌روزرسانی چک
    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        status: status || existingCheque.status,
        description: description || existingCheque.description,
        updatedAt: new Date(),
      },
      include: {
        person: { select: { id: true, name: true, type: true } },
        drawerAccount: { select: { id: true, code: true, name: true } },
        payeeAccount: { select: { id: true, code: true, name: true } },
        drawerDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: { select: { id: true, name: true } },
          },
        },
        payeeDetailAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            person: { select: { id: true, name: true } },
          },
        },
        expenseDetailAccount: {
          select: { id: true, code: true, name: true, subAccount: true },
        },
        bankDetailAccount: { select: { id: true, code: true, name: true } },
        voucher: {
          select: { id: true, voucherNumber: true, voucherDate: true },
        },
      },
    });

    console.log(`✅ وضعیت چک به‌روزرسانی شد: ${chequeId} -> ${updatedCheque.status}`);

    return NextResponse.json(updatedCheque);
  } catch (error) {
    console.error("Error in PATCH /api/cheques/[id]:", error);
    return NextResponse.json(
      { error: `خطا در به‌روزرسانی چک: ${error.message}` },
      { status: 500 }
    );
  }
}