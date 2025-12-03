'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function WarehouseStockPage() {
  const router = useRouter();
  const params = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, low, normal

  useEffect(() => {
    if (params.id) {
      fetchWarehouseStock();
    }
  }, [params.id]);

  const fetchWarehouseStock = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/warehouses/${params.id}/stock`);
      if (response.ok) {
        const data = await response.json();
        setWarehouse(data.warehouse);
        setStockItems(data.stockItems || []);
      }
    } catch (error) {
      console.error('Error fetching warehouse stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockValue = (item) => {
    return (item.quantity || 0) * (item.product?.defaultPurchasePrice || 0);
  };

  const getFilteredItems = () => {
    switch(filter) {
      case 'low':
        return stockItems.filter(item => 
          item.quantity <= (item.minStock || item.product?.minStock || 0)
        );
      case 'normal':
        return stockItems.filter(item => 
          item.quantity > (item.minStock || item.product?.minStock || 0)
        );
      default:
        return stockItems;
    }
  };

  const filteredItems = getFilteredItems();
  const totalValue = filteredItems.reduce((sum, item) => sum + getStockValue(item), 0);
  const totalQuantity = filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  const lowStockItems = stockItems.filter(item => 
    item.quantity <= (item.minStock || item.product?.minStock || 0)
  );

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
            <i className="bi bi-box-seam me-1"></i>
            موجودی انبار
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-info bg-gradient p-3 rounded-3 me-3">
            <i className="bi bi-boxes text-white fs-4"></i>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-1">موجودی انبار</h1>
            {warehouse && (
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary">{warehouse.code}</span>
                <span className="text-muted">{warehouse.name}</span>
                {warehouse.manager && (
                  <span className="text-muted small">
                    <i className="bi bi-person me-1"></i>
                    مسئول: {warehouse.manager}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="btn-group" role="group">
          <button
            onClick={() => router.push(`/inventory/documents/create?warehouseId=${params.id}&type=ADJUSTMENT_PLUS`)}
            className="btn btn-success d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-2"></i>
            تعدیل موجودی
          </button>
          <button
            onClick={() => router.push('/inventory/warehouses')}
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت
          </button>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 bg-primary bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد کالاها</h6>
                  <h3 className="fw-bold mb-0">{filteredItems.length}</h3>
                  <small className="text-muted">از {stockItems.length} کالا</small>
                </div>
                <div className="bg-primary bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 bg-success bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کل تعداد</h6>
                  <h3 className="fw-bold mb-0">{totalQuantity.toLocaleString()}</h3>
                  <small className="text-muted">تعداد کل واحدها</small>
                </div>
                <div className="bg-success bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-calculator text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 bg-info bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">ارزش کل</h6>
                  <h3 className="fw-bold mb-0">
                    {totalValue.toLocaleString()}
                    <small className="fs-6"> ریال</small>
                  </h3>
                  <small className="text-muted">ارزش بر اساس قیمت خرید</small>
                </div>
                <div className="bg-info bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-currency-exchange text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 bg-warning bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کالاهای کمبود</h6>
                  <h3 className="fw-bold mb-0">{lowStockItems.length}</h3>
                  <small className="text-muted">نیاز به سفارش</small>
                </div>
                <div className="bg-warning bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-exclamation-triangle text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-medium">فیلتر:</span>
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('all')}
                  >
                    همه کالاها
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'normal' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setFilter('normal')}
                  >
                    موجودی مناسب
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'low' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setFilter('low')}
                  >
                    کمبود موجودی
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-end gap-2">
                <button 
                  onClick={fetchWarehouseStock}
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm d-flex align-items-center">
                  <i className="bi bi-printer me-1"></i>
                  چاپ
                </button>
                <button className="btn btn-outline-secondary btn-sm d-flex align-items-center">
                  <i className="bi bi-download me-1"></i>
                  خروجی
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول موجودی */}
      <div className="card border-0 shadow">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">در حال بارگذاری...</span>
              </div>
              <p className="mt-3 text-muted">در حال دریافت اطلاعات موجودی...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-box-seam display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">
                {filter === 'all' ? 'کالایی در این انبار موجود نیست' : 
                 filter === 'low' ? 'کالای کم‌موجود یافت نشد' : 
                 'کالای با موجودی مناسب یافت نشد'}
              </h5>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="btn btn-outline-primary mt-2"
                >
                  مشاهده همه کالاها
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>کد کالا</th>
                    <th>نام کالا</th>
                    <th style={{ width: '100px' }}>واحد</th>
                    <th style={{ width: '120px' }}>موجودی</th>
                    <th style={{ width: '120px' }}>قیمت خرید</th>
                    <th style={{ width: '120px' }}>ارزش</th>
                    <th style={{ width: '100px' }}>حداقل</th>
                    <th style={{ width: '100px' }}>وضعیت</th>
                    <th style={{ width: '120px' }} className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLowStock = item.quantity <= (item.minStock || item.product?.minStock || 0);
                    const stockValue = getStockValue(item);
                    const minStock = item.minStock || item.product?.minStock || 0;
                    
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className="badge bg-light text-dark font-monospace">
                            {item.product?.code}
                          </span>
                        </td>
                        <td>
                          <div className="fw-medium">{item.product?.name}</div>
                          {item.product?.barcode && (
                            <small className="text-muted d-block">
                              <i className="bi bi-upc me-1"></i>
                              {item.product.barcode}
                            </small>
                          )}
                        </td>
                        <td>
                          {item.product?.unit?.name ? (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              {item.product.unit.name}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className={`fw-bold ${isLowStock ? 'text-danger' : 'text-success'}`}>
                              {item.quantity.toLocaleString()}
                            </span>
                            {isLowStock && (
                              <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                            )}
                          </div>
                        </td>
                        <td className="text-nowrap">
                          {item.product?.defaultPurchasePrice?.toLocaleString()} ریال
                        </td>
                        <td className="fw-bold text-nowrap">
                          {stockValue.toLocaleString()} ریال
                        </td>
                        <td>
                          <span className={`badge ${isLowStock ? 'bg-danger' : 'bg-secondary'}`}>
                            {minStock}
                          </span>
                        </td>
                        <td>
                          {isLowStock ? (
                            <span className="badge bg-warning bg-opacity-10 text-warning">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              کمبود
                            </span>
                          ) : (
                            <span className="badge bg-success bg-opacity-10 text-success">
                              <i className="bi bi-check-circle me-1"></i>
                              مناسب
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              onClick={() => router.push(`/inventory/products/${item.productId}`)}
                              className="btn btn-outline-primary"
                              title="مشاهده کالا"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              onClick={() => router.push(`/inventory/documents/create?productId=${item.productId}&warehouseId=${params.id}&type=TRANSFER`)}
                              className="btn btn-outline-info"
                              title="انتقال کالا"
                            >
                              <i className="bi bi-arrow-left-right"></i>
                            </button>
                            <button
                              onClick={() => router.push(`/inventory/documents/create?productId=${item.productId}&warehouseId=${params.id}&type=ADJUSTMENT_PLUS`)}
                              className="btn btn-outline-success"
                              title="افزایش موجودی"
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* فوتر جدول */}
        {filteredItems.length > 0 && (
          <div className="card-footer bg-white py-3">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="text-muted small">
                  نمایش <strong>{filteredItems.length}</strong> کالا از <strong>{stockItems.length}</strong> کالا
                  {filter !== 'all' && ` (فیلتر: ${filter === 'low' ? 'کمبود' : 'مناسب'})`}
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-end">
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <small className="text-muted d-block">ارزش کل نمایش داده شده</small>
                      <strong className="text-success">{totalValue.toLocaleString()} ریال</strong>
                    </div>
                    <div className="vr"></div>
                    <div className="text-end">
                      <small className="text-muted d-block">تعداد کل نمایش داده شده</small>
                      <strong>{totalQuantity.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* راهنما */}
      {lowStockItems.length > 0 && (
        <div className="alert alert-warning mt-4">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
            <div>
              <h6 className="alert-heading mb-1">هشدار: کمبود موجودی</h6>
              <p className="mb-0">
                {lowStockItems.length} کالا در این انبار در وضعیت کمبود موجودی قرار دارد. 
                <button 
                  onClick={() => setFilter('low')}
                  className="btn btn-link p-0 text-decoration-none"
                >
                  مشاهده لیست کالاهای کم‌موجود
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}