// src/app/inventory/documents/sales/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function SalesInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchInvoiceData();
    }
  }, [params.id]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/inventory/documents/sales/${params.id}`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در دریافت اطلاعات');
      }
    } catch (error) {
      console.error('خطا در دریافت فاکتور:', error);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>فاکتور فروش ${data?.document.referenceNumber}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: 'B Nazanin', Tahoma, sans-serif;
                direction: rtl;
                text-align: right;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .company-info {
                float: right;
                width: 50%;
              }
              .invoice-info {
                float: left;
                width: 50%;
              }
              .clearfix {
                clear: both;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #333;
                padding: 8px;
                text-align: center;
              }
              th {
                background-color: #f2f2f2;
              }
              .totals {
                margin-top: 30px;
                text-align: left;
              }
              .signatures {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
              }
              .footer {
                text-align: center;
                margin-top: 50px;
                font-size: 12px;
                color: #666;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این فاکتور اطمینان دارید؟')) return;
    
    try {
      const response = await fetch(`/api/inventory/documents/sales/${params.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('فاکتور با موفقیت حذف شد');
        router.push('/inventory/documents/sales-list');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'خطا در حذف فاکتور');
      }
    } catch (error) {
      console.error('خطا در حذف فاکتور:', error);
      alert('خطا در حذف فاکتور');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      cash: 'نقدی',
      cheque: 'چکی',
      transfer: 'حواله بانکی',
      credit: 'نسیه'
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال دریافت اطلاعات فاکتور...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'فاکتور فروش یافت نشد'}
          <button
            onClick={fetchInvoiceData}
            className="btn btn-sm btn-outline-danger me-2"
          >
            تلاش مجدد
          </button>
          <Link
            href="/inventory/documents/sales-list"
            className="btn btn-sm btn-outline-primary"
          >
            بازگشت به لیست
          </Link>
        </div>
      </div>
    );
  }

  const { document, totals, payment } = data;

  return (
    <div className="container-fluid py-4">
      {/* هدر */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">🧾 فاکتور فروش</h1>
          <p className="text-muted mb-0">
            شماره: <strong>{document.referenceNumber || document.documentNumber}</strong>
            <span className="mx-3">|</span>
            تاریخ: {formatDate(document.documentDate)}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={handlePrint}
            className="btn btn-outline-primary"
          >
            <i className="bi bi-printer me-2"></i>
            چاپ فاکتور
          </button>
          <Link
            href="/inventory/documents/sales-list"
            className="btn btn-outline-secondary"
          >
            بازگشت به لیست
          </Link>
          {!document.voucherId && (
            <button
              onClick={handleDelete}
              className="btn btn-outline-danger"
            >
              <i className="bi bi-trash me-2"></i>
              حذف فاکتور
            </button>
          )}
        </div>
      </div>

      {/* محتوای فاکتور (برای چاپ) */}
      <div id="invoice-content" style={{ display: 'none' }}>
        <div className="header">
          <h2>فاکتور فروش</h2>
          <h3>{document.referenceNumber || document.documentNumber}</h3>
        </div>
        
        <div className="company-info">
          <h4>شرکت فروشنده</h4>
          <p>شرکت نمونه</p>
          <p>تهران، خیابان نمونه</p>
          <p>تلفن: 021-12345678</p>
        </div>
        
        <div className="invoice-info">
          <p><strong>شماره فاکتور:</strong> {document.referenceNumber || document.documentNumber}</p>
          <p><strong>تاریخ:</strong> {formatDate(document.documentDate)}</p>
          <p><strong>مشتری:</strong> {document.person?.name || 'نامشخص'}</p>
          <p><strong>انبار:</strong> {document.warehouse?.name}</p>
        </div>
        
        <div className="clearfix"></div>
        
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>کد کالا</th>
              <th>نام کالا</th>
              <th>تعداد</th>
              <th>واحد</th>
              <th>قیمت واحد</th>
              <th>جمع</th>
            </tr>
          </thead>
          <tbody>
            {document.ledgerEntries.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.product?.code}</td>
                <td>{item.product?.name}</td>
                <td>{item.quantityOut.toLocaleString('fa-IR')}</td>
                <td>{item.product?.unit?.name}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="totals">
          <p><strong>تعداد اقلام:</strong> {totals.itemsCount}</p>
          <p><strong>جمع تعداد:</strong> {totals.quantity.toLocaleString('fa-IR')}</p>
          <p><strong>مبلغ کل:</strong> {formatCurrency(totals.amount)}</p>
          <p><strong>روش پرداخت:</strong> {getPaymentMethodText(payment.method)}</p>
        </div>
        
        <div className="signatures">
          <div>
            <p>مهر و امضای فروشنده</p>
          </div>
          <div>
            <p>مهر و امضای خریدار</p>
          </div>
        </div>
        
        <div className="footer">
          <p>این فاکتور به صورت خودکار توسط سیستم حسابداری تولید شده است</p>
        </div>
      </div>

      <div className="row">
        {/* ستون سمت راست - اطلاعات فاکتور */}
        <div className="col-md-8">
          {/* کارت اطلاعات پایه */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                اطلاعات فاکتور
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">شماره فاکتور</label>
                    <div className="fs-5 fw-bold">{document.referenceNumber || document.documentNumber}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">تاریخ فاکتور</label>
                    <div className="fs-5">{formatDate(document.documentDate)}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">انبار</label>
                    <div className="fs-5">
                      {document.warehouse?.name}
                      <span className="badge bg-secondary ms-2">
                        {document.warehouse?.code}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">مشتری</label>
                    <div className="fs-5 fw-bold">{document.person?.name || 'نامشخص'}</div>
                    {document.person?.phone && (
                      <div className="text-muted">
                        <i className="bi bi-telephone me-1"></i>
                        {document.person.phone}
                      </div>
                    )}
                    {document.person?.address && (
                      <div className="text-muted small mt-1">
                        <i className="bi bi-geo-alt me-1"></i>
                        {document.person.address}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">روش پرداخت</label>
                    <div className="fs-5">
                      <span className={`badge bg-${payment.method === 'cash' ? 'success' : payment.method === 'credit' ? 'warning' : 'info'}`}>
                        {getPaymentMethodText(payment.method)}
                      </span>
                    </div>
                    {payment.info && (
                      <div className="mt-2">
                        {payment.info.type === 'cheque' && (
                          <div className="alert alert-info p-2">
                            <i className="bi bi-bank me-2"></i>
                            چک شماره {payment.info.chequeNumber} - 
                            بانک {payment.info.bankName} - 
                            سررسید: {formatDate(payment.info.dueDate)}
                          </div>
                        )}
                        {payment.info.type === 'bank' && (
                          <div className="alert alert-info p-2">
                            <i className="bi bi-credit-card me-2"></i>
                            حساب بانک: {payment.info.accountName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {document.description && (
                <div className="mt-3">
                  <label className="form-label text-muted">توضیحات</label>
                  <div className="alert alert-light">
                    {document.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* کارت اقلام فاکتور */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                اقلام فاکتور
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ردیف</th>
                      <th>کد کالا</th>
                      <th>نام کالا</th>
                      <th>گروه</th>
                      <th className="text-end">تعداد</th>
                      <th className="text-end">قیمت واحد</th>
                      <th className="text-end">جمع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.ledgerEntries.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {item.product?.code}
                          </span>
                        </td>
                        <td>
                          <strong>{item.product?.name}</strong>
                          <div className="small text-muted">
                            {item.product?.unit?.name}
                          </div>
                        </td>
                        <td>
                          {item.product?.category?.name}
                        </td>
                        <td className="text-end text-danger fw-bold">
                          {item.quantityOut.toLocaleString('fa-IR')}
                        </td>
                        <td className="text-end">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-end fw-bold text-success">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary">
                    <tr>
                      <td colSpan="4" className="text-end fw-bold">جمع کل:</td>
                      <td className="text-end fw-bold">
                        {totals.quantity.toLocaleString('fa-IR')}
                      </td>
                      <td></td>
                      <td className="text-end fw-bold fs-5 text-success">
                        {formatCurrency(totals.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ستون سمت چپ - اطلاعات مالی و عملیات */}
        <div className="col-md-4">
          {/* کارت خلاصه مالی */}
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-calculator me-2"></i>
                خلاصه مالی
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>تعداد اقلام:</span>
                  <span className="fw-bold">{totals.itemsCount}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>جمع تعداد:</span>
                  <span className="fw-bold">{totals.quantity.toLocaleString('fa-IR')} واحد</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span className="fs-5">مبلغ کل فاکتور:</span>
                  <span className="fs-4 fw-bold text-success">
                    {formatCurrency(totals.amount)}
                  </span>
                </div>
              </div>
              
              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  اطلاعات مالی
                </h6>
                <p className="mb-2 small">
                  این فاکتور باعث کاهش موجودی کالا در انبار {document.warehouse?.name} شده است.
                </p>
              </div>
            </div>
          </div>

          {/* کارت سند حسابداری */}
          {document.voucher ? (
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-file-text me-2"></i>
                  سند حسابداری
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>شماره سند:</span>
                    <span className="badge bg-primary">
                      {document.voucher.voucherNumber}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>تاریخ سند:</span>
                    <span>{formatDate(document.voucher.voucherDate)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>مبلغ سند:</span>
                    <span className="fw-bold">
                      {formatCurrency(document.voucher.totalAmount)}
                    </span>
                  </div>
                </div>
                
                <div className="d-grid gap-2">
                  <Link
                    href={`/vouchers/${document.voucher.id}`}
                    className="btn btn-outline-info"
                  >
                    <i className="bi bi-eye me-2"></i>
                    مشاهده سند حسابداری
                  </Link>
                  <Link
                    href={`/vouchers/${document.voucher.id}/print`}
                    className="btn btn-outline-primary"
                    target="_blank"
                  >
                    <i className="bi bi-printer me-2"></i>
                    چاپ سند حسابداری
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card mb-4">
              <div className="card-header bg-warning">
                <h5 className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  سند حسابداری
                </h5>
              </div>
              <div className="card-body text-center">
                <i className="bi bi-file-x display-4 text-warning mb-3 d-block"></i>
                <p className="text-muted">برای این فاکتور سند حسابداری ثبت نشده است</p>
              </div>
            </div>
          )}

          {/* کارت عملیات */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                عملیات
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  onClick={handlePrint}
                  className="btn btn-primary"
                >
                  <i className="bi bi-printer me-2"></i>
                  چاپ فاکتور
                </button>
                
                <Link
                  href={`/inventory/documents/${document.id}/edit`}
                  className="btn btn-outline-warning"
                >
                  <i className="bi bi-pencil me-2"></i>
                  ویرایش فاکتور
                </Link>
                
                {document.voucherId ? (
                  <button
                    disabled
                    className="btn btn-outline-secondary"
                    title="فاکتور دارای سند حسابداری قابل حذف نیست"
                  >
                    <i className="bi bi-trash me-2"></i>
                    حذف فاکتور (غیرفعال)
                  </button>
                ) : (
                  <button
                    onClick={handleDelete}
                    className="btn btn-outline-danger"
                  >
                    <i className="bi bi-trash me-2"></i>
                    حذف فاکتور
                  </button>
                )}
                
                <Link
                  href={`/inventory/documents/sales-invoice?copyFrom=${document.id}`}
                  className="btn btn-outline-info"
                >
                  <i className="bi bi-files me-2"></i>
                  کپی فاکتور
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* لینک‌های پایین */}
      <div className="mt-4 d-flex justify-content-between">
        <div>
          <Link
            href="/inventory/documents/sales-list"
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت به لیست فاکتورها
          </Link>
        </div>
        
        <div className="d-flex gap-2">
          <Link
            href={`/reports/account-turnover?account=${document.person?.detailAccount?.code}`}
            className="btn btn-outline-info"
          >
            <i className="bi bi-graph-up me-2"></i>
            گردش حساب مشتری
          </Link>
          
          {document.ledgerEntries.length > 0 && (
            <Link
              href={`/inventory/products/${document.ledgerEntries[0].productId}/ledger`}
              className="btn btn-outline-warning"
            >
              <i className="bi bi-box-seam me-2"></i>
              کاردکس کالا
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}