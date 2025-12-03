'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductCategoryForm({ initialData = null, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    parentId: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        parentId: initialData.parentId || ''
      });
    }
    loadCategories();
  }, [initialData]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/inventory/product-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'کد گروه الزامی است';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'نام گروه الزامی است';
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
        ? `/api/inventory/product-categories/${initialData.id}`
        : '/api/inventory/product-categories';
      
      const method = initialData ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        parentId: formData.parentId === '' ? null : parseInt(formData.parentId)
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
          router.push('/inventory/product-categories');
          router.refresh();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در ذخیره اطلاعات');
      }
    } catch (error) {
      console.error('Error saving category:', error);
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const filterParentCategories = () => {
    if (!initialData) return categories;
    
    // فیلتر کردن خود گروه از لیست والدین
    return categories.filter(cat => cat.id !== initialData.id);
  };

  return (
    <form onSubmit={handleSubmit} id="product-category-form" className="needs-validation" noValidate>
      <div className="row g-4">
        {/* کد گروه */}
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="code" className="form-label">
              کد گروه <span className="text-danger">*</span>
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
              placeholder="مثال: CAT-01"
            />
            {errors.code && (
              <div className="invalid-feedback d-block">{errors.code}</div>
            )}
            <div className="form-text">
              {initialData ? 'کد گروه قابل ویرایش نیست' : 'کد منحصر به فرد گروه'}
            </div>
          </div>
        </div>

        {/* نام گروه */}
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              نام گروه <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              required
              placeholder="نام کامل گروه"
            />
            {errors.name && (
              <div className="invalid-feedback d-block">{errors.name}</div>
            )}
            <div className="form-text">نام فارسی گروه</div>
          </div>
        </div>

        {/* گروه والد */}
        <div className="col-12">
          <div className="mb-3">
            <label htmlFor="parentId" className="form-label">
              گروه والد
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">بدون گروه والد (گروه اصلی)</option>
              {filterParentCategories().map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.code} - {cat.name}
                </option>
              ))}
            </select>
            <div className="form-text">
              {formData.parentId ? 'این گروه به عنوان زیرگروه ثبت می‌شود' : 'این گروه به عنوان گروه اصلی ثبت می‌شود'}
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
              rows="4"
              placeholder="توضیحات اضافی درباره گروه کالا"
            />
            <div className="form-text">هر گونه توضیح اضافی درباره این گروه</div>
          </div>
        </div>
      </div>

      {/* اطلاعات فعلی گروه (در حالت ویرایش) */}
      {initialData && (
        <div className="card border mb-4">
          <div className="card-header bg-light py-3">
            <h6 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              اطلاعات فعلی گروه
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <small className="text-muted d-block">تعداد کالاها</small>
                  <div className="fw-medium fs-5">
                    {initialData._count?.products || 0} کالا
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <small className="text-muted d-block">تعداد زیرگروه‌ها</small>
                  <div className="fw-medium fs-5">
                    {initialData._count?.children || 0} زیرگروه
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <small className="text-muted d-block">تاریخ ایجاد</small>
                  <div className="fw-medium">
                    {new Date(initialData.createdAt).toLocaleDateString('fa-IR')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* دکمه‌های فرم */}
      <div className="border-top pt-4 mt-3">
        <div className="d-flex justify-content-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-outline-secondary d-flex align-items-center"
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
                <i className={`bi ${initialData ? 'bi-save' : 'bi-check-lg'} me-2`}></i>
                {initialData ? 'ذخیره تغییرات' : 'ایجاد گروه'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* پیام‌های راهنما */}
      <div className="mt-4">
        {initialData && initialData._count?.products > 0 && (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            این گروه دارای {initialData._count.products} کالا است. تغییرات روی تمام کالاهای این گروه تاثیر می‌گذارد.
          </div>
        )}
        
        {!initialData && (
          <div className="alert alert-info">
            <div className="d-flex">
              <div className="flex-shrink-0">
                <i className="bi bi-lightbulb fs-4"></i>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="alert-heading mb-1">نکات مهم</h6>
                <ul className="mb-0 small">
                  <li>کد گروه باید منحصر به فرد باشد</li>
                  <li>گروه‌های اصلی بدون گروه والد ایجاد می‌شوند</li>
                  <li>پس از ایجاد گروه، امکان ویرایش کد وجود ندارد</li>
                  <li>می‌توانید بعداً زیرگروه به این گروه اضافه کنید</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}