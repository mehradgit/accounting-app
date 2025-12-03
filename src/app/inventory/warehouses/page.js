'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailAccounts, setDetailAccounts] = useState([]);

  useEffect(() => {
    fetchWarehouses();
    fetchDetailAccounts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/warehouses');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailAccounts = async () => {
    try {
      const response = await fetch('/api/detail-accounts');
      if (response.ok) {
        const data = await response.json();
        setDetailAccounts(data.detailAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching detail accounts:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این انبار اطمینان دارید؟\nتوجه: کالاهای موجود در این انبار نیز حذف خواهند شد.')) return;
    
    try {
      const response = await fetch(`/api/inventory/warehouses/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('انبار با موفقیت حذف شد');
        fetchWarehouses();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف انبار');
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert('خطا در حذف انبار');
    }
  };

  const getAccountName = (accountId) => {
    const account = detailAccounts.find(acc => acc.id === accountId);
    return account ? `${account.name} (${account.code})` : 'بدون حساب';
  };

  return (
    <div className="container-fluid py-4">
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">
            <i className="bi bi-house-gear text-primary me-2"></i>
            مدیریت انبارها
          </h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="/dashboard" className="text-decoration-none">
                  <i className="bi bi-house-door me-1"></i>
                  داشبورد
                </Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/inventory" className="text-decoration-none">
                  <i className="bi bi-archive me-1"></i>
                  انبارداری
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                <i className="bi bi-buildings me-1"></i>
                انبارها
              </li>
            </ol>
          </nav>
        </div>
        <div>
          <Link
            href="/inventory/warehouses/create"
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <i className="bi bi-plus-circle"></i>
            افزودن انبار جدید
          </Link>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 bg-primary bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد انبارها</h6>
                  <h3 className="fw-bold mb-0">{warehouses.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-buildings text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 bg-success bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">انبارهای فعال</h6>
                  <h3 className="fw-bold mb-0">{warehouses.length}</h3>
                </div>
                <div className="bg-success bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 bg-info bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">انبارهای متصل</h6>
                  <h3 className="fw-bold mb-0">
                    {warehouses.filter(w => w.detailAccountId).length}
                  </h3>
                </div>
                <div className="bg-info bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-link-45deg text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 bg-warning bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">میانگین کالا</h6>
                  <h3 className="fw-bold mb-0">-</h3>
                </div>
                <div className="bg-warning bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box-seam text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول انبارها */}
      <div className="card border-0 shadow">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="bi bi-table me-2"></i>
              لیست انبارها
            </h5>
            <div className="d-flex gap-2">
              <button 
                onClick={fetchWarehouses}
                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                title="بروزرسانی"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
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
              <p className="mt-3 text-muted">در حال دریافت اطلاعات انبارها...</p>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-buildings display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">انباری یافت نشد</h5>
              <p className="text-muted mb-4">هنوز هیچ انباری ثبت نشده است</p>
              <Link
                href="/inventory/warehouses/create"
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                افزودن اولین انبار
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>کد</th>
                    <th>نام انبار</th>
                    <th>آدرس</th>
                    <th style={{ width: '120px' }}>مسئول</th>
                    <th style={{ width: '180px' }}>حساب تفصیلی</th>
                    <th style={{ width: '200px' }} className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((warehouse) => (
                    <tr key={warehouse.id}>
                      <td>
                        <span className="badge bg-light text-dark font-monospace fs-6">
                          {warehouse.code}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                            <i className="bi bi-buildings text-primary"></i>
                          </div>
                          <div>
                            <div className="fw-medium">{warehouse.name}</div>
                            <small className="text-muted">
                              <i className="bi bi-calendar me-1"></i>
                              ایجاد: {new Date(warehouse.createdAt).toLocaleDateString('fa-IR')}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={warehouse.address}>
                          {warehouse.address || (
                            <span className="text-muted fst-italic">بدون آدرس</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {warehouse.manager ? (
                          <span className="badge bg-info bg-opacity-10 text-info">
                            <i className="bi bi-person me-1"></i>
                            {warehouse.manager}
                          </span>
                        ) : (
                          <span className="text-muted">تعیین نشده</span>
                        )}
                      </td>
                      <td>
                        {warehouse.detailAccountId ? (
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle text-success me-2"></i>
                            <div>
                              <div className="small">{getAccountName(warehouse.detailAccountId)}</div>
                              <small className="text-muted">متصل به حسابداری</small>
                            </div>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center">
                            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                            <div>
                              <div className="small text-muted">بدون اتصال</div>
                              <small className="text-muted">نیاز به تنظیم</small>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Link
                            href={`/inventory/warehouses/${warehouse.id}`}
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            title="ویرایش"
                          >
                            <i className="bi bi-pencil"></i>
                            <span className="d-none d-md-inline me-1">ویرایش</span>
                          </Link>
                          <Link
                            href={`/inventory/warehouses/${warehouse.id}/stock`}
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            title="مشاهده موجودی"
                          >
                            <i className="bi bi-box-seam"></i>
                            <span className="d-none d-md-inline me-1">موجودی</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(warehouse.id)}
                            className="btn btn-sm btn-outline-danger d-flex align-items-center"
                            title="حذف"
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
        {warehouses.length > 0 && (
          <div className="card-footer bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                نمایش <strong>{warehouses.length}</strong> انبار
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-download me-1"></i>
                  خروجی Excel
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-filter me-1"></i>
                  فیلتر پیشرفته
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* راهنما */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="alert alert-info d-flex align-items-center">
            <i className="bi bi-info-circle fs-4 me-3"></i>
            <div>
              <h6 className="alert-heading mb-1">نکات مهم مدیریت انبارها</h6>
              <ul className="mb-0 small">
                <li>هر انبار باید یک کد منحصر به فرد داشته باشد</li>
                <li>اتصال انبار به حساب تفصیلی برای ثبت خودکار تراکنش‌های حسابداری ضروری است</li>
                <li>پیش از حذف انبار، از خالی بودن آن اطمینان حاصل کنید</li>
                <li>می‌توانید برای هر انبار یک مسئول تعیین کنید</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}