'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StockStatusReportPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    warehouseId: '',
    categoryId: '',
    showLowStock: false
  });

  useEffect(() => {
    loadDependencies();
  }, []);

  const loadDependencies = async () => {
    try {
      const [warehousesRes, categoriesRes] = await Promise.all([
        fetch('/api/inventory/warehouses'),
        fetch('/api/inventory/product-categories')
      ]);

      const [warehousesData, categoriesData] = await Promise.all([
        warehousesRes.json(),
        categoriesRes.json()
      ]);

      setWarehouses(warehousesData.warehouses || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setReport(null);
      const params = new URLSearchParams();
      
      if (filters.warehouseId) {
        params.append('warehouseId', filters.warehouseId);
      }
      
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      
      if (filters.showLowStock) {
        params.append('showLowStock', 'true');
      }
      
      const response = await fetch(`/api/inventory/reports/stock-status?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        alert('خطا در تولید گزارش');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('خطا در تولید گزارش');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      
      if (filters.warehouseId) {
        params.append('warehouseId', filters.warehouseId);
      }
      
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      
      if (filters.showLowStock) {
        params.append('showLowStock', 'true');
      }
      
      params.append('format', format);
      
      window.open(`/api/inventory/reports/stock-status/export?${params}`, '_blank');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('خطا در خروجی گرفتن گزارش');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      warehouseId: '',
      categoryId: '',
      showLowStock: false
    });
    setReport(null);
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
            <Link href="/inventory/reports" className="text-decoration-none">
              <i className="bi bi-graph-up me-1"></i>
              گزارشات
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-clipboard-data me-1"></i>
            گزارش موجودی انبار
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">
            <i className="bi bi-clipboard-data text-primary me-2"></i>
            گزارش وضعیت موجودی انبار
          </h1>
          <p className="text-muted mb-0">نمایش وضعیت موجودی کالاها در انبارها</p>
        </div>
        <div>
          <button
            onClick={() => router.back()}
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت
          </button>
        </div>
      </div>

      {/* فیلترها */}
      <div className="card border-0 shadow mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">
            <i className="bi bi-funnel me-2"></i>
            فیلترهای گزارش
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">انبار</label>
              <select
                value={filters.warehouseId}
                onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
                className="form-select"
              >
                <option value="">همه انبارها</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
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
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="showLowStock"
                  checked={filters.showLowStock}
                  onChange={(e) => handleFilterChange('showLowStock', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="showLowStock">
                  نمایش فقط کالاهای کم موجود
                </label>
              </div>
            </div>
            
            <div className="col-md-3 d-flex align-items-end gap-2">
              <button
                onClick={generateReport}
                className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-circle me-2"></i>
                    تولید گزارش
                  </>
                )}
              </button>
              <button
                onClick={resetFilters}
                className="btn btn-outline-secondary"
                title="پاک کردن فیلترها"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* گزارش */}
      {report && (
        <>
          {/* آمار کلی */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-start border-primary border-4 shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                        تعداد کالاها
                      </div>
                      <div className="h5 mb-0 fw-bold text-gray-800">{report.summary.totalItems}</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-box-seam fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-start border-success border-4 shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs fw-bold text-success text-uppercase mb-1">
                        کل تعداد موجودی
                      </div>
                      <div className="h5 mb-0 fw-bold text-gray-800">
                        {report.summary.totalQuantity.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-bar-chart fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-start border-warning border-4 shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                        ارزش کل موجودی
                      </div>
                      <div className="h5 mb-0 fw-bold text-gray-800">
                        {report.summary.totalValue.toLocaleString()} ریال
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-currency-dollar fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-start border-danger border-4 shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs fw-bold text-danger text-uppercase mb-1">
                        کالاهای کم موجود
                      </div>
                      <div className="h5 mb-0 fw-bold text-gray-800">{report.summary.lowStockItems}</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-exclamation-triangle fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* جدول گزارش */}
          <div className="card border-0 shadow mb-4">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="bi bi-table me-2"></i>
                  جزئیات موجودی
                </h5>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => handleExport('excel')}
                    className="btn btn-success btn-sm d-flex align-items-center"
                    disabled={exporting}
                  >
                    {exporting ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-file-earmark-excel me-2"></i>
                    )}
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="btn btn-danger btn-sm d-flex align-items-center"
                    disabled={exporting}
                  >
                    {exporting ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                    )}
                    PDF
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  >
                    <i className="bi bi-printer me-2"></i>
                    چاپ
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ردیف</th>
                      <th>کد کالا</th>
                      <th>نام کالا</th>
                      <th>گروه</th>
                      <th>انبار</th>
                      <th className="text-center">موجودی</th>
                      <th>واحد</th>
                      <th className="text-end">قیمت خرید</th>
                      <th className="text-end">ارزش</th>
                      <th className="text-center">حداقل</th>
                      <th className="text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.report.map((item, index) => (
                      <tr key={item.id} className={item.isLowStock ? 'table-warning' : ''}>
                        <td className="text-muted">{index + 1}</td>
                        <td>
                          <span className="badge bg-light text-dark font-monospace">
                            {item.productCode}
                          </span>
                        </td>
                        <td className="fw-medium">{item.productName}</td>
                        <td>{item.category}</td>
                        <td>{item.warehouse}</td>
                        <td className="text-center">
                          <span className={`fw-bold ${item.isLowStock ? 'text-danger' : 'text-success'}`}>
                            {item.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td>{item.unit}</td>
                        <td className="text-end font-monospace">{item.unitPrice.toLocaleString()}</td>
                        <td className="text-end fw-bold font-monospace">{item.totalValue.toLocaleString()}</td>
                        <td className="text-center">{item.minStock}</td>
                        <td className="text-center">
                          {item.isLowStock ? (
                            <span className="badge bg-danger">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              کمبود
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              مناسب
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <th colSpan="5" className="text-end">جمع کل:</th>
                      <th className="text-center">{report.summary.totalQuantity.toLocaleString()}</th>
                      <th></th>
                      <th></th>
                      <th className="text-end fw-bold">{report.summary.totalValue.toLocaleString()} ریال</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div className="card-footer bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')}
                </div>
                <div className="text-muted small">
                  تعداد ردیف: <strong>{report.report.length}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* خلاصه گزارش */}
          <div className="row">
            <div className="col-md-6">
              <div className="card border-0 shadow">
                <div className="card-header bg-white">
                  <h6 className="mb-0">
                    <i className="bi bi-pie-chart me-2"></i>
                    توزیع موجودی بر اساس انبار
                  </h6>
                </div>
                <div className="card-body">
                  {report.summary.warehouseDistribution && Object.keys(report.summary.warehouseDistribution).length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {Object.entries(report.summary.warehouseDistribution).map(([warehouse, count]) => (
                        <li key={warehouse} className="list-group-item d-flex justify-content-between align-items-center px-0">
                          {warehouse}
                          <span className="badge bg-primary rounded-pill">{count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-center mb-0">اطلاعاتی موجود نیست</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card border-0 shadow">
                <div className="card-header bg-white">
                  <h6 className="mb-0">
                    <i className="bi bi-tags me-2"></i>
                    توزیع موجودی بر اساس گروه
                  </h6>
                </div>
                <div className="card-body">
                  {report.summary.categoryDistribution && Object.keys(report.summary.categoryDistribution).length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {Object.entries(report.summary.categoryDistribution).map(([category, count]) => (
                        <li key={category} className="list-group-item d-flex justify-content-between align-items-center px-0">
                          {category}
                          <span className="badge bg-success rounded-pill">{count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-center mb-0">اطلاعاتی موجود نیست</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* پیغام خالی */}
      {!report && !loading && (
        <div className="text-center py-5">
          <i className="bi bi-clipboard-data display-1 text-muted mb-3"></i>
          <h5 className="text-muted mb-2">گزارشی یافت نشد</h5>
          <p className="text-muted mb-4">برای مشاهده گزارش، فیلترها را تنظیم و دکمه "تولید گزارش" را کلیک کنید</p>
        </div>
      )}
    </div>
  );
}