'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UnitsPage() {
  const router = useRouter();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/units');
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این واحد اطمینان دارید؟')) return;
    
    try {
      const response = await fetch(`/api/inventory/units/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('واحد با موفقیت حذف شد');
        fetchUnits();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف واحد');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('خطا در حذف واحد');
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb */}
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
              انبارداری
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-rulers me-1"></i>
            واحدهای اندازه‌گیری
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">
            <i className="bi bi-rulers text-primary me-2"></i>
            مدیریت واحدهای اندازه‌گیری
          </h1>
          <p className="text-muted mb-0">تعریف و مدیریت واحدهای مورد استفاده در سیستم</p>
        </div>
        <div>
          <Link
            href="/inventory/units/create"
            className="btn btn-primary d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-2"></i>
            افزودن واحد جدید
          </Link>
        </div>
      </div>

      {/* جدول واحدها */}
      <div className="card border-0 shadow">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="bi bi-table me-2"></i>
              لیست واحدها
            </h5>
            <div className="d-flex gap-2">
              <button 
                onClick={fetchUnits}
                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                title="بروزرسانی"
              >
                <i className="bi bi-arrow-clockwise"></i>
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
              <p className="mt-3 text-muted">در حال دریافت اطلاعات واحدها...</p>
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-rulers display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">واحدی یافت نشد</h5>
              <p className="text-muted mb-4">هنوز هیچ واحدی ایجاد نشده است</p>
              <Link
                href="/inventory/units/create"
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                ایجاد اولین واحد
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>کد</th>
                    <th>نام واحد</th>
                    <th>توضیحات</th>
                    <th style={{ width: '180px' }} className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.id}>
                      <td>
                        <span className="badge bg-light text-dark font-monospace">
                          {unit.code}
                        </span>
                      </td>
                      <td className="fw-medium">{unit.name}</td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '300px' }} title={unit.description}>
                          {unit.description || <span className="text-muted">بدون توضیح</span>}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Link
                            href={`/inventory/units/${unit.id}`}
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            title="ویرایش"
                          >
                            <i className="bi bi-pencil"></i>
                            <span className="d-none d-md-inline me-1">ویرایش</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(unit.id)}
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
        {units.length > 0 && (
          <div className="card-footer bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                نمایش <strong>{units.length}</strong> واحد
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
              <h6 className="alert-heading mb-1">نکات مهم واحدهای اندازه‌گیری</h6>
              <ul className="mb-0 small">
                <li>واحدها برای تعریف واحدهای اندازه‌گیری کالاها استفاده می‌شوند</li>
                <li>هر کالا باید یک واحد اصلی داشته باشد</li>
                <li>کد واحد باید منحصر به فرد باشد</li>
                <li>واحدهای سیستمی مانند "عدد"، "کیلوگرم"، "متر" را ابتدا ایجاد کنید</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}