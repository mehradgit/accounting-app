'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react'; // اضافه کردن React

export default function ProductCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('📡 در حال دریافت گروه‌های کالا...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/inventory/product-categories');
      console.log('📊 وضعیت پاسخ:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ داده‌های دریافتی:', data);
        
        if (Array.isArray(data)) {
          setCategories(data);
          console.log(`✅ ${data.length} گروه بارگذاری شد`);
        } else {
          console.error('❌ فرمت داده نامعتبر است:', data);
          setCategories([]);
          setError('فرمت داده دریافتی نامعتبر است');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطا در پاسخ:', errorData);
        setError(`خطا در دریافت داده‌ها: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت گروه‌ها:', error);
      setError(`خطا در اتصال به سرور: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        'آیا از حذف این گروه اطمینان دارید؟\nتوجه: اگر زیرگروه یا کالایی در این گروه وجود داشته باشد، حذف امکان‌پذیر نیست.'
      )
    )
      return;

    try {
      const response = await fetch(`/api/inventory/product-categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('گروه با موفقیت حذف شد');
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف گروه');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('خطا در حذف گروه');
    }
  };

  const toggleExpand = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ساختار درختی
  const renderCategoryItem = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category.id];

    return (
      <React.Fragment key={category.id}>
        <tr className={level > 0 ? "table-light" : ""}>
          <td style={{ paddingLeft: `${level * 24 + 12}px` }}>
            <div className="d-flex align-items-center">
              {hasChildren && (
                <button
                  className="btn btn-sm btn-link p-0 me-2"
                  onClick={() => toggleExpand(category.id)}
                  aria-expanded={isExpanded}
                  style={{ width: "20px" }}
                >
                  <i
                    className={`bi bi-chevron-${isExpanded ? "down" : "right"}`}
                  ></i>
                </button>
              )}
              {!hasChildren && (
                <span className="me-4" style={{ width: "20px" }}></span>
              )}
              <div>
                <div className="fw-medium">{category.name}</div>
                {category.description && (
                  <small className="text-muted d-block">
                    {category.description}
                  </small>
                )}
              </div>
            </div>
          </td>
          <td>
            <span className="badge bg-light text-dark font-monospace">
              {category.code}
            </span>
          </td>
          <td className="text-center">
            <span className="badge bg-primary bg-opacity-10 text-primary">
              {category._count?.products || 0} کالا
            </span>
          </td>
          <td className="text-center">
            <span className="badge bg-info bg-opacity-10 text-info">
              {category._count?.children || 0} زیرگروه
            </span>
          </td>
          <td>
            <div className="d-flex justify-content-center gap-2">
              <Link
                href={`/inventory/product-categories/${category.id}`}
                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                title="ویرایش"
              >
                <i className="bi bi-pencil"></i>
                <span className="d-none d-md-inline me-1">ویرایش</span>
              </Link>
              <button
                onClick={() => handleDelete(category.id)}
                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                title="حذف"
                disabled={
                  (category._count?.products || 0) > 0 || (category._count?.children || 0) > 0
                }
              >
                <i className="bi bi-trash"></i>
                <span className="d-none d-md-inline me-1">حذف</span>
              </button>
              <Link
                href={`/inventory/product-categories/create?parentId=${category.id}`}
                className="btn btn-sm btn-outline-success d-flex align-items-center"
                title="افزودن زیرگروه"
              >
                <i className="bi bi-plus-circle"></i>
                <span className="d-none d-md-inline me-1">زیرگروه</span>
              </Link>
            </div>
          </td>
        </tr>

        {/* نمایش زیرگروه‌ها اگر باز باشد */}
        {hasChildren &&
          isExpanded &&
          category.children.map((child) =>
            renderCategoryItem(child, level + 1)
          )}
      </React.Fragment>
    );
  };

  // محاسبه آمار
  const mainCategories = categories.filter((c) => !c.parentId);
  const subCategories = categories.filter((c) => c.parentId);
  const totalProducts = categories.reduce(
    (sum, cat) => sum + (cat._count?.products || 0),
    0
  );

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
            <i className="bi bi-tags me-1"></i>
            گروه‌های کالا
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">
            <i className="bi bi-tags text-primary me-2"></i>
            مدیریت گروه‌های کالا
          </h1>
          <p className="text-muted mb-0">دسته‌بندی و سازماندهی کالاها</p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={fetchCategories}
            className="btn btn-outline-secondary d-flex align-items-center"
            title="بروزرسانی"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <Link
            href="/inventory/product-categories/create"
            className="btn btn-primary d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-2"></i>
            افزودن گروه جدید
          </Link>
        </div>
      </div>

      {/* نمایش خطا */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
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
                  <h6 className="text-muted mb-1">تعداد گروه‌ها</h6>
                  <h3 className="fw-bold mb-0">{categories.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-diagram-3 text-primary fs-4"></i>
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
                  <h6 className="text-muted mb-1">گروه‌های اصلی</h6>
                  <h3 className="fw-bold mb-0">
                    {mainCategories.length}
                  </h3>
                </div>
                <div className="bg-success bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-folder text-success fs-4"></i>
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
                  <h6 className="text-muted mb-1">زیرگروه‌ها</h6>
                  <h3 className="fw-bold mb-0">
                    {subCategories.length}
                  </h3>
                </div>
                <div className="bg-info bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-folder2 text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-warning bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کل کالاها</h6>
                  <h3 className="fw-bold mb-0">
                    {totalProducts}
                  </h3>
                </div>
                <div className="bg-warning bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box-seam text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول گروه‌ها */}
      <div className="card border-0 shadow">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="bi bi-table me-2"></i>
              لیست گروه‌های کالا
            </h5>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center">
                <i className="bi bi-funnel me-1"></i>
                فیلتر
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
              <p className="mt-3 text-muted">
                در حال دریافت اطلاعات گروه‌ها...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-tags display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">گروه کالایی یافت نشد</h5>
              <p className="text-muted mb-4">
                هنوز هیچ گروه کالایی ایجاد نشده است
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button
                  onClick={fetchCategories}
                  className="btn btn-outline-secondary"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  تلاش مجدد
                </button>
                <Link
                  href="/inventory/product-categories/create"
                  className="btn btn-primary"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  ایجاد اولین گروه
                </Link>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>نام گروه</th>
                    <th style={{ width: "120px" }}>کد</th>
                    <th style={{ width: "100px" }} className="text-center">
                      کالاها
                    </th>
                    <th style={{ width: "100px" }} className="text-center">
                      زیرگروه‌ها
                    </th>
                    <th style={{ width: "220px" }} className="text-center">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mainCategories.map((category) => renderCategoryItem(category))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* فوتر جدول */}
        {categories.length > 0 && (
          <div className="card-footer bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                نمایش <strong>{categories.length}</strong> گروه کالا
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-download me-1"></i>
                  خروجی Excel
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-printer me-1"></i>
                  چاپ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* دیباگ اطلاعات */}
      {process.env.NODE_ENV === 'development' && categories.length > 0 && (
        <div className="mt-4">
          <details>
            <summary className="btn btn-sm btn-outline-info">
              <i className="bi bi-bug me-1"></i>
              نمایش اطلاعات دیباگ
            </summary>
            <div className="card mt-2">
              <div className="card-body">
                <h6>اطلاعات گروه‌ها:</h6>
                <pre className="bg-light p-3 small">
                  {JSON.stringify(categories.map(c => ({
                    id: c.id,
                    code: c.code,
                    name: c.name,
                    parentId: c.parentId,
                    children: c.children?.length || 0,
                    _count: c._count
                  })), null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}