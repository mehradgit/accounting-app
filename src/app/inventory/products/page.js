'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    hasLowStock: false
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      // حذف پارامترهای خالی
      if (!filters.search) params.delete('search');
      if (!filters.categoryId) params.delete('categoryId');
      
      const response = await fetch(`/api/inventory/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/inventory/product-categories');
      if (response.ok) {
        const data = await response.json();
        // بررسی کنید که آیا آرایه است یا آبجکت
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این کالا اطمینان دارید؟')) return;
    
    try {
      const response = await fetch(`/api/inventory/products/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('کالا با موفقیت حذف شد');
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف کالا');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('خطا در حذف کالا');
    }
  };

  // تابع کمکی برای فرمت‌بندی اعداد
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('fa-IR');
  };

  // تابع برای بررسی امن موجودی
  const getProductStock = (product) => {
    // اگر currentStock وجود دارد استفاده کن، در غیر این صورت 0 برگردان
    return product.currentStock !== undefined ? product.currentStock : 0;
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">مدیریت کالاها</h1>
        <Link
          href="/inventory/products/create"
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-circle"></i>
          افزودن کالا جدید
        </Link>
      </div>
      
      {/* فیلترها */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">جستجو</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="جستجوی کد، نام یا بارکد"
                className="form-control"
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label">گروه کالا</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="form-select"
              >
                <option value="">همه گروه‌ها</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={filters.hasLowStock}
                  onChange={(e) => handleFilterChange('hasLowStock', e.target.checked)}
                  id="hasLowStock"
                />
                <label className="form-check-label" htmlFor="hasLowStock">
                  کالاهای کم موجود
                </label>
              </div>
            </div>
            
            <div className="col-md-3 d-flex align-items-end">
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    categoryId: '',
                    hasLowStock: false
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="btn btn-outline-secondary w-100"
              >
                <i className="bi bi-x-circle me-2"></i>
                پاک کردن فیلترها
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* جدول کالاها */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">در حال بارگذاری...</span>
              </div>
              <p className="mt-2">در حال بارگذاری...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-box-seam display-5 d-block mb-3"></i>
              کالایی یافت نشد
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80px' }}>کد</th>
                      <th>نام کالا</th>
                      <th style={{ width: '150px' }}>گروه</th>
                      <th style={{ width: '120px' }}>قیمت خرید</th>
                      <th style={{ width: '120px' }}>قیمت فروش</th>
                      <th style={{ width: '120px' }}>موجودی</th>
                      <th style={{ width: '100px' }}>واحد</th>
                      <th style={{ width: '200px' }}>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const currentStock = getProductStock(product);
                      const minStock = product.minStock || 0;
                      
                      return (
                        <tr key={product.id}>
                          <td>
                            <span className="badge bg-light text-dark font-monospace">
                              {product.code}
                            </span>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{product.name}</div>
                              {product.barcode && (
                                <div className="text-muted small">
                                  <i className="bi bi-upc-scan me-1"></i>
                                  {product.barcode}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {product.category?.name ? (
                              <span className="badge bg-info bg-opacity-10 text-info">
                                {product.category.name}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-nowrap">
                            {formatNumber(product.defaultPurchasePrice)} ریال
                          </td>
                          <td className="text-nowrap">
                            <span className="fw-medium text-success">
                              {formatNumber(product.defaultSalePrice)} ریال
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className={`fw-medium ${
                                minStock > 0 && currentStock <= minStock 
                                  ? 'text-danger' 
                                  : 'text-success'
                              }`}>
                                {formatNumber(currentStock)}
                              </span>
                              {minStock > 0 && (
                                <span className="text-muted small me-2">
                                  (حداقل: {formatNumber(minStock)})
                                </span>
                              )}
                              {minStock > 0 && currentStock <= minStock && (
                                <i className="bi bi-exclamation-triangle text-danger me-1"></i>
                              )}
                            </div>
                          </td>
                          <td>
                            {product.unit?.name ? (
                              <span className="badge bg-secondary bg-opacity-10 text-secondary">
                                {product.unit.name}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              <Link
                                href={`/inventory/products/${product.id}`}
                                className="btn btn-outline-primary"
                                title="ویرایش"
                              >
                                <i className="bi bi-pencil"></i>
                                <span className="d-none d-md-inline ms-1">ویرایش</span>
                              </Link>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="btn btn-outline-danger"
                                title="حذف"
                              >
                                <i className="bi bi-trash"></i>
                                <span className="d-none d-md-inline ms-1">حذف</span>
                              </button>
                              <Link
                                href={`/inventory/products/${product.id}/ledger`}
                                className="btn btn-outline-secondary"
                                title="کاردکس"
                              >
                                <i className="bi bi-journal-text"></i>
                                <span className="d-none d-md-inline ms-1">کاردکس</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* صفحه‌بندی */}
              {pagination.pages > 1 && (
                <div className="card-footer">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      نمایش {((pagination.page - 1) * pagination.limit) + 1} تا{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} از{' '}
                      {pagination.total} کالا
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </li>
                        
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          let pageNum;
                          if (pagination.pages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          
                          return (
                            <li 
                              key={pageNum} 
                              className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}
                        
                        <li className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.pages}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}