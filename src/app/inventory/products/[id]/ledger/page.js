// src/app/inventory/products/[id]/ledger/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import PersianDateRangePicker from "@/components/ui/PersianDateRangePicker";
import ProductLedgerPrint from "@/components/ui/ProductLedgerPrint";

export default function ProductLedgerPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    warehouseId: "",
  });
  const [warehouses, setWarehouses] = useState([]);
  const printRef = useRef();

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(
      "<html><head><title>کاردکس کالا</title></head><body>"
    );
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  useEffect(() => {
    if (params.id) {
      fetchWarehouses();
      fetchLedgerData();
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      const timeoutId = setTimeout(() => {
        fetchLedgerData();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [filters, params.id]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/inventory/warehouses");
      if (response.ok) {
        const result = await response.json();
        setWarehouses(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchLedgerData = async () => {
    try {
      setLoading(true);

      // ساخت query string
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.warehouseId)
        queryParams.append("warehouseId", filters.warehouseId);

      const url = `/api/inventory/products/${
        params.id
      }/ledger?${queryParams.toString()}`;
      const response = await fetch(url);

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error("Failed to fetch ledger data");
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "۰ ریال";
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  const getTransactionTypeColor = (type) => {
    switch (type?.effect) {
      case "increase":
        return "success";
      case "decrease":
        return "danger";
      default:
        return "secondary";
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      warehouseId: "",
    });
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری کاردکس کالا...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="alert alert-danger">
          خطا در بارگذاری اطلاعات
          <button
            onClick={fetchLedgerData}
            className="btn btn-sm btn-outline-danger me-2"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  const { product, ledgers, stats } = data;

  return (
    <div className="p-6">
      {/* هدر */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">📒 کاردکس کالا</h1>
          <div className="text-muted">
            <span className="badge bg-primary me-2">{product.code}</span>
            <span className="fw-bold">{product.name}</span>
            <span className="ms-3">واحد: {product.unit?.name}</span>
            {product.category && (
              <span className="ms-3">گروه: {product.category.name}</span>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link
            href={`/inventory/products/${params.id}`}
            className="btn btn-outline-secondary"
          >
            بازگشت به صفحه کالا
          </Link>
          <Link href="/inventory/products" className="btn btn-outline-primary">
            لیست کالاها
          </Link>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-light">
            <div className="card-body text-center">
              <div className="h6 mb-2">موجودی کل</div>
              <div className="h3 text-primary">
                {stats.currentBalance.toLocaleString("fa-IR")}
                <small className="fs-6 text-muted"> {product.unit?.name}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <div className="h6 mb-2">مجموع ورودی</div>
              <div className="h3">
                {stats.totalIn.toLocaleString("fa-IR")}
                <small className="fs-6"> {product.unit?.name}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center">
              <div className="h6 mb-2">مجموع خروجی</div>
              <div className="h3">
                {stats.totalOut.toLocaleString("fa-IR")}
                <small className="fs-6"> {product.unit?.name}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <div className="h6 mb-2">ارزش کل تراکنش‌ها</div>
              <div className="h4">{formatCurrency(stats.totalValueIn)}</div>
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
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">تا تاریخ</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">انبار</label>
              <select
                className="form-select"
                value={filters.warehouseId}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    warehouseId: e.target.value,
                  }))
                }
              >
                <option value="">همه انبارها</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                onClick={resetFilters}
                className="btn btn-outline-secondary w-100"
              >
                پاک کردن فیلترها
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* جدول کاردکس */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📋 ریز تراکنش‌ها</h5>
          <span className="badge bg-secondary">
            {data.pagination?.total || 0} تراکنش
          </span>
        </div>
        <div className="card-body p-0">
          {ledgers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              هیچ تراکنشی یافت نشد
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>تاریخ</th>
                    <th>نوع</th>
                    <th>انبار</th>
                    <th>شماره سند</th>
                    <th>توضیحات</th>
                    <th className="text-end">ورودی</th>
                    <th className="text-end">خروجی</th>
                    <th className="text-end">قیمت واحد</th>
                    <th className="text-end">مبلغ کل</th>
                    <th className="text-end">موجودی</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgers.map((ledger, index) => (
                    <tr
                      key={ledger.id}
                      className={index % 2 === 0 ? "table-light" : ""}
                    >
                      <td>
                        {formatDate(ledger.transactionDate)}
                        <div className="small text-muted">
                          {new Date(ledger.transactionDate).toLocaleTimeString(
                            "fa-IR"
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${getTransactionTypeColor(
                            ledger.document?.type
                          )}`}
                        >
                          {ledger.document?.type?.name || "نامشخص"}
                        </span>
                      </td>
                      <td>
                        {ledger.warehouse?.name}
                        {ledger.warehouse?.code && (
                          <div className="small text-muted">
                            {ledger.warehouse.code}
                          </div>
                        )}
                      </td>
                      <td>
                        {ledger.document?.documentNumber}
                        {ledger.document?.voucher && (
                          <div className="small">
                            <span className="text-muted">سند حسابداری:</span>
                            <span className="fw-bold">
                              {" "}
                              {ledger.document.voucher.voucherNumber}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {ledger.description ||
                          ledger.document?.description ||
                          "-"}
                        {ledger.person && (
                          <div className="small text-muted">
                            {ledger.person.name}
                          </div>
                        )}
                      </td>
                      <td className="text-end text-success fw-bold">
                        {ledger.quantityIn > 0 ? (
                          <>
                            {ledger.quantityIn.toLocaleString("fa-IR")}
                            <div className="small">{product.unit?.name}</div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-end text-danger fw-bold">
                        {ledger.quantityOut > 0 ? (
                          <>
                            {ledger.quantityOut.toLocaleString("fa-IR")}
                            <div className="small">{product.unit?.name}</div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-end">
                        {ledger.unitPrice > 0
                          ? formatCurrency(ledger.unitPrice)
                          : "-"}
                      </td>
                      <td className="text-end fw-bold">
                        {ledger.totalPrice > 0
                          ? formatCurrency(ledger.totalPrice)
                          : "-"}
                      </td>
                      <td className="text-end">
                        <div
                          className={`fw-bold ${
                            ledger.balanceQuantity < product.minStock
                              ? "text-danger"
                              : ""
                          }`}
                        >
                          {ledger.balanceQuantity.toLocaleString("fa-IR")}
                          <div className="small">{product.unit?.name}</div>
                        </div>
                      </td>
                      <td>
                        {ledger.document && (
                          <Link
                            href={`/inventory/documents/${ledger.document.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            مشاهده سند
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-secondary">
                  <tr>
                    <td colSpan="5" className="text-end fw-bold">
                      جمع کل:
                    </td>
                    <td className="text-end fw-bold text-success">
                      {stats.totalIn.toLocaleString("fa-IR")}
                    </td>
                    <td className="text-end fw-bold text-danger">
                      {stats.totalOut.toLocaleString("fa-IR")}
                    </td>
                    <td colSpan="2" className="text-end fw-bold">
                      {formatCurrency(stats.totalValueIn)}
                    </td>
                    <td className="text-end fw-bold">
                      {stats.currentBalance.toLocaleString("fa-IR")}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* موجودی در انبارهای مختلف */}
        <div className="card-footer">
          <h6 className="mb-3">📊 موجودی در انبارها:</h6>
          <div className="d-flex flex-wrap gap-3">
            {stats.stockByWarehouse.map((item) => (
              <div
                key={item.warehouseId}
                className="border rounded p-2 bg-light"
              >
                <span className="fw-bold">{item.warehouseName}:</span>
                <span className="ms-2">
                  {item.quantity.toLocaleString("fa-IR")} {product.unit?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* لینک‌های پایین */}
      <div className="mt-4 d-flex justify-content-between">
        <div ref={printRef} style={{ display: "none" }}>
          <ProductLedgerPrint
            product={product}
            ledgers={ledgers}
            stats={stats}
          />
        </div>

        <button onClick={handlePrint} className="btn btn-outline-secondary">
          🖨️ چاپ کاردکس
        </button>

        <div>
          <Link
            href={`/inventory/products/${params.id}/edit`}
            className="btn btn-outline-primary me-2"
          >
            ویرایش کالا
          </Link>
          <Link
            href={`/inventory/documents/create?productId=${params.id}`}
            className="btn btn-primary"
          >
            ➕ ایجاد تراکنش جدید
          </Link>
        </div>
      </div>
    </div>
  );
}
