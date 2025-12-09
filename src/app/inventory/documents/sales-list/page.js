// src/app/inventory/documents/sales-list/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SalesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    invoiceNumber: "",
    page: 1,
    limit: 20,
  });
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [filters.page, filters.startDate, filters.endDate, filters.invoiceNumber]);

  const fetchSales = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `/api/inventory/documents/sales/list?${queryParams}`
      );

      if (response.ok) {
        const data = await response.json();
        setSales(data.documents || []);
        setStats(data.stats || {});
        setPagination(data.pagination || {});
      }
    } catch (error) {
      console.error("خطا در دریافت لیست فروش:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/detail-accounts/for-customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.accounts || []);
      }
    } catch (error) {
      console.error("خطا در دریافت مشتریان:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDateRangeChange = (start, end) => {
    setFilters((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
      page: 1,
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const getStatusColor = (document) => {
    if (document.voucher) return "success";
    return "warning";
  };

  const getStatusText = (document) => {
    if (document.voucher) return "تکمیل شده";
    return "در انتظار";
  };

  return (
    <div className="container-fluid py-4">
      {/* هدر */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">📋 لیست فاکتورهای فروش</h1>
          <p className="text-muted mb-0">
            مشاهده و مدیریت کلیه فاکتورهای فروش ثبت شده
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link
            href="/inventory/documents/sales-invoice"
            className="btn btn-primary"
          >
            <i className="bi bi-plus-circle me-2"></i>
            فاکتور فروش جدید
          </Link>
          <button onClick={fetchSales} className="btn btn-outline-secondary">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* آمار */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد فاکتورها</h6>
                  <h3 className="fw-bold mb-0">{stats.totalSales || 0}</h3>
                </div>
                <div className="bg-success bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-receipt text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">جمع فروش</h6>
                  <h3 className="fw-bold mb-0">
                    {formatCurrency(stats.totalAmount || 0)}
                  </h3>
                </div>
                <div className="bg-primary bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-currency-exchange text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-info">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">تعداد کالا</h6>
                  <h3 className="fw-bold mb-0">
                    {stats.totalQuantity?.toLocaleString("fa-IR") || 0}
                  </h3>
                </div>
                <div className="bg-info bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-box-seam text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">میانگین فاکتور</h6>
                  <h3 className="fw-bold mb-0">
                    {stats.totalSales > 0
                      ? formatCurrency(
                          (stats.totalAmount || 0) / stats.totalSales
                        )
                      : formatCurrency(0)}
                  </h3>
                </div>
                <div className="bg-warning bg-opacity-25 p-3 rounded-circle">
                  <i className="bi bi-graph-up text-warning fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">🔍 فیلترها</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">از تاریخ</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">تا تاریخ</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">شماره فاکتور</label>
              <input
                type="text"
                className="form-control"
                placeholder="جستجو..."
                value={filters.invoiceNumber}
                onChange={(e) =>
                  handleFilterChange("invoiceNumber", e.target.value)
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">مشتری</label>
              <select
                className="form-select"
                value={filters.customerId || ""}
                onChange={(e) =>
                  handleFilterChange("customerId", e.target.value)
                }
              >
                <option value="">همه مشتریان</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.person?.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <div className="d-flex gap-2 justify-content-end">
                <button
                  onClick={() =>
                    setFilters({
                      startDate: "",
                      endDate: "",
                      invoiceNumber: "",
                      customerId: "",
                      page: 1,
                      limit: 20,
                    })
                  }
                  className="btn btn-outline-secondary"
                >
                  پاک کردن فیلترها
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline-primary"
                >
                  <i className="bi bi-printer me-2"></i>
                  چاپ گزارش
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* جدول فروش */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">📄 فاکتورهای فروش</h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">در حال بارگذاری...</span>
              </div>
              <p className="mt-3 text-muted">در حال دریافت اطلاعات...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt display-1 text-muted mb-3"></i>
              <h5 className="text-muted mb-2">فاکتور فروشی یافت نشد</h5>
              <p className="text-muted mb-4">
                هنوز هیچ فاکتور فروشی ثبت نشده است
              </p>
              <Link
                href="/inventory/documents/sales-invoice"
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                ایجاد اولین فاکتور فروش
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>تاریخ</th>
                    <th>شماره فاکتور</th>
                    <th>مشتری</th>
                    <th>انبار</th>
                    <th className="text-end">مبلغ</th>
                    <th className="text-end">تعداد</th>
                    <th>سند حسابداری</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        {formatDate(sale.documentDate)}
                        <div className="small text-muted">
                          {new Date(sale.documentDate).toLocaleTimeString(
                            "fa-IR"
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>
                          {sale.referenceNumber || sale.documentNumber}
                        </strong>
                        <div className="small text-muted">
                          {sale.type?.name}
                        </div>
                      </td>
                      <td>
                        {sale.person?.name || "نامشخص"}
                        {sale.description && (
                          <div
                            className="small text-muted text-truncate"
                            style={{ maxWidth: "200px" }}
                          >
                            {sale.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {sale.warehouse?.name}
                        <div className="small text-muted">
                          {sale.warehouse?.code}
                        </div>
                      </td>
                      <td className="text-end fw-bold text-success">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="text-end">
                        {sale.totalQuantity?.toLocaleString("fa-IR") || 0}
                        <div className="small text-muted">
                          {sale.ledgerEntries?.length || 0} قلم کالا
                        </div>
                      </td>
                      <td>
                        {sale.voucher ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle me-1"></i>
                            {sale.voucher.voucherNumber}
                          </span>
                        ) : (
                          <span className="badge bg-warning">
                            <i className="bi bi-clock me-1"></i>
                            بدون سند
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusColor(sale)}`}>
                          {getStatusText(sale)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Link
                            href={`/inventory/documents/${sale.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link
                            href={`/inventory/documents/sales/${sale.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {sale.voucher && (
                            <Link
                              href={`/vouchers/${sale.voucher.id}`}
                              className="btn btn-sm btn-outline-success"
                            >
                              <i className="bi bi-file-text"></i>
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              // امکان حذف یا ویرایش
                            }}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            <i className="bi bi-printer"></i>
                          </button>
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
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                نمایش {sales.length} از {pagination.total} فاکتور
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li
                    className={`page-item ${
                      filters.page === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        handleFilterChange("page", filters.page - 1)
                      }
                    >
                      قبلی
                    </button>
                  </li>

                  {[...Array(Math.min(5, pagination.totalPages)).keys()].map(
                    (i) => {
                      const pageNum =
                        Math.max(
                          1,
                          Math.min(pagination.totalPages - 4, filters.page - 2)
                        ) + i;

                      if (pageNum > 0 && pageNum <= pagination.totalPages) {
                        return (
                          <li
                            key={pageNum}
                            className={`page-item ${
                              filters.page === pageNum ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                handleFilterChange("page", pageNum)
                              }
                            >
                              {pageNum}
                            </button>
                          </li>
                        );
                      }
                      return null;
                    }
                  )}

                  <li
                    className={`page-item ${
                      filters.page === pagination.totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        handleFilterChange("page", filters.page + 1)
                      }
                    >
                      بعدی
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* لینک‌های مفید */}
      <div className="mt-4 d-flex justify-content-between">
        <Link href="/inventory/documents" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-right me-2"></i>
          بازگشت به لیست اسناد
        </Link>

        <div className="d-flex gap-2">
          <Link
            href="/reports/account-turnover"
            className="btn btn-outline-info"
          >
            <i className="bi bi-graph-up me-2"></i>
            گزارش گردش حساب
          </Link>
          <Link
            href="/inventory/reports/stock-status"
            className="btn btn-outline-warning"
          >
            <i className="bi bi-box-seam me-2"></i>
            گزارش موجودی
          </Link>
        </div>
      </div>
    </div>
  );
}
