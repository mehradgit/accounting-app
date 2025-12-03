'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    lowStockItems: 0,
    recentTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { 
      title: 'ثبت سند خرید', 
      icon: 'bi-cart-plus', 
      href: '/inventory/documents/create?type=PURCHASE', 
      color: 'bg-success bg-opacity-10 text-success border-success',
      description: 'ثبت خرید جدید'
    },
    { 
      title: 'ثبت سند فروش', 
      icon: 'bi-cash-coin', 
      href: '/inventory/documents/create?type=SALE', 
      color: 'bg-primary bg-opacity-10 text-primary border-primary',
      description: 'ثبت فروش جدید'
    },
    { 
      title: 'افزودن کالا', 
      icon: 'bi-plus-circle', 
      href: '/inventory/products/create', 
      color: 'bg-warning bg-opacity-10 text-warning border-warning',
      description: 'تعریف کالای جدید'
    },
    { 
      title: 'گزارش موجودی', 
      icon: 'bi-bar-chart', 
      href: '/inventory/reports/stock-status', 
      color: 'bg-info bg-opacity-10 text-info border-info',
      description: 'گزارش جامع موجودی'
    },
  ];

  const modules = [
    { 
      title: 'کالاها', 
      href: '/inventory/products', 
      description: 'مدیریت کالاها و قیمت‌ها', 
      icon: 'bi-box-seam',
      color: 'text-primary'
    },
    { 
      title: 'گروه کالا', 
      href: '/inventory/product-categories', 
      description: 'دسته‌بندی کالاها', 
      icon: 'bi-tags',
      color: 'text-success'
    },
    { 
      title: 'واحدها', 
      href: '/inventory/units', 
      description: 'واحدهای اندازه‌گیری', 
      icon: 'bi-rulers',
      color: 'text-info'
    },
    { 
      title: 'انبارها', 
      href: '/inventory/warehouses', 
      description: 'مدیریت انبارها', 
      icon: 'bi-buildings',
      color: 'text-warning'
    },
    { 
      title: 'انواع اسناد', 
      href: '/inventory/transaction-types', 
      description: 'انواع اسناد انبار', 
      icon: 'bi-file-earmark-text',
      color: 'text-secondary'
    },
    { 
      title: 'اسناد انبار', 
      href: '/inventory/documents', 
      description: 'ثبت و مدیریت اسناد', 
      icon: 'bi-journal-text',
      color: 'text-danger'
    },
    { 
      title: 'گزارشات', 
      href: '/inventory/reports', 
      description: 'گزارشات انبار', 
      icon: 'bi-graph-up',
      color: 'text-purple'
    },
  ];

  return (
    <div className="container-fluid py-4">
      {/* هدر */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-2">
            <i className="bi bi-archive text-primary me-2"></i>
            داشبورد انبارداری
          </h1>
          <p className="text-muted mb-0">مدیریت و نظارت بر سیستم انبارداری</p>
        </div>
        <div>
          <button 
            onClick={fetchDashboardStats}
            className="btn btn-outline-secondary d-flex align-items-center"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            بروزرسانی
          </button>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد کالاها</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className="fw-bold mb-0">{stats.totalProducts.toLocaleString()}</h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-box me-1"></i>
                    کالای فعال
                  </div>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-box-seam text-primary fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/products" className="text-decoration-none small">
                مشاهده همه
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد انبارها</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className="fw-bold mb-0">{stats.totalWarehouses.toLocaleString()}</h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-geo-alt me-1"></i>
                    انبار فعال
                  </div>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-buildings text-success fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/warehouses" className="text-decoration-none small">
                مشاهده همه
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کالاهای کم موجود</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className={`fw-bold mb-0 ${stats.lowStockItems > 0 ? 'text-danger' : 'text-success'}`}>
                      {stats.lowStockItems.toLocaleString()}
                    </h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    نیاز به سفارش
                  </div>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-exclamation-triangle text-warning fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/reports/low-stock" className="text-decoration-none small">
                مشاهده جزئیات
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تراکنش‌های اخیر</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-6"></span>
                    </div>
                  ) : (
                    <h3 className="fw-bold mb-0">{stats.recentTransactions.toLocaleString()}</h3>
                  )}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-clock-history me-1"></i>
                    ۷ روز گذشته
                  </div>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-arrow-left-right text-info fs-4"></i>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0 py-2">
              <Link href="/inventory/documents" className="text-decoration-none small">
                مشاهده همه
                <i className="bi bi-arrow-left me-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* اقدامات سریع */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">
            <i className="bi bi-lightning-charge text-warning me-2"></i>
            اقدامات سریع
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {quickActions.map((action, index) => (
              <div key={index} className="col-xl-3 col-md-6">
                <Link 
                  href={action.href}
                  className="card border h-100 text-decoration-none hover-shadow"
                >
                  <div className="card-body text-center py-4">
                    <div className={`${action.color.split(' ')[0]} bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3`} 
                         style={{ width: '60px', height: '60px' }}>
                      <i className={`${action.icon} ${action.color.split(' ')[2]} fs-3`}></i>
                    </div>
                    <h6 className="card-title fw-bold mb-2">{action.title}</h6>
                    <p className="text-muted small mb-0">{action.description}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ماژول‌های انبارداری */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">
            <i className="bi bi-grid-3x3-gap text-primary me-2"></i>
            ماژول‌های انبارداری
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {modules.map((module, index) => (
              <div key={index} className="col-xl-4 col-md-6">
                <Link 
                  href={module.href}
                  className="card border-0 shadow-sm h-100 text-decoration-none hover-lift"
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className={`${module.color} d-flex align-items-center justify-content-center rounded-circle me-3`} 
                           style={{ width: '50px', height: '50px' }}>
                        <i className={`${module.icon} fs-4`}></i>
                      </div>
                      <div>
                        <h6 className="card-title fw-bold mb-1">{module.title}</h6>
                        <p className="text-muted small mb-0">{module.description}</p>
                      </div>
                      <div className="ms-auto">
                        <i className="bi bi-arrow-left text-muted"></i>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* هشدارهای موجودی */}
      {stats.lowStockItems > 0 && (
        <div className="alert alert-warning d-flex align-items-center border-0 shadow-sm">
          <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
            <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
          </div>
          <div className="flex-grow-1">
            <h6 className="alert-heading mb-1">هشدار کمبود موجودی</h6>
            <p className="mb-0">
              <strong>{stats.lowStockItems}</strong> کالا موجودی کمتر از حد مجاز دارند و نیاز به بررسی فوری دارند.
            </p>
          </div>
          <div>
            <Link href="/inventory/reports/low-stock" className="btn btn-warning btn-sm">
              <i className="bi bi-eye me-1"></i>
              مشاهده
            </Link>
          </div>
        </div>
      )}

      {/* فعالیت‌های اخیر (نمونه) */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">
            <i className="bi bi-clock-history text-info me-2"></i>
            فعالیت‌های اخیر
          </h5>
        </div>
        <div className="card-body">
          <div className="list-group list-group-flush">
            <div className="list-group-item d-flex align-items-center border-0 py-3">
              <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                <i className="bi bi-cart-plus text-success"></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <span className="fw-medium">سند خرید جدید</span>
                  <small className="text-muted">۱۵ دقیقه قبل</small>
                </div>
                <small className="text-muted">کد سند: PUR-2024-00123</small>
              </div>
            </div>
            <div className="list-group-item d-flex align-items-center border-0 py-3">
              <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                <i className="bi bi-cash-coin text-primary"></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <span className="fw-medium">سند فروش ثبت شد</span>
                  <small className="text-muted">۲ ساعت قبل</small>
                </div>
                <small className="text-muted">کد سند: SAL-2024-00456</small>
              </div>
            </div>
            <div className="list-group-item d-flex align-items-center border-0 py-3">
              <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                <i className="bi bi-plus-circle text-warning"></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <span className="fw-medium">کالای جدید اضافه شد</span>
                  <small className="text-muted">۱ روز قبل</small>
                </div>
                <small className="text-muted">کد کالا: PRD-045</small>
              </div>
            </div>
          </div>
        </div>
        <div className="card-footer bg-transparent text-center py-3">
          <Link href="/inventory/documents" className="text-decoration-none">
            مشاهده همه فعالیت‌ها
            <i className="bi bi-arrow-left me-2"></i>
          </Link>
        </div>
      </div>

      {/* CSS اضافی */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }
        .text-purple {
          color: #6f42c1;
        }
      `}</style>
    </div>
  );
}