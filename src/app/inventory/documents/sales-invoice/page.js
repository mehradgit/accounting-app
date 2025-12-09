"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SalesInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [inventoryAccount, setInventoryAccount] = useState(null); // 1-04-0003
  const [cashAccount, setCashAccount] = useState(null); // 1-01-0002-01
  const [chequeAccount, setChequeAccount] = useState(null); // 1-02-0001
  const [warehouses, setWarehouses] = useState([]); // ← این خط را اضافه کنید
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    customerDetailAccountId: "", // برای همه روش‌های پرداخت نیاز است
    description: "",
    warehouseId: "", // ← اضافه شود
    paymentMethod: "",
    bankDetailAccountId: "",
    paymentDescription: "",

    chequeData: {
      chequeNumber: "",
      amount: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      description: "",
      bankName: "",
    },

    items: [],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log("📦 بارگذاری داده‌های اولیه برای فروش...");

      const [
        productsRes,
        warehousesRes,
        customersRes,
        bankAccountsRes,
        inventoryAccountRes,
        cashAccountRes,
        chequeAccountRes,
      ] = await Promise.all([
        fetch("/api/inventory/products"),
        fetch("/api/inventory/warehouses"),
        fetch("/api/detail-accounts/for-customers"),
        fetch("/api/detail-accounts/for-bank-accounts"),
        // جستجوی حساب موجودی کالا با کد 1-04-0003
        fetch("/api/accounts?search=1-04-0003"),
        fetch("/api/detail-accounts?search=1-01-0002-01"),
        fetch("/api/accounts?code=1-02-0001"),
      ]);

      // پردازش پاسخ‌ها
      // پردازش انبارها:

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.accounts || []);
      }

      if (bankAccountsRes.ok) {
        const data = await bankAccountsRes.json();
        setBankAccounts(data.accounts || []);
      }
      if (warehousesRes.ok) {
        const data = await warehousesRes.json();
        setWarehouses(data.warehouses || []);
        console.log("✅ انبارها بارگذاری شد:", data.warehouses?.length || 0);
      }

      // پیدا کردن حساب موجودی کالا (1-04-0003)
      if (inventoryAccountRes.ok) {
        const data = await inventoryAccountRes.json();
        let foundAccount = null;

        if (Array.isArray(data)) {
          // جستجو با کد کامل یا جزئی
          foundAccount = data.find(
            (acc) =>
              acc.code === "1-04-0003" ||
              acc.code.includes("1-04-0003") ||
              (acc.subAccount && acc.subAccount.code === "1-04-0003")
          );
        } else if (data.detailAccounts) {
          foundAccount = data.detailAccounts.find(
            (acc) => acc.code === "1-04-0003" || acc.code.includes("1-04-0003")
          );
        } else if (data.detailAccount) {
          foundAccount = data.detailAccount;
        }

        setInventoryAccount(foundAccount);
        console.log(
          "حساب موجودی کالا:",
          foundAccount
            ? `${foundAccount.code} - ${foundAccount.name}`
            : "یافت نشد"
        );
      }

      // پیدا کردن حساب صندوق (1-01-0002-01)
      if (cashAccountRes.ok) {
        const data = await cashAccountRes.json();
        let foundAccount = null;

        if (Array.isArray(data)) {
          foundAccount = data.find(
            (acc) =>
              acc.code === "1-01-0002-01" || acc.code.includes("1-01-0002-01")
          );
        } else if (data.detailAccount) {
          foundAccount = data.detailAccount;
        }

        setCashAccount(foundAccount);
      }

      // پیدا کردن حساب معین چک‌های وارده (1-02-0001)
      if (chequeAccountRes.ok) {
        const data = await chequeAccountRes.json();
        if (Array.isArray(data)) {
          const chequeAcc = data.find((acc) => acc.code === "1-02-0001");
          setChequeAccount(chequeAcc || null);
        } else if (data.subAccount) {
          setChequeAccount(data.subAccount);
        }
      }
    } catch (error) {
      console.error("❌ خطا در بارگذاری داده‌ها:", error);
      alert("خطا در بارگذاری اطلاعات اولیه");
    } finally {
      setLoading(false);
    }
  };

  // متدهای مدیریت اقلام (addItem, removeItem, updateItem مشابه قبل)

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          quantity: 1,
          salePrice: 0,
          costPrice: 0,
          description: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === "productId") {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        newItems[index].salePrice = product.defaultSalePrice || 0;
        newItems[index].costPrice = product.defaultPurchasePrice || 0;
      }
    }

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const calculateTotals = () => {
    const totalQuantity = formData.items.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0
    );

    const totalSaleAmount = formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const salePrice = parseFloat(item.salePrice) || 0;
      return sum + quantity * salePrice;
    }, 0);

    const totalCostAmount = formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const costPrice = parseFloat(item.costPrice) || 0;
      return sum + quantity * costPrice;
    }, 0);

    const profit = totalSaleAmount - totalCostAmount;

    return { totalQuantity, totalSaleAmount, totalCostAmount, profit };
  };

  const validateForm = () => {
    if (formData.items.length === 0) {
      alert("حداقل یک کالا باید به فاکتور اضافه شود");
      return false;
    }

    if (!formData.invoiceNumber) {
      alert("شماره فاکتور را وارد کنید");
      return false;
    }

    if (!formData.invoiceDate) {
      alert("تاریخ فاکتور را انتخاب کنید");
      return false;
    }

    // برای همه روش‌های پرداخت، مشتری الزامی است
    if (!formData.customerDetailAccountId) {
      alert("مشتری را انتخاب کنید");
      return false;
    }
    if (!formData.warehouseId) {
      alert("انبار کالا را انتخاب کنید");
      return false;
    }
    // برای فروش حواله، حساب بانک الزامی است
    if (
      formData.paymentMethod === "transfer" &&
      !formData.bankDetailAccountId
    ) {
      alert("برای فروش حواله، حساب بانک را انتخاب کنید");
      return false;
    }

    // برای فروش چکی، اطلاعات چک الزامی است
    if (formData.paymentMethod === "cheque") {
      if (
        !formData.chequeData.chequeNumber ||
        !formData.chequeData.amount ||
        !formData.chequeData.dueDate
      ) {
        alert("لطفاً اطلاعات کامل چک را وارد کنید");
        return false;
      }
    }

    // بررسی حساب‌های سیستمی
    if (!inventoryAccount) {
      alert("حساب موجودی کالا (1-04-0003) یافت نشد");
      return false;
    }

    if (formData.paymentMethod === "cash" && !cashAccount) {
      alert("حساب صندوق (1-01-0002-01) یافت نشد");
      return false;
    }

    if (formData.paymentMethod === "cheque" && !chequeAccount) {
      alert("حساب چک‌های وارده (1-02-0001) یافت نشد");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const totals = calculateTotals();

      const payload = {
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        customerDetailAccountId: parseInt(formData.customerDetailAccountId),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        bankDetailAccountId: formData.bankDetailAccountId
          ? parseInt(formData.bankDetailAccountId)
          : null,
        paymentDescription: formData.paymentDescription,
        chequeData:
          formData.paymentMethod === "cheque" ? formData.chequeData : null,
        warehouseId: formData.warehouseId,
        inventoryAccountId: inventoryAccount.id,
        cashAccountId: cashAccount?.id || null,
        chequeAccountId: chequeAccount?.id || null,

        items: formData.items.map((item) => ({
          productId: parseInt(item.productId),
          quantity: parseFloat(item.quantity),
          salePrice: parseFloat(item.salePrice),
          costPrice: parseFloat(item.costPrice),
          description: item.description || "",
        })),

        totalQuantity: totals.totalQuantity,
        totalSaleAmount: totals.totalSaleAmount,
        totalCostAmount: totals.totalCostAmount,
        profit: totals.profit,
      };

      console.log("📤 ارسال داده‌های فروش:", payload);

      const response = await fetch("/api/inventory/documents/create-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        let successMessage = "✅ فاکتور فروش با موفقیت ثبت شد";

        if (data.voucher) {
          successMessage += `\n📄 سند حسابداری: ${data.voucher.voucherNumber}`;
          successMessage += `\n💰 جمع فروش: ${data.voucher.totalAmount.toLocaleString()} ریال`;
        }

        if (data.cheque) {
          successMessage += `\n🧾 چک دریافتنی: ${data.cheque.chequeNumber}`;
        }

        alert(successMessage);
        router.push("/inventory/documents");
        router.refresh();
      } else {
        throw new Error(data.error || data.message || "خطا در ثبت فروش");
      }
    } catch (error) {
      console.error("❌ خطا در ثبت فروش:", error);
      alert(`خطا در ثبت فروش: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const { totalSaleAmount, totalCostAmount, profit } = calculateTotals();

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">💰 فاکتور فروش کالا</h1>
          <p className="text-muted mb-0">ثبت فروش کالای تولید شده</p>
          <small className="text-info">
            <i className="bi bi-info-circle me-1"></i>
            حساب موجودی کالا:{" "}
            {inventoryAccount
              ? `${inventoryAccount.code} - ${inventoryAccount.name}`
              : "1-04-0003 (در حال بارگذاری...)"}
          </small>
        </div>
        <button
          onClick={() => router.back()}
          className="btn btn-outline-secondary"
          disabled={loading}
        >
          بازگشت
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* بخش اطلاعات فاکتور */}
        <div className="card mb-4">
          <div className="card-header bg-primary bg-opacity-10">
            <h5 className="mb-0">📋 اطلاعات فاکتور</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">
                  شماره فاکتور <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                  required
                  placeholder="F-1402-001"
                  disabled={loading}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">
                  تاریخ فاکتور <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceDate: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">
                  روش پرداخت <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                >
                  <option value="">انتخاب روش</option>
                  <option value="cash">💰 نقدی</option>
                  <option value="cheque">🧾 چکی</option>
                  <option value="transfer">🏦 حواله بانکی</option>
                  <option value="credit">📝 نسیه</option>
                </select>
              </div>

              {/* انتخاب مشتری - برای همه روش‌های پرداخت نمایش داده می‌شود */}
              <div className="col-md-3">
                <label className="form-label">
                  مشتری <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.customerDetailAccountId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerDetailAccountId: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                >
                  <option value="">انتخاب مشتری</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.code} - {customer.name}
                      {customer.person && ` (${customer.person.name})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="card mb-4">
                <div className="card-header bg-primary bg-opacity-10">
                  <h5 className="mb-0">📦 انتخاب انبار</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        انبار کالا <span className="text-danger">*</span>
                        <span className="text-muted small d-block">
                          انباری که کالا از آن کسر می‌شود
                        </span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.warehouseId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            warehouseId: e.target.value,
                          }))
                        }
                        required
                        disabled={loading}
                      >
                        <option value="">انتخاب انبار</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.code} - {wh.name}
                          </option>
                        ))}
                      </select>
                      {warehouses.length === 0 && !loading && (
                        <div className="alert alert-warning mt-2 p-2 small">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          انباری یافت نشد.
                          <a
                            href="/inventory/warehouses/create"
                            className="text-decoration-none ms-1"
                          >
                            از اینجا یک انبار جدید ایجاد کنید
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">موجودی انبار</label>
                      {formData.warehouseId && (
                        <div className="alert alert-info p-3">
                          <i className="bi bi-info-circle me-2"></i>
                          <strong>انبار انتخاب شده:</strong>{" "}
                          {warehouses.find(
                            (w) => w.id === parseInt(formData.warehouseId)
                          )?.name || "نامشخص"}
                          <div className="mt-2 small">
                            آدرس:{" "}
                            {warehouses.find(
                              (w) => w.id === parseInt(formData.warehouseId)
                            )?.address || "تعیین نشده"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">شرح فروش</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="شرح فاکتور فروش..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* بخش اطلاعات پرداخت اضافی */}
        {(formData.paymentMethod === "transfer" ||
          formData.paymentMethod === "cheque") && (
          <div className="card mb-4">
            <div className="card-header bg-info bg-opacity-10">
              <h5 className="mb-0">
                {formData.paymentMethod === "transfer"
                  ? "🏦 اطلاعات حواله"
                  : "🧾 اطلاعات چک"}
              </h5>
            </div>
            <div className="card-body">
              {formData.paymentMethod === "transfer" ? (
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">
                      حساب بانک مقصد <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.bankDetailAccountId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bankDetailAccountId: e.target.value,
                        }))
                      }
                      required
                      disabled={loading}
                    >
                      <option value="">انتخاب حساب بانک</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">شرح حواله</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.paymentDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentDescription: e.target.value,
                        }))
                      }
                      placeholder="شرح حواله بانکی..."
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">
                      شماره چک <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.chequeData.chequeNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          chequeData: {
                            ...prev.chequeData,
                            chequeNumber: e.target.value,
                          },
                        }))
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">
                      مبلغ چک <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.chequeData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          chequeData: {
                            ...prev.chequeData,
                            amount: e.target.value,
                          },
                        }))
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">
                      تاریخ سررسید <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.chequeData.dueDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          chequeData: {
                            ...prev.chequeData,
                            dueDate: e.target.value,
                          },
                        }))
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">بانک صادرکننده</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.chequeData.bankName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          chequeData: {
                            ...prev.chequeData,
                            bankName: e.target.value,
                          },
                        }))
                      }
                      placeholder="نام بانک"
                      disabled={loading}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">شرح چک</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.chequeData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          chequeData: {
                            ...prev.chequeData,
                            description: e.target.value,
                          },
                        }))
                      }
                      placeholder="شرح چک..."
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* بخش کالاهای فروخته شده */}
        <div className="card mb-4">
          <div className="card-header bg-success bg-opacity-10">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📦 کالاهای فروخته شده</h5>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-sm btn-success"
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-1"></i>
                افزودن کالا
              </button>
            </div>
          </div>

          <div className="card-body">
            {formData.items.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-cart display-4 d-block mb-3"></i>
                هنوز کالایی به فاکتور اضافه نشده است
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ردیف</th>
                      <th>کالا</th>
                      <th>تعداد</th>
                      <th>قیمت فروش (ریال)</th>
                      <th>قیمت تمام شده (ریال)</th>
                      <th>جمع فروش (ریال)</th>
                      <th>توضیحات</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item.productId}
                            onChange={(e) =>
                              updateItem(index, "productId", e.target.value)
                            }
                            required
                            disabled={loading}
                          >
                            <option value="">انتخاب کالا</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.code} - {product.name}
                                {product.defaultSalePrice &&
                                  ` - ${product.defaultSalePrice.toLocaleString()} ریال`}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", e.target.value)
                            }
                            min="0.001"
                            step="0.001"
                            style={{ width: "100px" }}
                            required
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={item.salePrice}
                            onChange={(e) =>
                              updateItem(index, "salePrice", e.target.value)
                            }
                            min="0"
                            style={{ width: "150px" }}
                            required
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={item.costPrice}
                            onChange={(e) =>
                              updateItem(index, "costPrice", e.target.value)
                            }
                            min="0"
                            style={{ width: "150px" }}
                            required
                            disabled={loading}
                          />
                        </td>
                        <td className="fw-bold">
                          {(item.quantity * item.salePrice).toLocaleString()}{" "}
                          ریال
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            placeholder="توضیحات..."
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeItem(index)}
                            disabled={loading}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" className="text-end fw-bold">
                        جمع کل:
                      </td>
                      <td className="fw-bold">
                        {calculateTotals().totalQuantity}
                      </td>
                      <td></td>
                      <td className="fw-bold">
                        {totalCostAmount.toLocaleString()}
                      </td>
                      <td className="fw-bold text-success">
                        {totalSaleAmount.toLocaleString()}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr className="table-primary">
                      <td colSpan="5" className="text-end fw-bold fs-5">
                        سود ناخالص:
                      </td>
                      <td className="fw-bold fs-5 text-primary">
                        {profit.toLocaleString()} ریال
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* خلاصه و ثبت نهایی */}
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
                    <span className="fw-bold">{formData.items.length}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>جمع تعداد:</span>
                    <span className="fw-bold">
                      {calculateTotals().totalQuantity} واحد
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>بهای تمام شده:</span>
                    <span className="fw-bold text-danger">
                      {totalCostAmount.toLocaleString()} ریال
                    </span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fs-5">فروش ناخالص:</span>
                    <span className="fs-4 fw-bold text-success">
                      {totalSaleAmount.toLocaleString()} ریال
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="fs-6">سود ناخالص:</span>
                    <span className="fs-5 fw-bold text-primary">
                      {profit.toLocaleString()} ریال
                    </span>
                  </div>
                </div>

                <div className="alert alert-info mt-3">
                  <h6 className="alert-heading">📝 ساختار سند حسابداری:</h6>
                  <div className="small">
                    {formData.paymentMethod === "cash" ? (
                      <>
                        <div>۱. بستانکار: موجودی کالا (1-04-0003)</div>
                        <div> بدهکار: حساب مشتری</div>
                        <div>۲. بستانکار: حساب مشتری</div>
                        <div> بدهکار: صندوق (1-01-0002-01)</div>
                      </>
                    ) : formData.paymentMethod === "cheque" ? (
                      <>
                        <div>۱. بدهکار: حساب مشتری</div>
                        <div> بستانکار: موجودی کالا (1-04-0003)</div>
                        <div>۲. بدهکار: چک‌های وارده (1-02-0001)</div>
                        <div> بستانکار: حساب مشتری</div>
                      </>
                    ) : formData.paymentMethod === "transfer" ? (
                      <>
                        <div>۱. بستانکار: موجودی کالا (1-04-0003)</div>
                        <div> بدهکار: حساب مشتری</div>
                        <div>۲. بستانکار: حساب مشتری</div>
                        <div> بدهکار: حساب بانک</div>
                      </>
                    ) : formData.paymentMethod === "credit" ? (
                      <>
                        <div>۱. بستانکار: موجودی کالا (1-04-0003)</div>
                        <div> بدهکار: حساب مشتری (نسیه)</div>
                      </>
                    ) : (
                      <span className="text-muted">
                        روش پرداخت را انتخاب کنید
                      </span>
                    )}
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
                  <p className="mb-2">با ثبت این فاکتور:</p>
                  <ul className="mb-0">
                    <li>✅ موجودی کالا کاهش می‌یابد</li>
                    <li>📄 سند حسابداری ایجاد می‌شود</li>
                    {formData.paymentMethod === "cheque" && (
                      <li>🧾 چک دریافتنی ثبت می‌شود</li>
                    )}
                  </ul>
                </div>

                <div className="d-flex justify-content-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-outline-secondary"
                    disabled={loading}
                  >
                    انصراف
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={
                      loading ||
                      formData.items.length === 0 ||
                      !formData.paymentMethod ||
                      !formData.customerDetailAccountId
                    }
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        در حال ثبت...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        ثبت فاکتور فروش
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
