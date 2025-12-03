'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TransactionTypesPage() {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/inventory/transaction-types');
      if (response.ok) {
        const data = await response.json();
        // بررسی اینکه آیا داده آرایه است
        const typesArray = Array.isArray(data) ? data : (data.types || []);
        setTypes(typesArray);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(`خطا در دریافت اطلاعات: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching transaction types:', error);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این نوع تراکنش اطمینان دارید؟\nتوجه: اگر اسنادی با این نوع وجود داشته باشد، حذف امکان‌پذیر نیست.')) return;
    
    try {
      const response = await fetch(`/api/inventory/transaction-types/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('نوع تراکنش با موفقیت حذف شد');
        fetchTypes();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف نوع تراکنش');
      }
    } catch (error) {
      console.error('Error deleting transaction type:', error);
      alert('خطا در حذف نوع تراکنش');
    }
  };

  const getEffectLabel = (effect) => {
    return effect === 'increase' ? 'افزایش موجودی' : 'کاهش موجودی';
  };

  const getEffectBadge = (effect) => {
    return effect === 'increase' 
      ? 'badge bg-success bg-opacity-10 text-success' 
      : 'badge bg-danger bg-opacity-10 text-danger';
  };

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
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-arrow-left-right me-1"></i>
            انواع اسناد انبار
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
            <i className="bi bi-arrow-left-right text-primary fs-4"></i>
          </div>
          <div>
            <h1 className="h2 fw-bold mb-1">انواع اسناد انبار</h1>
            <p className="text-muted mb-0">مدیریت انواع تراکنش‌های ورودی و خروجی</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link
            href="/inventory/transaction-types/create"
            className="btn btn-primary d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-2"></i>
            افزودن نوع جدید
          </Link>
          <button
            onClick={fetchTypes}
            className="btn btn-outline-secondary d-flex align-items-center"
            title="بروزرسانی"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* نمایش خطا */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* آمار */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-primary bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کل انواع</h6>
                  <h3 className="fw-bold mb-0">{types.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-list-ul text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-success bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">افزایش موجودی</h6>
                  <h3 className="fw-bold mb-0">
                    {types.filter(t => t.effect === 'increase').length}
                  </h3>
                </div>
                <div className="bg-success bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box-arrow-in-down text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-danger bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کاهش موجودی</h6>
                  <h3 className="fw-bold mb-0">
                    {types.filter(t => t.effect === 'decrease').length}
                  </h3>
                </div>
                <div className="bg-danger bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box-arrow-up text-danger fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-info bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کل اسناد</h6>
                  <h3 className="fw-bold mb-0">
                    {types.reduce((sum, type) => sum + (type._count?.inventoryDocuments || 0), 0)}
                  </h3>
                </div>
                <div className="bg-info bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-file-earmark-text text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول انواع تراکنش‌ها */}
      <div className="card border-0 shadow">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="bi bi-table me-2"></i>
              لیست انواع تراکنش‌ها
            </h5>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center">
                <i className="bi bi-printer me-1"></i>
                چاپ
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">در حال بارگذاری...</span>
              </div>
              <p className="mt-3 text-muted">در حال دریافت اطلاعات...</p>
            </div>
          ) : types.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-arrow-left-right display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">نوع تراکنشی یافت نشد</h5>
              <p className="text-muted mb-4">هنوز هیچ نوع تراکنشی ایجاد نشده است</p>
              <Link
                href="/inventory/transaction-types/create"
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                ایجاد اولین نوع تراکنش
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '100px' }}>کد</th>
                    <th>نام</th>
                    <th style={{ width: '150px' }}>اثر</th>
                    <th>توضیحات</th>
                    <th style={{ width: '120px' }} className="text-center">تعداد اسناد</th>
                    <th style={{ width: '200px' }} className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((type) => (
                    <tr key={type.id}>
                      <td>
                        <span className="badge bg-light text-dark font-monospace">
                          {type.code}
                        </span>
                      </td>
                      <td>
                        <div className="fw-medium">{type.name}</div>
                        {type.description && (
                          <small className="text-muted d-block mt-1">
                            {type.description.length > 100 ? `${type.description.substring(0, 100)}...` : type.description}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getEffectBadge(type.effect)}`}>
                          <i className={`bi ${type.effect === 'increase' ? 'bi-plus-circle' : 'bi-dash-circle'} me-1`}></i>
                          {getEffectLabel(type.effect)}
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '300px' }} title={type.description}>
                          {type.description || '-'}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {type._count?.inventoryDocuments || 0} سند
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Link
                            href={`/inventory/transaction-types/${type.id}`}
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            title="ویرایش"
                          >
                            <i className="bi bi-pencil"></i>
                            <span className="d-none d-md-inline me-1">ویرایش</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(type.id)}
                            className="btn btn-sm btn-outline-danger d-flex align-items-center"
                            title="حذف"
                            disabled={type._count?.inventoryDocuments > 0}
                          >
                            <i className="bi bi-trash"></i>
                            <span className="d-none d-md-inline me-1">حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* فوتر جدول */}
        {types.length > 0 && (
          <div className="card-footer bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                نمایش <strong>{types.length}</strong> نوع تراکنش
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-download me-1"></i>
                  خروجی Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* راهنمای انواع پیش‌فرض */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card border-0 bg-success bg-opacity-10">
            <div className="card-header bg-transparent border-0">
              <h6 className="mb-0">
                <i className="bi bi-plus-circle text-success me-2"></i>
                انواع افزایش موجودی
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>خرید</strong> - خرید کالا از تامین‌کننده
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>برگشت از فروش</strong> - برگشت کالا از مشتری
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>انتقال ورودی</strong> - انتقال از انبار دیگر
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>تعدیل اضافه</strong> - تعدیل مثبت موجودی
                </li>
                <li>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <strong>موجودی اولیه</strong> - ثبت موجودی اول دوره
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-0 bg-danger bg-opacity-10">
            <div className="card-header bg-transparent border-0">
              <h6 className="mb-0">
                <i className="bi bi-dash-circle text-danger me-2"></i>
                انواع کاهش موجودی
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  <strong>فروش</strong> - فروش کالا به مشتری
                </li>
                <li className="mb-2">
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  <strong>برگشت از خرید</strong> - برگشت کالا به تامین‌کننده
                </li>
                <li className="mb-2">
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  <strong>انتقال خروجی</strong> - انتقال به انبار دیگر
                </li>
                <li className="mb-2">
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  <strong>تعدیل کمبود</strong> - تعدیل منفی موجودی
                </li>
                <li>
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  <strong>ضایعات</strong> - حذف کالای خراب یا تاریخ گذشته
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* نکات مهم */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="alert alert-info d-flex align-items-center">
            <i className="bi bi-info-circle fs-4 me-3"></i>
            <div>
              <h6 className="alert-heading mb-1">راهنمایی مدیریت انواع تراکنش‌ها</h6>
              <ul className="mb-0 small">
                <li>کد نوع تراکنش باید منحصر به فرد باشد</li>
                <li>نوع تراکنش‌هایی که در اسناد استفاده شده‌اند قابل حذف نیستند</li>
                <li>اثر تراکنش (افزایش یا کاهش) باید به دقت انتخاب شود</li>
                <li>برای هر نوع تراکنش، کد مناسبی انتخاب کنید (مثلا: PUR برای خرید، SAL برای فروش)</li>
                <li>می‌توانید انواع تراکنش‌های دلخواه خود را اضافه کنید</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}