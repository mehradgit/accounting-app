'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditProductCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const [category, setCategory] = useState(null);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    parentId: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (params.id) {
      fetchCategory();
      fetchParentCategories();
    }
  }, [params.id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/product-categories/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCategory(data);
        setFormData({
          code: data.code,
          name: data.name,
          description: data.description || '',
          parentId: data.parentId || ''
        });
      } else {
        router.push('/inventory/product-categories');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      router.push('/inventory/product-categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchParentCategories = async () => {
    try {
      const response = await fetch('/api/inventory/product-categories');
      if (response.ok) {
        const data = await response.json();
        // فیلتر کردن خود گروه از لیست والدین
        const filtered = (data.categories || []).filter(cat => cat.id !== parseInt(params.id));
        setParentCategories(filtered);
      }
    } catch (error) {
      console.error('Error fetching parent categories:', error);
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
    
    setSaving(true);
    try {
      const response = await fetch(`/api/inventory/product-categories/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('گروه کالا با موفقیت ویرایش شد');
        router.push('/inventory/product-categories');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در ویرایش گروه کالا');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('خطا در ویرایش گروه کالا');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این گروه کالا اطمینان دارید؟')) return;
    
    try {
      const response = await fetch(`/api/inventory/product-categories/${params.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('گروه کالا با موفقیت حذف شد');
        router.push('/inventory/product-categories');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف گروه کالا');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('خطا در حذف گروه کالا');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3 text-muted">در حال دریافت اطلاعات گروه...</p>
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
            <Link href="/inventory/product-categories" className="text-decoration-none">
              <i className="bi bi-tags me-1"></i>
              گروه‌های کالا
            </Link>
          </li>
          <li className="breadcrumb-item active">
            <i className="bi bi-pencil-square me-1"></i>
            ویرایش گروه
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-warning bg-gradient p-3 rounded-3 me-3">
            <i className="bi bi-tags text-white fs-4"></i>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-1">ویرایش گروه کالا</h1>
            <p className="text-muted mb-0">
              ویرایش اطلاعات گروه {category?.name}
            </p>
          </div>
        </div>
        
        <div className="btn-group" role="group">
          <button
            onClick={() => router.push('/inventory/product-categories')}
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت به لیست
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="row">
        <div className="col-12 col-lg-8 col-xl-6 mx-auto">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-white py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title fw-bold mb-1">
                    <i className="bi bi-pencil-fill text-warning me-2"></i>
                    فرم ویرایش گروه کالا
                  </h5>
                  <p className="text-muted small mb-0">
                    اطلاعات گروه کالا را ویرایش کنید
                  </p>
                </div>
                <div className="text-muted small">
                  کد: <span className="badge bg-light text-dark">{category?.code}</span>
                </div>
              </div>
            </div>
            
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
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
                    disabled
                  />
                  {errors.code && (
                    <div className="invalid-feedback d-block">{errors.code}</div>
                  )}
                  <div className="form-text">کد گروه قابل ویرایش نیست</div>
                </div>

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
                    placeholder="نام گروه کالا"
                  />
                  {errors.name && (
                    <div className="invalid-feedback d-block">{errors.name}</div>
                  )}
                  <div className="form-text">نام فارسی گروه</div>
                </div>

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
                    <option value="">بدون گروه والد</option>
                    {parentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.code} - {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">گروه اصلی (اختیاری)</div>
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
                    placeholder="توضیحات اضافی درباره گروه"
                  />
                </div>

                <div className="border-top pt-4 mt-3">
                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="btn btn-outline-danger d-flex align-items-center"
                      disabled={category?._count?.products > 0 || category?._count?.children > 0}
                    >
                      <i className="bi bi-trash me-2"></i>
                      حذف گروه
                    </button>
                    
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        onClick={() => router.push('/inventory/product-categories')}
                        className="btn btn-outline-secondary"
                        disabled={saving}
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="btn btn-warning d-flex align-items-center"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            در حال ذخیره...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-save me-2"></i>
                            ذخیره تغییرات
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* اطلاعات گروه */}
      {category && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border">
              <div className="card-header bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  اطلاعات گروه
                </h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <small className="text-muted d-block">تعداد کالاها</small>
                      <div className="fw-medium fs-5">
                        {category._count?.products || 0} کالا
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <small className="text-muted d-block">تعداد زیرگروه‌ها</small>
                      <div className="fw-medium fs-5">
                        {category._count?.children || 0} زیرگروه
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <small className="text-muted d-block">تاریخ ایجاد</small>
                      <div className="fw-medium">
                        {new Date(category.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </div>
                </div>
                
                {category._count?.products > 0 && (
                  <div className="alert alert-warning mt-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    این گروه دارای {category._count.products} کالا است و نمی‌تواند حذف شود.
                  </div>
                )}
                
                {category._count?.children > 0 && (
                  <div className="alert alert-info mt-2">
                    <i className="bi bi-info-circle me-2"></i>
                    این گروه دارای {category._count.children} زیرگروه است.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}