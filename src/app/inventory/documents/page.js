'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InventoryDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  const [filters, setFilters] = useState({
    type: '',
    warehouseId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchWarehouses();
    fetchTransactionTypes();
  }, [pagination.page, filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      // حذف پارامترهای خالی
      if (!filters.type) params.delete('type');
      if (!filters.warehouseId) params.delete('warehouseId');
      if (!filters.startDate) params.delete('startDate');
      if (!filters.endDate) params.delete('endDate');
      
      const response = await fetch(`/api/inventory/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/inventory/warehouses');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setWarehouses([]);
    }
  };

  const fetchTransactionTypes = async () => {
    try {
      const response = await fetch('/api/inventory/transaction-types');
      if (response.ok) {
        const data = await response.json();
        setTransactionTypes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching transaction types:', error);
      setTransactionTypes([]);
    }
  };

  const getTypeBadgeClass = (effect) => {
    switch (effect) {
      case 'increase':
        return 'bg-success bg-opacity-10 text-success';
      case 'decrease':
        return 'bg-danger bg-opacity-10 text-danger';
      default:
        return 'bg-secondary bg-opacity-10 text-secondary';
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این سند اطمینان دارید؟\nتوجه: این عمل قابل بازگشت نیست و موجودی کالاها را تغییر می‌دهد.')) return;
    
    try {
      const response = await fetch(`/api/inventory/documents/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('سند با موفقیت حذف شد');
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف سند');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('خطا در حذف سند');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('fa-IR');
  };

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb Navigation */}
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
              انبار
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-file-earmark-text me-1"></i>
            اسناد انبار
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
            <i className="bi bi-file-earmark-text text-primary fs-4"></i>
          </div>
          <div>
            <h1 className="h2 fw-bold mb-1">اسناد انبار</h1>
            <p className="text-muted mb-0">مدیریت و مشاهده اسناد ورود و خروج انبار</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link
            href="/inventory/documents/create"
            className="btn btn-primary d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-2"></i>
            ثبت سند جدید
          </Link>
          <button
            onClick={fetchDocuments}
            className="btn btn-outline-secondary d-flex align-items-center"
            title="بروزرسانی"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* آمار */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-primary bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">کل اسناد</h6>
                  <h3 className="fw-bold mb-0">{pagination.total}</h3>
                </div>
                <div className="bg-primary bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-files text-primary fs-4"></i>
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
                  <h6 className="text-muted mb-1">اسناد ورودی</h6>
                  <h3 className="fw-bold mb-0">
                    {documents.filter(d => d.type?.effect === 'increase').length}
                  </h3>
                </div>
                <div className="bg-success bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box-arrow-in-down text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card border-0 bg-danger bg-opacity-10 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">اسناد خروجی</h6>
                  <h3 className="fw-bold mb-0">
                    {documents.filter(d => d.type?.effect === 'decrease').length}
                  </h3>
                </div>
                <div className="bg-danger bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box-arrow-up text-danger fs-4"></i>
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
                  <h6 className="text-muted mb-1">ارزش کل</h6>
                  <h3 className="fw-bold mb-0">
                    {formatNumber(documents.reduce((sum, doc) => sum + (doc.totalAmount || 0), 0))}
                  </h3>
                </div>
                <div className="bg-info bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-currency-exchange text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">
            <i className="bi bi-funnel me-2"></i>
            فیلتر اسناد
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">نوع سند</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="form-select"
              >
                <option value="">همه انواع</option>
                {transactionTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">انبار</label>
              <select
                value={filters.warehouseId}
                onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
                className="form-select"
              >
                <option value="">همه انبارها</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">از تاریخ</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="form-control"
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label">تا تاریخ</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="form-control"
              />
            </div>
            
            <div className="col-12">
              <div className="d-flex justify-content-between">
                <button
                  onClick={() => {
                    setFilters({
                      type: '',
                      warehouseId: '',
                      startDate: '',
                      endDate: ''
                    });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="btn btn-outline-secondary d-flex align-items-center"
                >
                  <i className="bi bi-x-circle me-2"></i>
                  پاک کردن فیلترها
                </button>
                <button
                  onClick={fetchDocuments}
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="bi bi-search me-2"></i>
                  اعمال فیلتر
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول اسناد */}
      <div className="card border-0 shadow">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="bi bi-table me-2"></i>
              لیست اسناد انبار
            </h5>
            <div className="d-flex gap-2">
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
        
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">در حال بارگذاری...</span>
              </div>
              <p className="mt-3 text-muted">در حال دریافت اطلاعات اسناد...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">سندی یافت نشد</h5>
              <p className="text-muted mb-4">هنوز هیچ سند انباری ثبت نشده است</p>
              <Link
                href="/inventory/documents/create"
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                ایجاد اولین سند
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '120px' }}>شماره سند</th>
                    <th style={{ width: '100px' }}>تاریخ</th>
                    <th style={{ width: '150px' }}>نوع سند</th>
                    <th style={{ width: '150px' }}>انبار</th>
                    <th style={{ width: '100px' }} className="text-center">تعداد</th>
                    <th style={{ width: '120px' }} className="text-center">مبلغ کل</th>
                    <th>توضیحات</th>
                    <th style={{ width: '250px' }} className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td>
                        <div className="font-monospace fw-medium">
                          {document.documentNumber}
                        </div>
                        {document.referenceNumber && (
                          <small className="text-muted d-block">
                            مرجع: {document.referenceNumber}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {formatDate(document.documentDate)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadgeClass(document.type?.effect)}`}>
                          <i className={`bi ${document.type?.effect === 'increase' ? 'bi-box-arrow-in-down' : 'bi-box-arrow-up'} me-1`}></i>
                          {document.type?.name}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{document.warehouse?.name}</div>
                          {document.warehouse?.code && (
                            <small className="text-muted d-block">
                              {document.warehouse.code}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="fw-medium">
                          {formatNumber(document.totalQuantity)}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`fw-medium ${document.totalAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatNumber(document.totalAmount)} ریال
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={document.description}>
                          {document.description || '-'}
                        </div>
                        {document.person && (
                          <small className="text-muted d-block">
                            <i className="bi bi-person me-1"></i>
                            {document.person.name}
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Link
                            href={`/inventory/documents/${document.id}`}
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            title="مشاهده جزئیات"
                          >
                            <i className="bi bi-eye"></i>
                            <span className="d-none d-md-inline me-1">مشاهده</span>
                          </Link>
                          
                          <button
                            onClick={() => handleDelete(document.id)}
                            className="btn btn-sm btn-outline-danger d-flex align-items-center"
                            title="حذف سند"
                          >
                            <i className="bi bi-trash"></i>
                            <span className="d-none d-md-inline me-1">حذف</span>
                          </button>
                          
                          {document.voucherId && (
                            <Link
                              href={`/vouchers/${document.voucherId}`}
                              className="btn btn-sm btn-outline-success d-flex align-items-center"
                              title="سند حسابداری"
                            >
                              <i className="bi bi-journal-text"></i>
                              <span className="d-none d-md-inline me-1">حسابداری</span>
                            </Link>
                          )}
                          
                          <Link
                            href={`/inventory/documents/${document.id}/print`}
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                            title="چاپ سند"
                          >
                            <i className="bi bi-printer"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* صفحه‌بندی */}
        {pagination.pages > 1 && (
          <div className="card-footer bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                نمایش {((pagination.page - 1) * pagination.limit) + 1} تا{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} از{' '}
                {pagination.total} سند
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
      </div>

      {/* راهنما */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="alert alert-info d-flex align-items-center">
            <i className="bi bi-info-circle fs-4 me-3"></i>
            <div>
              <h6 className="alert-heading mb-1">راهنمایی مدیریت اسناد</h6>
              <ul className="mb-0 small">
                <li>برای ایجاد سند جدید روی دکمه "ثبت سند جدید" کلیک کنید</li>
                <li>اسناد ورودی با رنگ سبز و اسناد خروجی با رنگ قرمز مشخص شده‌اند</li>
                <li>با کلیک روی دکمه "مشاهده" می‌توانید جزئیات کامل سند را ببینید</li>
                <li>اگر سند مربوط به حسابداری باشد، دکمه "حسابداری" برای مشاهده سند حسابداری فعال می‌شود</li>
                <li>حذف سند منجر به تغییر موجودی کالاها می‌شود</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}