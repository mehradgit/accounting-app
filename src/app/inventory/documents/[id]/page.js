// src/app/inventory/documents/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ViewInventoryDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/inventory/documents/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
      } else if (response.status === 404) {
        setError('سند مورد نظر یافت نشد');
      } else {
        setError('خطا در دریافت اطلاعات سند');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این سند اطمینان دارید؟\nاین عمل غیرقابل بازگشت است.')) return;
    
    try {
      const response = await fetch(`/api/inventory/documents/${params.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('سند با موفقیت حذف شد');
        router.push('/inventory/documents');
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف سند');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('خطا در حذف سند');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('fa-IR');
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال دریافت اطلاعات سند...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <div className="text-center mt-4">
          <Link href="/inventory/documents" className="btn btn-primary">
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت به لیست اسناد
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          سند مورد نظر یافت نشد
        </div>
        <div className="text-center mt-4">
          <Link href="/inventory/documents" className="btn btn-primary">
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت به لیست اسناد
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/dashboard" className="text-decoration-none">
              <i className="bi bi-house-door me-1"></i>
              داشبورد
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/inventory" className="text-decoration-none">
              <i className="bi bi-archive me-1"></i>
              انبار
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/inventory/documents" className="text-decoration-none">
              <i className="bi bi-file-earmark-text me-1"></i>
              اسناد انبار
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-eye me-1"></i>
            مشاهده سند
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <div className="d-flex align-items-center">
            <div className={`p-3 rounded-circle me-3 ${
              document.type?.effect === 'increase' 
                ? 'bg-success bg-opacity-10' 
                : 'bg-danger bg-opacity-10'
            }`}>
              <i className={`bi ${
                document.type?.effect === 'increase' 
                  ? 'bi-box-arrow-in-down text-success' 
                  : 'bi-box-arrow-up text-danger'
              } fs-4`}></i>
            </div>
            <div>
              <h1 className="h2 fw-bold mb-1">مشاهده سند انبار</h1>
              <p className="text-muted mb-0">
                شماره سند: <span className="fw-medium">{document.documentNumber}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="d-flex justify-content-end gap-2">
            <Link
              href="/inventory/documents"
              className="btn btn-outline-secondary d-flex align-items-center"
            >
              <i className="bi bi-arrow-right me-2"></i>
              بازگشت به لیست
            </Link>
            <button
              onClick={() => window.print()}
              className="btn btn-outline-primary d-flex align-items-center"
            >
              <i className="bi bi-printer me-2"></i>
              چاپ
            </button>
            {document.voucherId && (
              <Link
                href={`/vouchers/${document.voucherId}`}
                className="btn btn-success d-flex align-items-center"
              >
                <i className="bi bi-journal-text me-2"></i>
                سند حسابداری
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {document.type?.effect === 'increase' ? (
        <div className="alert alert-success d-flex align-items-center mb-4">
          <i className="bi bi-info-circle me-2 fs-4"></i>
          <div>
            این سند یک <strong>ورود</strong> به انبار است و باعث <strong>افزایش موجودی</strong> می‌شود.
          </div>
        </div>
      ) : (
        <div className="alert alert-danger d-flex align-items-center mb-4">
          <i className="bi bi-info-circle me-2 fs-4"></i>
          <div>
            این سند یک <strong>خروج</strong> از انبار است و باعث <strong>کاهش موجودی</strong> می‌شود.
          </div>
        </div>
      )}

      <div className="row">
        {/* اطلاعات اصلی */}
        <div className="col-lg-8">
          <div className="card border-0 shadow mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-card-checklist me-2"></i>
                اطلاعات سند
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">شماره سند</label>
                  <div className="fw-bold fs-5">{document.documentNumber}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">تاریخ سند</label>
                  <div className="fw-bold">{formatDate(document.documentDate)}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">نوع سند</label>
                  <div>
                    <span className={`badge ${
                      document.type?.effect === 'increase' 
                        ? 'bg-success bg-opacity-10 text-success' 
                        : 'bg-danger bg-opacity-10 text-danger'
                    }`}>
                      <i className={`bi ${
                        document.type?.effect === 'increase' 
                          ? 'bi-plus-circle me-1' 
                          : 'bi-dash-circle me-1'
                      }`}></i>
                      {document.type?.name}
                    </span>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">انبار</label>
                  <div className="fw-bold">
                    {document.warehouse?.name}
                    {document.warehouse?.code && (
                      <small className="text-muted ms-2">({document.warehouse.code})</small>
                    )}
                  </div>
                </div>
                {document.referenceNumber && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">شماره مرجع</label>
                    <div className="fw-bold">{document.referenceNumber}</div>
                  </div>
                )}
                {document.person && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">طرف حساب</label>
                    <div className="fw-bold">
                      {document.person.name}
                      <small className="text-muted ms-2">
                        ({document.person.type === 'customer' ? 'مشتری' : 'تامین کننده'})
                      </small>
                    </div>
                  </div>
                )}
                {document.description && (
                  <div className="col-12 mb-3">
                    <label className="form-label text-muted">توضیحات</label>
                    <div className="border rounded p-3 bg-light">
                      {document.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* اقلام سند */}
          <div className="card border-0 shadow mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-boxes me-2"></i>
                اقلام سند ({document.ledgerEntries?.length || 0} مورد)
              </h5>
            </div>
            <div className="card-body p-0">
              {document.ledgerEntries && document.ledgerEntries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>کالا</th>
                        <th className="text-center">تعداد</th>
                        <th className="text-center">قیمت واحد</th>
                        <th className="text-center">مبلغ کل</th>
                        <th>توضیحات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {document.ledgerEntries.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="fw-medium">{item.product?.name}</div>
                            <div className="small text-muted">
                              کد: {item.product?.code}
                              {item.product?.unit && ` | واحد: ${item.product.unit.name}`}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className={`fw-bold ${
                              item.quantityIn > 0 ? 'text-success' : 'text-danger'
                            }`}>
                              {item.quantityIn > 0 ? '+' : '-'}
                              {formatNumber(item.quantityIn || item.quantityOut)}
                            </span>
                          </td>
                          <td className="text-center">
                            {formatNumber(item.unitPrice)} ریال
                          </td>
                          <td className="text-center">
                            <span className="fw-bold text-primary">
                              {formatNumber(item.totalPrice)} ریال
                            </span>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={item.description}>
                              {item.description || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-box-seam display-5 d-block mb-3"></i>
                  موردی یافت نشد
                </div>
              )}
            </div>
          </div>
        </div>

        {/* سایدبار - اطلاعات جانبی */}
        <div className="col-lg-4">
          {/* خلاصه */}
          <div className="card border-0 shadow mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-calculator me-2"></i>
                خلاصه مالی
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">تعداد کل اقلام:</span>
                  <span className="fw-bold">{formatNumber(document.totalQuantity)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">مبلغ کل سند:</span>
                  <span className="fw-bold text-primary fs-5">
                    {formatNumber(document.totalAmount)} ریال
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">تعداد کالاها:</span>
                  <span className="fw-bold">{document.ledgerEntries?.length || 0}</span>
                </div>
              </div>
              
              <div className="border-top pt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">تاریخ ایجاد:</span>
                  <span>{formatDate(document.createdAt)}</span>
                </div>
                {document.createdBy && (
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-muted">ایجاد شده توسط:</span>
                    <span>کاربر #{document.createdBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* عملیات */}
          <div className="card border-0 shadow">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-gear me-2"></i>
                عملیات
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link
                  href={`/inventory/documents/${params.id}/edit`}
                  className="btn btn-primary d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-pencil me-2"></i>
                  ویرایش سند
                </Link>
                
                <button
                  onClick={handleDelete}
                  className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-trash me-2"></i>
                  حذف سند
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-printer me-2"></i>
                  چاپ سند
                </button>
                
                <Link
                  href={`/inventory/documents/create?copy=${params.id}`}
                  className="btn btn-outline-info d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-copy me-2"></i>
                  کپی سند
                </Link>
                
                {document.voucherId ? (
                  <Link
                    href={`/vouchers/${document.voucherId}`}
                    className="btn btn-success d-flex align-items-center justify-content-center"
                  >
                    <i className="bi bi-journal-text me-2"></i>
                    مشاهده سند حسابداری
                  </Link>
                ) : (
                  <button className="btn btn-outline-success d-flex align-items-center justify-content-center">
                    <i className="bi bi-journal-plus me-2"></i>
                    ایجاد سند حسابداری
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* اطلاعات انبار */}
          {document.warehouse && (
            <div className="card border-0 shadow mt-4">
              <div className="card-header bg-white py-3">
                <h5 className="card-title mb-0">
                  <i className="bi bi-shop me-2"></i>
                  اطلاعات انبار
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-2">
                  <div className="fw-medium">{document.warehouse.name}</div>
                  {document.warehouse.code && (
                    <small className="text-muted">کد: {document.warehouse.code}</small>
                  )}
                </div>
                {document.warehouse.address && (
                  <div className="mb-2">
                    <small className="text-muted d-block">آدرس:</small>
                    <small>{document.warehouse.address}</small>
                  </div>
                )}
                {document.warehouse.phone && (
                  <div className="mb-2">
                    <small className="text-muted d-block">تلفن:</small>
                    <small>{document.warehouse.phone}</small>
                  </div>
                )}
                {document.warehouse.manager && (
                  <div>
                    <small className="text-muted d-block">مسئول:</small>
                    <small>{document.warehouse.manager}</small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}