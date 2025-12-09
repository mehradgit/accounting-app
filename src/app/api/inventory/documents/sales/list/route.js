// src/app/api/inventory/documents/sales/list/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const invoiceNumber = searchParams.get('invoiceNumber');
    const skip = (page - 1) * limit;

    // پیدا کردن نوع تراکنش فروش
    const saleType = await prisma.inventoryTransactionType.findFirst({
      where: { 
        OR: [
          { code: 'SALE' },
          { name: { contains: 'فروش' } }
        ]
      }
    });

    if (!saleType) {
      return NextResponse.json(
        { error: 'نوع تراکنش فروش یافت نشد' },
        { status: 404 }
      );
    }

    // شرط‌های فیلتر
    const where = {
      typeId: saleType.id
    };

    if (startDate && endDate) {
      where.documentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (customerId) {
      where.personId = parseInt(customerId);
    }

    if (invoiceNumber) {
      where.OR = [
        { documentNumber: { contains: invoiceNumber } },
        { referenceNumber: { contains: invoiceNumber } }
      ];
    }

    // دریافت اسناد فروش
    const [documents, total] = await Promise.all([
      prisma.inventoryDocument.findMany({
        where,
        include: {
          type: true,
          warehouse: true,
          person: {
            select: { name: true }
          },
          voucher: {
            select: { 
              voucherNumber: true,
              totalAmount: true
            }
          },
          ledgerEntries: {
            select: {
              product: {
                select: { name: true, code: true }
              },
              quantityOut: true,
              totalPrice: true
            }
          }
        },
        orderBy: { documentDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.inventoryDocument.count({ where })
    ]);

    // محاسبه آمار
    const stats = await prisma.inventoryDocument.aggregate({
      where,
      _sum: {
        totalAmount: true,
        totalQuantity: true
      },
      _count: true
    });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalSales: stats._count,
        totalAmount: stats._sum.totalAmount || 0,
        totalQuantity: stats._sum.totalQuantity || 0
      }
    });

  } catch (error) {
    console.error('خطا در دریافت لیست فروش:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}