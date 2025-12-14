"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductSearchSelect from "@/components/ProductSearchSelect";
import PersianDatePicker from "@/components/ui/PersianDatePicker";

/**
 * Purchase Materials Page (final)
 * - ProductSearchSelect (server-side search, portal) for product selection
 * - Quantity default: empty string
 * - Unit price: text input with live formatting (thousand separators + Persian digits in display)
 * - Keyboard: ArrowUp/ArrowDown within ProductSearchSelect; Enter navigation between fields;
 *   when on description of last row + Enter => add new row and focus product input
 */

export default function PurchaseMaterialsPage() {
  const router = useRouter();

  // loading and lookups
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);

  // form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    supplierDetailAccountId: "",
    description: "",
    paymentMethod: "", // cash, transfer, cheque, credit
    expenseDetailAccountId: "",
    bankDetailAccountId: "",
    paymentDescription: "",
    chequeData: {
      chequeNumber: "",
      amount: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      description: "",
    },
    // materials: quantity & unitPrice are strings (normalized for calculations)
    materials: [],
  });

  const tableRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        warehousesRes,
        suppliersRes,
        bankAccountsRes,
        expenseAccountsRes,
      ] = await Promise.all([
        fetch("/api/inventory/warehouses"),
        fetch("/api/detail-accounts/for-trade-creditors"),
        fetch("/api/detail-accounts/for-bank-accounts"),
        fetch("/api/detail-accounts/for-expense-accounts"),
      ]);

      if (warehousesRes.ok) {
        const data = await warehousesRes.json();
        setWarehouses(data.warehouses || []);
      }
      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        setSuppliers(data.accounts || []);
      }
      if (bankAccountsRes.ok) {
        const data = await bankAccountsRes.json();
        setBankAccounts(data.accounts || []);
      }
      if (expenseAccountsRes.ok) {
        const data = await expenseAccountsRes.json();
        setExpenseAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      alert("خطا در بارگذاری اطلاعات اولیه");
    } finally {
      setLoading(false);
    }
  };

  // --- helpers for Persian formatting and normalization ---
  const PERSIAN_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  const PERSIAN_TO_LATIN = { "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9" };

  const toPersianDigits = (str) =>
    String(str).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);

  const formatNumberToPersian = (value, maxDecimals = 3) => {
    if (value === "" || value === null || value === undefined) return "";
    const num = Number(value) || 0;
    const isFloat = Math.abs(num - Math.round(num)) > 1e-12;
    let str;
    if (isFloat) str = num.toFixed(maxDecimals).replace(/\.?0+$/, "");
    else str = Math.round(num).toString();
    const parts = str.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return toPersianDigits(parts.join("."));
  };

  const normalizeNumberString = (s) => {
    if (s === "" || s === null || s === undefined) return "";
    let t = String(s);
    // replace Persian digits
    t = t.replace(/[۰-۹]/g, (d) => PERSIAN_TO_LATIN[d] || d);
    // remove thousands separators (Arabic and latin)
    t = t.replace(/[٬,]/g, "");
    // keep digits and decimal point
    t = t.replace(/[^0-9.]/g, "");
    // keep only first decimal point
    const parts = t.split(".");
    if (parts.length > 1) {
      t = parts.shift() + "." + parts.join("");
    }
    return t;
  };

  // --- materials management ---
  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { productId: "", quantity: "", unitPrice: "", description: "" },
      ],
    }));
    // focus will be handled by keyboard handlers or selection logic
  };

  const removeMaterial = (index) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const updateMaterial = (index, field, value) => {
    setFormData((prev) => {
      const newMaterials = [...prev.materials];
      newMaterials[index] = { ...newMaterials[index], [field]: value };
      return { ...prev, materials: newMaterials };
    });
  };

  // when a product is selected, optionally prefill unitPrice (raw string)
  const handleProductSelect = async (index, productId) => {
    if (!productId) {
      updateMaterial(index, "productId", "");
      return;
    }
    try {
      const res = await fetch(`/api/inventory/products/${productId}`);
      if (res.ok) {
        const p = await res.json();
        if (p?.defaultPurchasePrice > 0) {
          // store raw numeric string
          updateMaterial(index, "unitPrice", String(p.defaultPurchasePrice));
        }
        updateMaterial(index, "productId", String(productId));
      } else {
        updateMaterial(index, "productId", String(productId));
      }
    } catch (err) {
      console.error("Error fetching product detail:", err);
      updateMaterial(index, "productId", String(productId));
    }
  };

  // unit price input handler (store normalized numeric string)
  const handleUnitPriceChange = (index, rawValue) => {
    const normalized = normalizeNumberString(rawValue);
    updateMaterial(index, "unitPrice", normalized);
  };

  // calculate totals using numeric parseFloat
  const calculateTotal = () =>
    formData.materials.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      return sum + q * p;
    }, 0);

  const totalQuantityValue = formData.materials.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0),
    0
  );

  // --- keyboard navigation: Enter moves to next focusable; at last description => add row ---
  const focusProductInput = (rowIndex) => {
    const el = document.querySelector(`input[data-row="${rowIndex}"][data-field="product-input"]`);
    if (el) el.focus();
  };

  const handleEnterNavigation = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const tableEl = tableRef.current;
    if (!tableEl) return;

    const focusable = tableEl.querySelectorAll(
      'input:not([type="button"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    const arr = Array.from(focusable);
    const active = document.activeElement;
    const idx = arr.indexOf(active);
    if (idx === -1) return;

    // determine if current is description of last row
    const field = active.getAttribute("data-field");
    const rowAttr = active.getAttribute("data-row");
    const row = rowAttr ? Number(rowAttr) : -1;
    const lastRowIndex = formData.materials.length - 1;

    if (field === "description" && row === lastRowIndex) {
      // add new row then focus its product input
      addMaterial();
      setTimeout(() => {
        focusProductInput(lastRowIndex + 1);
      }, 50);
      return;
    }

    // otherwise focus next focusable element
    const next = arr[idx + 1];
    if (next) {
      next.focus();
    } else {
      // nothing next
    }
  };

  // --- submit form (validation + payload) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.materials.length === 0) {
      alert("حداقل یک ماده اولیه باید اضافه شود");
      return;
    }

    for (let i = 0; i < formData.materials.length; i++) {
      if (!formData.materials[i].productId) {
        alert(`ردیف ${i + 1}: کالا انتخاب نشده است`);
        return;
      }
      // optional: require quantity
      if (!formData.materials[i].quantity || parseFloat(formData.materials[i].quantity) <= 0) {
        alert(`ردیف ${i + 1}: مقدار تعداد را وارد کنید`);
        return;
      }
    }

    if (!formData.warehouseId) {
      alert("انبار مقصد را انتخاب کنید");
      return;
    }

    setLoading(true);

    try {
      // compute totals
      const totalQuantity = formData.materials.reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);
      const totalAmount = calculateTotal();

      // find personId if supplier selected
      let personId = null;
      if (formData.supplierDetailAccountId) {
        const sel = suppliers.find((s) => String(s.id) === String(formData.supplierDetailAccountId));
        if (sel?.person) personId = sel.person.id;
      }

      // transaction type lookup (optional)
      let transactionTypeId = 1;
      try {
        const ttRes = await fetch("/api/inventory/transaction-types?code=PURCHASE");
        if (ttRes.ok) {
          const tt = await ttRes.json();
          const purchaseType = Array.isArray(tt)
            ? tt.find((t) => t.code === "PURCHASE" || (t.name || "").includes("خرید"))
            : (tt.types || []).find((t) => t.code === "PURCHASE" || (t.name || "").includes("خرید"));
          if (purchaseType) transactionTypeId = purchaseType.id;
        }
      } catch (err) {
        console.warn("Transaction type fetch failed, using default", err);
      }

      const payload = {
        typeId: transactionTypeId,
        warehouseId: parseInt(formData.warehouseId),
        personId,
        documentDate: formData.invoiceDate,
        referenceNumber: formData.invoiceNumber || null,
        description: formData.description || null,
        items: formData.materials.map((m) => ({
          productId: parseInt(m.productId),
          quantity: parseFloat(m.quantity) || 0,
          unitPrice: parseFloat(m.unitPrice) || 0,
          description: m.description || "",
        })),
        paymentMethod: formData.paymentMethod || null,
        bankDetailAccountId: formData.bankDetailAccountId ? parseInt(formData.bankDetailAccountId) : null,
        expenseDetailAccountId: formData.expenseDetailAccountId ? parseInt(formData.expenseDetailAccountId) : null,
        supplierDetailAccountId: formData.supplierDetailAccountId ? parseInt(formData.supplierDetailAccountId) : null,
        paymentDescription: formData.paymentDescription || null,
        chequeData: formData.paymentMethod === "cheque" ? formData.chequeData : null,
        totalQuantity,
        totalAmount,
      };

      const res = await fetch("/api/inventory/documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        let msg = "✅ خرید مواد اولیه با موفقیت ثبت شد";
        if (data.voucher) msg += `\n📄 سند: ${data.voucher.voucherNumber}`;
        if (data.cheque) msg += `\n🧾 چک: ${data.cheque.chequeNumber}`;
        alert(msg);
        router.push("/inventory/documents");
        router.refresh();
      } else {
        throw new Error(data.error || data.message || "خطا در ثبت");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(`خطا در ثبت خرید: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // render
  return (
    <div className="container-fluid py-4">
      {/* header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">🛒 خرید مواد اولیه</h1>
          <p className="text-muted mb-0">ثبت خرید مواد اولیه و ایجاد سند حسابداری</p>
        </div>
        <div>
          <button onClick={() => router.back()} className="btn btn-outline-secondary" disabled={loading}>
            بازگشت
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Purchase info */}
        <div className="card mb-4">
          <div className="card-header bg-primary bg-opacity-10">
            <h5 className="mb-0">📋 اطلاعات خرید</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">شماره فاکتور</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, invoiceNumber: e.target.value }))}
                  disabled={loading}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">تاریخ فاکتور</label>
                <PersianDatePicker
                  selected={formData.invoiceDate}
                  onChange={(date) => setFormData((p) => ({ ...p, invoiceDate: date }))}
                  placeholder="تاریخ فاکتور"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">انبار مقصد</label>
                <select
                  className="form-select"
                  value={formData.warehouseId}
                  onChange={(e) => setFormData((p) => ({ ...p, warehouseId: e.target.value }))}
                  disabled={loading}
                  required
                >
                  <option value="">{loading ? "در حال بارگذاری..." : "انتخاب انبار"}</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">تامین‌کننده</label>
                <select
                  className="form-select"
                  value={formData.supplierDetailAccountId}
                  onChange={(e) => setFormData((p) => ({ ...p, supplierDetailAccountId: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">انتخاب تامین‌کننده (اختیاری)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} {s.person && `(${s.person.name})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">شرح خرید</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card mb-4">
          <div className="card-header bg-info bg-opacity-10">
            <h5 className="mb-0">💰 اطلاعات پرداخت</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">روش پرداخت</label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { id: "cash", label: "💰 پرداخت نقدی" },
                    { id: "transfer", label: "🏦 پرداخت حواله" },
                    { id: "cheque", label: "🧾 پرداخت چکی" },
                    { id: "credit", label: "📝 خرید نسیه" },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      className={`btn btn-sm ${formData.paymentMethod === m.id ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setFormData((p) => ({ ...p, paymentMethod: p.paymentMethod === m.id ? "" : m.id }))}
                      disabled={loading}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.paymentMethod && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">حساب هزینه/خرید</label>
                    <select
                      className="form-select"
                      value={formData.expenseDetailAccountId}
                      onChange={(e) => setFormData((p) => ({ ...p, expenseDetailAccountId: e.target.value }))}
                      disabled={loading}
                      required
                    >
                      <option value="">انتخاب حساب</option>
                      {expenseAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(formData.paymentMethod === "transfer" || formData.paymentMethod === "cheque") && (
                    <div className="col-md-6">
                      <label className="form-label">حساب بانک</label>
                      <select
                        className="form-select"
                        value={formData.bankDetailAccountId}
                        onChange={(e) => setFormData((p) => ({ ...p, bankDetailAccountId: e.target.value }))}
                        disabled={loading}
                        required
                      >
                        <option value="">انتخاب حساب بانک</option>
                        {bankAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label">شرح پرداخت</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.paymentDescription}
                      onChange={(e) => setFormData((p) => ({ ...p, paymentDescription: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {formData.paymentMethod === "cheque" && (
                <div className="col-12 border rounded p-3">
                  <h6>🧾 اطلاعات چک</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">شماره چک</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.chequeData.chequeNumber}
                        onChange={(e) => setFormData((p) => ({ ...p, chequeData: { ...p.chequeData, chequeNumber: e.target.value } }))}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">مبلغ چک</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.chequeData.amount}
                        onChange={(e) => setFormData((p) => ({ ...p, chequeData: { ...p.chequeData, amount: e.target.value } }))}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">تاریخ سررسید</label>
                      <PersianDatePicker
                        selected={formData.chequeData.dueDate}
                        onChange={(date) => setFormData((p) => ({ ...p, chequeData: { ...p.chequeData, dueDate: date } }))}
                        placeholder="تاریخ سررسید چک"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">شرح چک</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.chequeData.description}
                        onChange={(e) => setFormData((p) => ({ ...p, chequeData: { ...p.chequeData, description: e.target.value } }))}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Materials */}
        <div className="card mb-4">
          <div className="card-header bg-success bg-opacity-10">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📦 مواد اولیه خریداری شده</h5>
              <button type="button" onClick={addMaterial} className="btn btn-sm btn-success" disabled={loading}>
                افزودن ماده اولیه
              </button>
            </div>
          </div>

          <div className="card-body">
            {formData.materials.length === 0 ? (
              <div className="text-center py-4 text-muted">هنوز ماده اولیه‌ای اضافه نشده است</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover" ref={tableRef}>
                  <thead>
                    <tr>
                      <th>ردیف</th>
                      <th>کالا</th>
                      <th>تعداد</th>
                      <th>قیمت واحد (ریال)</th>
                      <th>جمع (ریال)</th>
                      <th>توضیحات</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {formData.materials.map((material, index) => (
                      <tr key={index} data-row={index}>
                        <td>{formatNumberToPersian(index + 1)}</td>
                        <td style={{ minWidth: 260 }}>
                          <ProductSearchSelect
                            value={material.productId}
                            onChange={(productId) => handleProductSelect(index, productId)}
                            placeholder="جستجو یا انتخاب کالا..."
                            disabled={loading}
                            inputProps={{
                              "data-row": String(index),
                              "data-field": "product-input",
                              // parent navigation: when Enter and dropdown closed, move to quantity
                              onKeyDown: (e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const next = document.querySelector(`input[data-row="${index}"][data-field="quantity"]`);
                                  if (next) next.focus();
                                }
                              },
                            }}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={material.quantity}
                            onChange={(e) => updateMaterial(index, "quantity", e.target.value)}
                            min="0"
                            step="0.001"
                            style={{ width: "100px" }}
                            data-row={String(index)}
                            data-field="quantity"
                            disabled={loading}
                            onKeyDown={handleEnterNavigation}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm text-end"
                            value={material.unitPrice ? formatNumberToPersian(material.unitPrice, 3) : ""}
                            onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                            inputMode="numeric"
                            style={{ width: "150px" }}
                            data-row={String(index)}
                            data-field="unitPrice"
                            disabled={loading}
                            onKeyDown={handleEnterNavigation}
                          />
                        </td>

                        <td className="fw-bold">
                          {formatNumberToPersian(
                            (parseFloat(material.quantity) || 0) * (parseFloat(material.unitPrice) || 0)
                          )}{" "}
                          ریال
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={material.description}
                            onChange={(e) => updateMaterial(index, "description", e.target.value)}
                            placeholder="توضیحات..."
                            data-row={String(index)}
                            data-field="description"
                            disabled={loading}
                            onKeyDown={handleEnterNavigation}
                          />
                        </td>

                        <td>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeMaterial(index)} disabled={loading}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td colSpan="4" className="text-end fw-bold fs-5">جمع کل:</td>
                      <td className="fw-bold fs-5 text-success">{formatNumberToPersian(calculateTotal())} ریال</td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Summary & submit */}
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card border-success">
              <div className="card-header bg-success bg-opacity-10">
                <h6 className="mb-0">💰 خلاصه مالی</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>تعداد اقلام:</span>
                    <span className="fw-bold">{formatNumberToPersian(formData.materials.length)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>جمع تعداد:</span>
                    <span className="fw-bold">{formatNumberToPersian(totalQuantityValue)} واحد</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="fs-5">مبلغ کل خرید:</span>
                    <span className="fs-4 fw-bold text-success">{formatNumberToPersian(calculateTotal())} ریال</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">✅ تایید و ثبت نهایی</h6>
              </div>
              <div className="card-body">
                <div className="alert alert-warning">
                  <h6 className="alert-heading">⚠️ توجه:</h6>
                  <p className="mb-2">با ثبت این فرم:</p>
                  <ul className="mb-0">
                    <li>✅ موجودی مواد اولیه در انبار افزایش می‌یابد</li>
                    <li>📄 سند حسابداری متناسب با روش پرداخت ایجاد می‌شود</li>
                    {formData.paymentMethod === "cheque" && <li>🧾 چک پرداختی در سیستم چک‌ها ثبت می‌شود</li>}
                    {formData.paymentMethod === "credit" && <li>📝 بدهی به تامین‌کننده ثبت می‌شود</li>}
                  </ul>
                </div>

                <div className="d-flex justify-content-end gap-3">
                  <button type="button" onClick={() => router.back()} className="btn btn-outline-secondary" disabled={loading}>
                    انصراف
                  </button>

                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading || formData.materials.length === 0}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        در حال ثبت...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        ثبت خرید مواد اولیه
                        {formData.paymentMethod && " و سند حسابداری"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}