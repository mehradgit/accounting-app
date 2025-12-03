// src/app/api/inventory/documents/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    // Unwrap the params promise
    const { id } = await params;
    
    const documentId = parseInt(id);
    
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'شناسه سند نامعتبر است' },
        { status: 400 }
      );
    }

    const document = await prisma.inventoryDocument.findUnique({
      where: { id: documentId },
      include: {
        type: true,
        warehouse: true,
        person: true,
        voucher: {
          select: {
            id: true,
            voucherNumber: true,
            voucherDate: true,
          },
        },
        ledgerEntries: {
          include: {
            product: {
              include: {
                unit: true,
              },
            },
            warehouse: true,
            person: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'سند مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching inventory document:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات سند' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Unwrap the params promise
    const { id } = await params;
    
    const documentId = parseInt(id);
    
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'شناسه سند نامعتبر است' },
        { status: 400 }
      );
    }

    // بررسی وجود سند
    const document = await prisma.inventoryDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'سند مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // حذف سند در یک تراکنش
    await prisma.$transaction(async (tx) => {
      // حذف ردیف‌های کاردکس
      await tx.inventoryLedger.deleteMany({
        where: { documentId },
      });

      // حذف سند
      await tx.inventoryDocument.delete({
        where: { id: documentId },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'سند با موفقیت حذف شد' 
    });
  } catch (error) {
    console.error('Error deleting inventory document:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'امکان حذف سند به دلیل وجود وابستگی‌ها وجود ندارد' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'خطا در حذف سند' },
      { status: 500 }
    );
  }
}

// PUT برای ویرایش سند
export async function PUT(request, { params }) {
  try {
    // Unwrap the params promise
    const { id } = await params;
    
    const documentId = parseInt(id);
    
    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'شناسه سند نامعتبر است' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // بررسی وجود سند
    const existingDocument = await prisma.inventoryDocument.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'سند مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // به‌روزرسانی سند
    const updatedDocument = await prisma.inventoryDocument.update({
      where: { id: documentId },
      data: {
        documentDate: body.documentDate ? new Date(body.documentDate) : undefined,
        typeId: body.typeId ? parseInt(body.typeId) : undefined,
        warehouseId: body.warehouseId ? parseInt(body.warehouseId) : undefined,
        personId: body.personId ? parseInt(body.personId) : null,
        referenceNumber: body.referenceNumber !== undefined ? body.referenceNumber : undefined,
        description: body.description !== undefined ? body.description : undefined,
      },
      include: {
        type: true,
        warehouse: true,
        person: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'سند با موفقیت ویرایش شد',
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Error updating inventory document:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'اطلاعات تکراری' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'خطا در ویرایش سند' },
      { status: 500 }
    );
  }
}