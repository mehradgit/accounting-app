// src/app/api/inventory/transaction-types/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

// GET: دریافت لیست انواع تراکنش‌ها
export async function GET(request) {
  try {
    const transactionTypes = await prisma.inventoryTransactionType.findMany({
      orderBy: { code: 'asc' }
    });
    
    // برگرداندن آرایه مستقیم
    return NextResponse.json(transactionTypes);
    
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست انواع تراکنش‌ها' },
      { status: 500 }
    );
  }
}

// POST: ایجاد نوع تراکنش جدید
export async function POST(request) {
  try {
    const data = await request.json();
    
    // بررسی تکراری نبودن کد
    const duplicate = await prisma.inventoryTransactionType.findUnique({
      where: { code: data.code }
    });
    
    if (duplicate) {
      return NextResponse.json(
        { error: 'کد نوع تراکنش تکراری است' },
        { status: 400 }
      );
    }
    
    const transactionType = await prisma.inventoryTransactionType.create({
      data: {
        code: data.code,
        name: data.name,
        effect: data.effect,
        description: data.description
      }
    });
    
    return NextResponse.json(transactionType, { status: 201 });
    
  } catch (error) {
    console.error('Error creating transaction type:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد نوع تراکنش' },
      { status: 500 }
    );
  }
}