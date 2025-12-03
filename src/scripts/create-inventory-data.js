// src/scripts/create-inventory-data.js
import { prisma } from '@/lib/prisma'

async function createInventoryData() {
  try {
    console.log('Creating inventory transaction types...')

    // ایجاد انواع تراکنش انبار
    const transactionTypes = await Promise.all([
      prisma.inventoryTransactionType.upsert({
        where: { code: 'RECEIVE' },
        update: {},
        create: {
          code: 'RECEIVE',
          name: 'دریافت کالا',
          effect: 'increase',
          description: 'ورود کالا به انبار'
        }
      }),
      prisma.inventoryTransactionType.upsert({
        where: { code: 'ISSUE' },
        update: {},
        create: {
          code: 'ISSUE',
          name: 'صدور کالا',
          effect: 'decrease',
          description: 'خروج کالا از انبار'
        }
      }),
      prisma.inventoryTransactionType.upsert({
        where: { code: 'PROD-CONSUME' },
        update: {},
        create: {
          code: 'PROD-CONSUME',
          name: 'مصرف تولید',
          effect: 'decrease',
          description: 'مصرف مواد اولیه در تولید'
        }
      }),
      prisma.inventoryTransactionType.upsert({
        where: { code: 'PRODUCTION' },
        update: {},
        create: {
          code: 'PRODUCTION',
          name: 'تولید محصول',
          effect: 'increase',
          description: 'ورود محصول تولید شده'
        }
      }),
      prisma.inventoryTransactionType.upsert({
        where: { code: 'TRANSFER' },
        update: {},
        create: {
          code: 'TRANSFER',
          name: 'انتقال بین انبارها',
          effect: 'increase',
          description: 'انتقال کالا بین انبارها'
        }
      })
    ])

    console.log('Creating sample warehouses...')

    // ایجاد انبارهای نمونه
    const warehouses = await Promise.all([
      prisma.warehouse.upsert({
        where: { code: 'MAIN' },
        update: {},
        create: {
          code: 'MAIN',
          name: 'انبار اصلی',
          address: 'تهران، خیابان اصلی',
          phone: '02112345678',
          manager: 'احمد رضایی'
        }
      }),
      prisma.warehouse.upsert({
        where: { code: 'PROD' },
        update: {},
        create: {
          code: 'PROD',
          name: 'انبار خط تولید',
          address: 'تهران، شهرک صنعتی',
          phone: '02187654321',
          manager: 'علی محمدی'
        }
      })
    ])

    console.log('Creating product categories...')

    // ایجاد گروه کالاها
    const categories = await Promise.all([
      prisma.productCategory.upsert({
        where: { code: 'RAW' },
        update: {},
        create: {
          code: 'RAW',
          name: 'مواد اولیه',
          description: 'مواد اولیه مورد استفاده در تولید'
        }
      }),
      prisma.productCategory.upsert({
        where: { code: 'FIN' },
        update: {},
        create: {
          code: 'FIN',
          name: 'محصولات نهایی',
          description: 'محصولات نهایی تولید شده'
        }
      })
    ])

    console.log('Creating units...')

    // ایجاد واحدهای اندازه‌گیری
    const units = await Promise.all([
      prisma.unit.upsert({
        where: { code: 'KG' },
        update: {},
        create: {
          code: 'KG',
          name: 'کیلوگرم',
          description: 'واحد وزن'
        }
      }),
      prisma.unit.upsert({
        where: { code: 'PC' },
        update: {},
        create: {
          code: 'PC',
          name: 'عدد',
          description: 'واحد تعداد'
        }
      }),
      prisma.unit.upsert({
        where: { code: 'LTR' },
        update: {},
        create: {
          code: 'LTR',
          name: 'لیتر',
          description: 'واحد حجم'
        }
      })
    ])

    console.log('Creating sample products...')

    // ایجاد محصولات نمونه
    const products = await Promise.all([
      // مواد اولیه
      prisma.product.upsert({
        where: { code: 'RAW-001' },
        update: {},
        create: {
          code: 'RAW-001',
          name: 'آهن خام',
          barcode: '123456789012',
          categoryId: categories[0].id,
          unitId: units[0].id,
          defaultPurchasePrice: 50000,
          defaultSalePrice: 55000,
          minStock: 100,
          maxStock: 1000
        }
      }),
      prisma.product.upsert({
        where: { code: 'RAW-002' },
        update: {},
        create: {
          code: 'RAW-002',
          name: 'رنگ خودرو',
          barcode: '123456789013',
          categoryId: categories[0].id,
          unitId: units[2].id,
          defaultPurchasePrice: 200000,
          defaultSalePrice: 220000,
          minStock: 50,
          maxStock: 500
        }
      }),
      // محصولات نهایی
      prisma.product.upsert({
        where: { code: 'FIN-001' },
        update: {},
        create: {
          code: 'FIN-001',
          name: 'ماشین لباسشویی مدل X1',
          barcode: '123456789014',
          categoryId: categories[1].id,
          unitId: units[1].id,
          defaultPurchasePrice: 5000000,
          defaultSalePrice: 6000000,
          minStock: 5,
          maxStock: 50
        }
      })
    ])

    console.log('Inventory data created successfully!')
    console.log(`Created:`)
    console.log(`- ${transactionTypes.length} transaction types`)
    console.log(`- ${warehouses.length} warehouses`)
    console.log(`- ${categories.length} product categories`)
    console.log(`- ${units.length} units`)
    console.log(`- ${products.length} products`)

  } catch (error) {
    console.error('Error creating inventory data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// اجرای اسکریپت
if (require.main === module) {
  createInventoryData()
}

export { createInventoryData }
