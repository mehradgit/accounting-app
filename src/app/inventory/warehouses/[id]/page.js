'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import WarehouseForm from '@/components/forms/WarehouseForm';

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchWarehouse();
    }
  }, [params.id]);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/warehouses/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setWarehouse(data);
      } else {
        router.push('/inventory/warehouses');
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      router.push('/inventory/warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/inventory/warehouses');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3 text-muted">در حال دریافت اطلاعات انبار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/dashboard" className="text-decoration-none">
              <i className="bi bi-house-door me-1"></i>
              داشبورد
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/inventory" className="text-decoration-none">
              <i className="bi bi-archive me-1"></i>
              انبارداری
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/inventory/warehouses" className="text-decoration-none">
              <i className="bi bi-buildings me-1"></i>
              انبارها
            </a>
          </li>
          <li className="breadcrumb-item active">
            <i className="bi bi-pencil-square me-1"></i>
            ویرایش انبار
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-warning bg-gradient p-3 rounded-3 me-3">
            <i className="bi bi-buildings-fill text-white fs-4"></i>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-1">ویرایش انبار</h1>
            <p className="text-muted mb-0">
              ویرایش اطلاعات انبار {warehouse?.name} ({warehouse?.code})
            </p>
          </div>
        </div>
        
        <div className="btn-group" role="group">
          <button
            onClick={() => router.push('/inventory/warehouses')}
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت به لیست
          </button>
          <button
            onClick={() => router.push(`/inventory/warehouses/${params.id}/stock`)}
            className="btn btn-outline-info d-flex align-items-center"
          >
            <i className="bi bi-box-seam me-2"></i>
            مشاهده موجودی
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="row">
        <div className="col-12 col-lg-10 col-xl-8 mx-auto">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-white py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title fw-bold mb-1">
                    <i className="bi bi-gear-fill text-warning me-2"></i>
                    فرم ویرایش انبار
                  </h5>
                  <p className="text-muted small mb-0">
                    اطلاعات مورد نظر را ویرایش و در انتها ذخیره کنید
                  </p>
                </div>
                <div className="badge bg-warning bg-opacity-20 text-warning px-3 py-2">
                  <i className="bi bi-clock-history me-1"></i>
                  آخرین ویرایش: {warehouse?.updatedAt ? new Date(warehouse.updatedAt).toLocaleDateString('fa-IR') : '---'}
                </div>
              </div>
            </div>
            
            <div className="card-body p-4 p-md-5">
              {warehouse && <WarehouseForm initialData={warehouse} onSuccess={handleSuccess} />}
            </div>
            
            <div className="card-footer bg-light py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-2 mb-md-0">
                  <div className="d-flex align-items-center">
                    <div className="text-primary me-2">
                      <i className="bi bi-info-circle fs-5"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">توجه</small>
                      <small className="fw-medium">تغییرات پس از ذخیره اعمال می‌شود</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/inventory/warehouses')}
                      className="btn btn-outline-danger px-4"
                    >
                      <i className="bi bi-x-lg me-1"></i>
                      انصراف
                    </button>
                    <button
                      type="submit"
                      form="warehouse-form"
                      className="btn btn-warning px-4"
                    >
                      <i className="bi bi-save me-1"></i>
                      ذخیره تغییرات
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}