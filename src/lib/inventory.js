import {prisma} from './prisma';

// تولید شماره سند انبار
export async function generateInventoryDocumentNumber(type) {
  const prefixes = {
    PURCHASE: 'PUR',
    PURCHASE_RETURN: 'PRT',
    SALE: 'SAL',
    SALE_RETURN: 'SRT',
    TRANSFER_IN: 'TRI',
    TRANSFER_OUT: 'TRO',
    ADJUSTMENT_PLUS: 'ADP',
    ADJUSTMENT_MINUS: 'ADM',
    OPENING_BALANCE: 'OPN',
    default: 'INV'
  };

  const docPrefix = prefixes[type] || prefixes.default;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // پیدا کردن یا ایجاد شمارنده
  let counter = await prisma.inventoryCounter.findUnique({
    where: {
      prefix_year_month: {
        prefix: docPrefix,
        year,
        month
      }
    }
  });

  if (!counter) {
    counter = await prisma.inventoryCounter.create({
      data: {
        prefix: docPrefix,
        year,
        month,
        lastNumber: 0
      }
    });
  }

  const newNumber = counter.lastNumber + 1;
  
  // به‌روزرسانی شمارنده
  await prisma.inventoryCounter.update({
    where: { id: counter.id },
    data: { lastNumber: newNumber }
  });

  return `${docPrefix}-${year}${month.toString().padStart(2, '0')}-${newNumber.toString().padStart(4, '0')}`;
}

// ثبت سند انبار
export async function createInventoryDocument(data, userId) {
  const {
    type,
    warehouseId,
    personId,
    items,
    referenceNumber,
    description,
    documentDate = new Date(),
    createVoucher = false
  } = data;

  try {
    // تولید شماره سند
    const documentNumber = await generateInventoryDocumentNumber(type);

    // محاسبه مقادیر کل
    let totalQuantity = 0;
    let totalAmount = 0;
    
    const processedItems = [];
    
    for (const item of items) {
      const unitPrice = item.unitPrice || 0;
      const totalPrice = item.quantity * unitPrice;
      
      totalQuantity += item.quantity;
      totalAmount += totalPrice;
      
      // اعتبارسنجی موجودی برای خروجی‌ها
      if (type === 'SALE' || type === 'TRANSFER_OUT' || type === 'ADJUSTMENT_MINUS') {
        await validateStockAvailability(item.productId, warehouseId, item.quantity);
      }
      
      processedItems.push({
        ...item,
        unitPrice,
        totalPrice
      });
    }

    // ایجاد سند انبار
    const document = await prisma.inventoryDocument.create({
      data: {
        documentNumber,
        documentDate,
        typeId: await getTransactionTypeId(type),
        warehouseId,
        personId,
        referenceNumber,
        description,
        totalQuantity,
        totalAmount,
        createdBy: userId,
        ledgerEntries: {
          create: await Promise.all(processedItems.map(item => 
            createLedgerEntry(item, type, warehouseId, personId, documentNumber, documentDate)
          ))
        }
      },
      include: {
        ledgerEntries: {
          include: {
            product: true,
            warehouse: true
          }
        },
        warehouse: true,
        person: true,
        type: true
      }
    });

    // به‌روزرسانی موجودی انبار
    await updateStockQuantities(processedItems, warehouseId, type);

    // ایجاد سند حسابداری خودکار (در صورت نیاز)
    if (createVoucher && shouldCreateVoucher(type)) {
      const voucher = await createAutoVoucherForInventory(document, userId);
      if (voucher) {
        await prisma.inventoryDocument.update({
          where: { id: document.id },
          data: { voucherId: voucher.id }
        });
      }
    }

    return document;
    
  } catch (error) {
    console.error('Error creating inventory document:', error);
    throw error;
  }
}

// دریافت ID نوع تراکنش
async function getTransactionTypeId(typeCode) {
  const type = await prisma.inventoryTransactionType.findFirst({
    where: { code: typeCode }
  });
  
  if (!type) {
    throw new Error(`نوع تراکنش ${typeCode} یافت نشد`);
  }
  
  return type.id;
}

// ایجاد ردیف کاردکس
async function createLedgerEntry(item, type, warehouseId, personId, documentNumber, documentDate) {
  return {
    documentType: type,
    productId: item.productId,
    warehouseId,
    transactionDate: documentDate,
    reference: documentNumber,
    quantityIn: isInboundTransaction(type) ? item.quantity : 0,
    quantityOut: !isInboundTransaction(type) ? item.quantity : 0,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    personId,
    description: item.description
  };
}

// به‌روزرسانی موجودی انبار
async function updateStockQuantities(items, warehouseId, type) {
  for (const item of items) {
    const existingStock = await prisma.stockItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId
        }
      }
    });

    const quantityChange = isInboundTransaction(type) ? item.quantity : -item.quantity;

    if (existingStock) {
      await prisma.stockItem.update({
        where: { id: existingStock.id },
        data: {
          quantity: existingStock.quantity + quantityChange
        }
      });
    } else if (isInboundTransaction(type)) {
      await prisma.stockItem.create({
        data: {
          productId: item.productId,
          warehouseId,
          quantity: item.quantity
        }
      });
    }
  }
}

// اعتبارسنجی موجودی
async function validateStockAvailability(productId, warehouseId, requiredQuantity) {
  const stock = await prisma.stockItem.findUnique({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId
      }
    }
  });

  if (!stock || stock.quantity < requiredQuantity) {
    throw new Error(`موجودی ناکافی برای کالا. موجودی: ${stock?.quantity || 0}, مورد نیاز: ${requiredQuantity}`);
  }

  return true;
}

// بررسی نوع سند (ورودی یا خروجی)
function isInboundTransaction(type) {
  const inboundTypes = [
    'PURCHASE',
    'PURCHASE_RETURN',
    'SALE_RETURN',
    'TRANSFER_IN',
    'ADJUSTMENT_PLUS',
    'OPENING_BALANCE',
    'PRODUCTION_IN'
  ];
  
  return inboundTypes.includes(type);
}

// بررسی نیاز به ایجاد سند حسابداری
function shouldCreateVoucher(type) {
  const voucherRequiredTypes = [
    'PURCHASE',
    'PURCHASE_RETURN',
    'SALE',
    'SALE_RETURN'
  ];
  
  return voucherRequiredTypes.includes(type);
}

// گزارش موجودی انبار
export async function getStockReport(warehouseId = null, categoryId = null) {
  const where = {};
  
  if (warehouseId) {
    where.warehouseId = parseInt(warehouseId);
  }

  const stockItems = await prisma.stockItem.findMany({
    where,
    include: {
      product: {
        include: {
          category: true,
          unit: true,
          detailAccount: true
        }
      },
      warehouse: true
    },
    orderBy: {
      product: {
        code: 'asc'
      }
    }
  });

  // اگر فیلتر گروه کالا اعمال شده باشد
  let filteredItems = stockItems;
  if (categoryId) {
    filteredItems = stockItems.filter(item => 
      item.product.categoryId === parseInt(categoryId)
    );
  }

  // محاسبه مقادیر
  const report = filteredItems.map(item => {
    const totalValue = item.quantity * (item.product.defaultPurchasePrice || 0);
    
    return {
      id: item.id,
      productCode: item.product.code,
      productName: item.product.name,
      category: item.product.category.name,
      unit: item.product.unit.name,
      warehouse: item.warehouse.name,
      quantity: item.quantity,
      unitPrice: item.product.defaultPurchasePrice,
      totalValue,
      minStock: item.minStock || item.product.minStock,
      maxStock: item.maxStock || item.product.maxStock,
      reorderLevel: (item.minStock || item.product.minStock) * 1.2,
      isLowStock: item.quantity <= ((item.minStock || item.product.minStock) * 1.2)
    };
  });

  // آمار کلی
  const summary = {
    totalItems: report.length,
    totalQuantity: report.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: report.reduce((sum, item) => sum + item.totalValue, 0),
    lowStockItems: report.filter(item => item.isLowStock).length
  };

  return { report, summary };
}

// گزارش کاردکس
export async function getInventoryLedger(productId, warehouseId, startDate, endDate) {
  const where = {
    productId: parseInt(productId),
    warehouseId: parseInt(warehouseId),
    transactionDate: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  };

  const ledgers = await prisma.inventoryLedger.findMany({
    where,
    include: {
      product: true,
      warehouse: true,
      person: true,
      document: true,
      voucherItem: true
    },
    orderBy: [
      { transactionDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  // محاسبه موجودی انباشته
  let runningBalance = 0;
  let runningValue = 0;
  
  const processedLedgers = ledgers.map(ledger => {
    const isInbound = ledger.quantityIn > 0;
    
    if (isInbound) {
      runningBalance += ledger.quantityIn;
      runningValue += ledger.totalPrice;
    } else {
      runningBalance -= ledger.quantityOut;
      
      // محاسبه بهای تمام شده به روش میانگین
      const averagePrice = runningBalance > 0 ? runningValue / runningBalance : ledger.unitPrice;
      const cogs = ledger.quantityOut * averagePrice;
      runningValue -= cogs;
    }
    
    return {
      ...ledger,
      balanceQuantity: runningBalance,
      balanceValue: runningValue,
      averagePrice: runningBalance > 0 ? runningValue / runningBalance : 0
    };
  });

  return processedLedgers;
}