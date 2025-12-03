'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WarehouseForm({ initialData = null, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detailAccounts, setDetailAccounts] = useState([]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    manager: '',
    description: '',
    detailAccountId: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        detailAccountId: initialData.detailAccountId || ''
      });
    }
    loadDependencies();
  }, [initialData]);

  const loadDependencies = async () => {
    try {
      const response = await fetch('/api/detail-accounts');
      if (response.ok) {
        const data = await response.json();
        setDetailAccounts(data.detailAccounts || []);
      }
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'کد انبار الزامی است';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'نام انبار الزامی است';
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
    setErrors({});

    try {
      const url = initialData 
        ? `/api/inventory/warehouses/${initialData.id}`
        : '/api/inventory/warehouses';
      
      const method = initialData ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        detailAccountId: formData.detailAccountId === '' ? null : parseInt(formData.detailAccountId)
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/inventory/warehouses');
          router.refresh();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در ذخیره اطلاعات');
      }
    } catch (error) {
      console.error('Error saving warehouse:', error);
      alert('خطا در ذخیره اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // پاک کردن خطای فیلد هنگام تغییر
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} id="warehouse-form" className="needs-validation" noValidate>
      <div className="row g-4">
        {/* کد انبار */}
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="code" className="form-label">
              کد انبار <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className={`form-control ${errors.code ? 'is-invalid' : ''}`}
              required
              disabled={!!initialData}
              placeholder="مثال: WH-01"
            />
            {errors.code && (
              <div className="invalid-feedback d-block">{errors.code}</div>
            )}
            <div className="form-text">کد منحصر به فرد انبار</div>
          </div>
        </div>

        {/* نام انبار */}
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              نام انبار <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              required
              placeholder="نام کامل انبار"
            />
            {errors.name && (
              <div className="invalid-feedback d-block">{errors.name}</div>
            )}
            <div className="form-text">نام فارسی انبار</div>
          </div>
        </div>

        {/* آدرس */}
        <div className="col-12">
          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              آدرس
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-control"
              rows="2"
              placeholder="آدرس کامل انبار"
            />
            <div className="form-text">آدرس دقیق انبار برای ارسال کالا</div>
          </div>
        </div>

        {/* تلفن */}
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              تلفن
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control"
              placeholder="شماره تلفن"
            />
            <div className="form-text">شماره تماس انبار</div>
          </div>
        </div>

        {/* مسئول */}
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="manager" className="form-label">
              مسئول انبار
            </label>
            <input
              type="text"
              id="manager"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              className="form-control"
              placeholder="نام مسئول"
            />
            <div className="form-text">نام شخص مسئول انبار</div>
          </div>
        </div>

        {/* حساب تفصیلی */}
        <div className="col-12">
          <div className="mb-3">
            <label htmlFor="detailAccountId" className="form-label">
              حساب تفصیلی
            </label>
            <select
              id="detailAccountId"
              name="detailAccountId"
              value={formData.detailAccountId}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">بدون حساب تفصیلی</option>
              {detailAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
            <div className="form-text">
              حساب تفصیلی برای ثبت خودکار تراکنش‌های حسابداری مرتبط با این انبار
            </div>
          </div>
        </div>

        {/* توضیحات */}
        <div className="col-12">
          <div className="mb-3">
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
              placeholder="توضیحات اضافی درباره انبار"
            />
            <div className="form-text">هر گونه توضیح اضافی درباره انبار</div>
          </div>
        </div>
      </div>

      {/* دکمه‌های فرم */}
      <div className="border-top pt-4 mt-3">
        <div className="d-flex justify-content-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-outline-secondary"
            disabled={loading}
          >
            <i className="bi bi-arrow-right me-2"></i>
            انصراف
          </button>
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
                {initialData ? 'ویرایش انبار' : 'ذخیره انبار'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}