'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateUnitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'کد واحد الزامی است';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'نام واحد الزامی است';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('واحد با موفقیت ایجاد شد');
        router.push('/inventory/units');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در ایجاد واحد');
      }
    } catch (error) {
      console.error('Error creating unit:', error);
      alert('خطا در ایجاد واحد');
    } finally {
      setLoading(false);
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
          <li className="breadcrumb-item">
            <Link href="/inventory/units" className="text-decoration-none">
              <i className="bi bi-rulers me-1"></i>
              واحدها
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-plus-circle me-1"></i>
            افزودن واحد جدید
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-gradient p-3 rounded-3 me-3">
            <i className="bi bi-rulers text-white fs-4"></i>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-1">افزودن واحد جدید</h1>
            <p className="text-muted mb-0">تعریف واحد اندازه‌گیری جدید برای کالاها</p>
          </div>
        </div>
        
        <div>
          <Link
            href="/inventory/units"
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت به لیست
          </Link>
        </div>
      </div>

      {/* فرم */}
      <div className="row">
        <div className="col-12 col-lg-6 mx-auto">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-white py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title fw-bold mb-1">
                    <i className="bi bi-pencil-square text-primary me-2"></i>
                    فرم اطلاعات واحد
                  </h5>
                  <p className="text-muted small mb-0">
                    لطفاً تمامی فیلدهای ضروری (<span className="text-danger">*</span>) را تکمیل نمایید
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="code" className="form-label">
                    کد واحد <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                    required
                    placeholder="مثال: PCS, KG, M"
                  />
                  {errors.code && (
                    <div className="invalid-feedback d-block">{errors.code}</div>
                  )}
                  <div className="form-text">کد منحصر به فرد واحد</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    نام واحد <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    required
                    placeholder="مثال: عدد، کیلوگرم، متر"
                  />
                  {errors.name && (
                    <div className="invalid-feedback d-block">{errors.name}</div>
                  )}
                  <div className="form-text">نام فارسی واحد</div>
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="form-label">
                    توضیحات
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="توضیحات اضافی درباره واحد"
                  />
                </div>

                <div className="border-top pt-4 mt-3">
                  <div className="d-flex justify-content-end gap-3">
                    <Link
                      href="/inventory/units"
                      className="btn btn-outline-secondary"
                    >
                      انصراف
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-success d-flex align-items-center"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          در حال ذخیره...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          ایجاد واحد
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* راهنما */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body">
              <div className="d-flex">
                <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                  <i className="bi bi-lightbulb text-warning fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-2">واحدهای پیشنهادی</h6>
                  <p className="text-muted small mb-0">
                    برای شروع، این واحدها را ایجاد کنید:
                  </p>
                  <div className="mt-2">
                    <span className="badge bg-light text-dark me-2">PCS - عدد</span>
                    <span className="badge bg-light text-dark me-2">KG - کیلوگرم</span>
                    <span className="badge bg-light text-dark me-2">M - متر</span>
                    <span className="badge bg-light text-dark me-2">L - لیتر</span>
                    <span className="badge bg-light text-dark me-2">BOX - بسته</span>
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