// scripts/create-transaction-types.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTransactionTypes() {
  try {
    const transactionTypes = [
      {
        code: 'PROD-CONSUME',
        name: 'مصرف تولید',
        effect: 'decrease',
        description: 'مصرف مواد اولیه در فرآیند تولید'
      },
      {
        code: 'PROD-OUTPUT',
        name: 'تولید محصول',
        effect: 'increase',
        description: 'ثبت محصول نهایی تولید شده'
      },
      {
        code: 'PURCHASE',
        name: 'خرید',
        effect: 'increase',
        description: 'خرید مواد اولیه یا کالا'
      },
      {
        code: 'SALE',
        name: 'فروش',
        effect: 'decrease',
        description: 'فروش کالا'
      },
      {
        code: 'TRANSFER-IN',
        name: 'انتقال ورودی',
        effect: 'increase',
        description: 'انتقال از انبار دیگر'
      },
      {
        code: 'TRANSFER-OUT',
        name: 'انتقال خروجی',
        effect: 'decrease',
        description: 'انتقال به انبار دیگر'
      },
      {
        code: 'ADJUST-IN',
        name: 'تعدیل افزایشی',
        effect: 'increase',
        description: 'تعدیل مثبت موجودی'
      },
      {
        code: 'ADJUST-OUT',
        name: 'تعدیل کاهشی',
        effect: 'decrease',
        description: 'تعدیل منفی موجودی'
      },
      {
        code: 'RETURN-IN',
        name: 'مرجوعی خرید',
        effect: 'decrease',
        description: 'مرجوعی خرید به تامین کننده'
      },
      {
        code: 'RETURN-OUT',
        name: 'مرجوعی فروش',
        effect: 'increase',
        description: 'مرجوعی از مشتری'
      }
    ]

    console.log('Creating transaction types...')
    
    for (const type of transactionTypes) {
      const existing = await prisma.inventoryTransactionType.findUnique({
        where: { code: type.code }
      })
      
      if (!existing) {
        await prisma.inventoryTransactionType.create({ data: type })
        console.log(`Created: ${type.code} - ${type.name}`)
      } else {
        console.log(`Already exists: ${type.code}`)
      }
    }
    
    console.log('Transaction types created successfully!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTransactionTypes()