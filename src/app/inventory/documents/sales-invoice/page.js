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
  const [warehouses, setWarehouses] = useState([]);
  
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    customerDetailAccountId: "",
    description: "",
    warehouseId: "",
    
    // پرداخت ترکیبی
    paymentDistribution: {
      totalAmount: 0,
      cash: {
        enabled: false,
        amount: 0,
        cashAccountId: null
      },
      cheque: {
        enabled: false,
        amount: 0,
        cheques: [],
        chequeAccountId: null
      },
      transfer: {
        enabled: false,
        amount: 0,
        bankDetailAccountId: null,
        description: ""
      },
      credit: {
        enabled: true,
        amount: 0
      }
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
        fetch("/api/accounts?search=1-04-0003"),
        fetch("/api/detail-accounts?search=1-01-0002-01"),
        fetch("/api/accounts?code=1-02-0001"),
      ]);

      // پردازش پاسخ‌ها
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      if (warehousesRes.ok) {
        const data = await warehousesRes.json();
        setWarehouses(data.warehouses || []);
        console.log("✅ انبارها بارگذاری شد:", data.warehouses?.length || 0);
      }

      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.accounts || []);
      }

      if (bankAccountsRes.ok) {
        const data = await bankAccountsRes.json();
        setBankAccounts(data.accounts || []);
      }

      // پیدا کردن حساب موجودی کالا (1-04-0003)
      if (inventoryAccountRes.ok) {
        const data = await inventoryAccountRes.json();
        let foundAccount = null;

        if (Array.isArray(data)) {
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
        if (foundAccount) {
          setFormData(prev => ({
            ...prev,
            paymentDistribution: {
              ...prev.paymentDistribution,
              cash: {
                ...prev.paymentDistribution.cash,
                cashAccountId: foundAccount.id
              }
            }
          }));
        }
      }

      // پیدا کردن حساب معین چک‌های وارده (1-02-0001)
      if (chequeAccountRes.ok) {
        const data = await chequeAccountRes.json();
        if (Array.isArray(data)) {
          const chequeAcc = data.find((acc) => acc.code === "1-02-0001");
          setChequeAccount(chequeAcc || null);
          if (chequeAcc) {
            setFormData(prev => ({
              ...prev,
              paymentDistribution: {
                ...prev.paymentDistribution,
                cheque: {
                  ...prev.paymentDistribution.cheque,
                  chequeAccountId: chequeAcc.id
                }
              }
            }));
          }
        } else if (data.subAccount) {
          setChequeAccount(data.subAccount);
          setFormData(prev => ({
            ...prev,
            paymentDistribution: {
              ...prev.paymentDistribution,
              cheque: {
                ...prev.paymentDistribution.cheque,
                chequeAccountId: data.subAccount.id
              }
            }
          }));
        }
      }
    } catch (error) {
      console.error("❌ خطا در بارگذاری داده‌ها:", error);
      alert("خطا در بارگذاری اطلاعات اولیه");
    } finally {
      setLoading(false);
    }
  };

  // محاسبات مبلغ کل
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

  // مدیریت اقلام فاکتور
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

  // مدیریت پرداخت ترکیبی
  const calculateCreditAmount = () => {
    const totals = calculateTotals();
    const { cash, cheque, transfer } = formData.paymentDistribution;
    const paidAmount = 
      (cash.enabled ? parseFloat(cash.amount) || 0 : 0) +
      (cheque.enabled ? parseFloat(cheque.amount) || 0 : 0) +
      (transfer.enabled ? parseFloat(transfer.amount) || 0 : 0);
    
    return Math.max(0, totals.totalSaleAmount - paidAmount);
  };

  const validatePaymentTotal = () => {
    const totals = calculateTotals();
    const { cash, cheque, transfer } = formData.paymentDistribution;
    const paidAmount = 
      (cash.enabled ? parseFloat(cash.amount) || 0 : 0) +
      (cheque.enabled ? parseFloat(cheque.amount) || 0 : 0) +
      (transfer.enabled ? parseFloat(transfer.amount) || 0 : 0);
    
    return paidAmount <= totals.totalSaleAmount + 0.01;
  };

  // مدیریت چک‌ها
  const addCheque = () => {
    setFormData(prev => ({
      ...prev,
      paymentDistribution: {
        ...prev.paymentDistribution,
        cheque: {
          ...prev.paymentDistribution.cheque,
          cheques: [
            ...prev.paymentDistribution.cheque.cheques,
            {
              id: Date.now(),
              chequeNumber: "",
              amount: "",
              issueDate: new Date().toISOString().split("T")[0],
              dueDate: "",
              bankName: "",
              description: ""
            }
          ]
        }
      }
    }));
  };

  const updateCheque = (index, field, value) => {
    const newCheques = [...formData.paymentDistribution.cheque.cheques];
    newCheques[index][field] = value;
    
    // محاسبه جمع چک‌ها
    const chequesTotal = newCheques.reduce(
      (sum, cheque) => sum + (parseFloat(cheque.amount) || 0), 
      0
    );
    
    setFormData(prev => ({
      ...prev,
      paymentDistribution: {
        ...prev.paymentDistribution,
        cheque: {
          ...prev.paymentDistribution.cheque,
          cheques: newCheques,
          amount: chequesTotal
        }
      }
    }));
  };

  const removeCheque = (index) => {
    const newCheques = formData.paymentDistribution.cheque.cheques.filter((_, i) => i !== index);
    const chequesTotal = newCheques.reduce(
      (sum, cheque) => sum + (parseFloat(cheque.amount) || 0), 
      0
    );
    
    setFormData(prev => ({
      ...prev,
      paymentDistribution: {
        ...prev.paymentDistribution,
        cheque: {
          ...prev.paymentDistribution.cheque,
          cheques: newCheques,
          amount: chequesTotal
        }
      }
    }));
  };

  // به‌روزرسانی خودکار credit amount
  useEffect(() => {
    const totals = calculateTotals();
    const creditAmount = calculateCreditAmount();
    
    setFormData(prev => ({
      ...prev,
      paymentDistribution: {
        ...prev.paymentDistribution,
        credit: {
          ...prev.paymentDistribution.credit,
          amount: creditAmount
        },
        totalAmount: totals.totalSaleAmount
      }
    }));
  }, [
    formData.paymentDistribution.cash,
    formData.paymentDistribution.cheque,
    formData.paymentDistribution.transfer,
    formData.items
  ]);

  // اعتبارسنجی فرم
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

    if (!formData.customerDetailAccountId) {
      alert("مشتری را انتخاب کنید");
      return false;
    }

    if (!formData.warehouseId) {
      alert("انبار کالا را انتخاب کنید");
      return false;
    }

    // اعتبارسنجی پرداخت ترکیبی
    const { cash, cheque, transfer } = formData.paymentDistribution;
    
    // حداقل یک روش پرداخت باید فعال باشد
    if (!cash.enabled && !cheque.enabled && !transfer.enabled) {
      alert("حداقل یک روش پرداخت را انتخاب کنید");
      return false;
    }
    
    // برای روش‌های فعال، حساب‌ها باید مشخص باشد
    if (cash.enabled && !cash.cashAccountId) {
      alert("برای پرداخت نقدی، حساب صندوق را انتخاب کنید");
      return false;
    }
    
    if (cheque.enabled) {
      if (!cheque.chequeAccountId) {
        alert("برای پرداخت چکی، حساب چک‌های وارده را انتخاب کنید");
        return false;
      }
      
      if (cheque.cheques.length === 0) {
        alert("برای پرداخت چکی، حداقل یک چک اضافه کنید");
        return false;
      }
      
      // اعتبارسنجی چک‌ها
      for (const ch of cheque.cheques) {
        if (!ch.chequeNumber || !ch.amount || !ch.dueDate) {
          alert("لطفاً اطلاعات کامل همه چک‌ها را وارد کنید");
          return false;
        }
      }
    }
    
    if (transfer.enabled && !transfer.bankDetailAccountId) {
      alert("برای پرداخت حواله، حساب بانک را انتخاب کنید");
      return false;
    }

    if (!validatePaymentTotal()) {
      alert("مجموع پرداخت‌ها نمی‌تواند بیشتر از مبلغ فاکتور باشد");
      return false;
    }

    // بررسی حساب‌های سیستمی
    if (!inventoryAccount) {
      alert("حساب موجودی کالا (1-04-0003) یافت نشد");
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
      const { cash, cheque, transfer, credit } = formData.paymentDistribution;

      const payload = {
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        customerDetailAccountId: parseInt(formData.customerDetailAccountId),
        description: formData.description,
        warehouseId: formData.warehouseId,
        inventoryAccountId: inventoryAccount.id,
        
        // داده‌های پرداخت ترکیبی
        paymentDistribution: {
          totalAmount: totals.totalSaleAmount,
          cash: cash.enabled ? {
            amount: cash.amount,
            cashAccountId: cash.cashAccountId
          } : null,
          cheque: cheque.enabled ? {
            amount: cheque.amount,
            cheques: cheque.cheques.map(ch => ({
              chequeNumber: ch.chequeNumber,
              amount: parseFloat(ch.amount),
              issueDate: ch.issueDate,
              dueDate: ch.dueDate,
              bankName: ch.bankName,
              description: ch.description
            })),
            chequeAccountId: cheque.chequeAccountId
          } : null,
          transfer: transfer.enabled ? {
            amount: transfer.amount,
            bankDetailAccountId: transfer.bankDetailAccountId,
            description: transfer.description
          } : null,
          credit: {
            amount: credit.amount
          }
        },

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

      console.log("📤 ارسال داده‌های فروش ترکیبی:", payload);

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

        // نمایش خلاصه پرداخت‌ها
        successMessage += `\n\n📊 خلاصه پرداخت‌ها:`;
        if (cash.enabled && cash.amount > 0) {
          successMessage += `\n💰 نقدی: ${cash.amount.toLocaleString()} ریال`;
        }
        if (cheque.enabled && cheque.amount > 0) {
          successMessage += `\n🧾 چک: ${cheque.amount.toLocaleString()} ریال (${cheque.cheques.length} فقره)`;
        }
        if (transfer.enabled && transfer.amount > 0) {
          successMessage += `\n🏦 حواله: ${transfer.amount.toLocaleString()} ریال`;
        }
        if (credit.amount > 0) {
          successMessage += `\n📝 نسیه: ${credit.amount.toLocaleString()} ریال`;
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
  const creditAmount = calculateCreditAmount();

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">💰 فاکتور فروش کالا (پرداخت ترکیبی)</h1>
          <p className="text-muted mb-0">ثبت فروش کالا با امکان تقسیم پرداخت بین چند روش</p>
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

              <div className="col-md-3">
                <label className="form-label">
                  مبلغ کل فاکتور
                </label>
                <div className="form-control bg-light">
                  <div className="fs-5 fw-bold text-primary text-center">
                    {totalSaleAmount.toLocaleString()} ریال
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

        {/* بخش انتخاب انبار */}
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

        {/* بخش توزیع پرداخت ترکیبی */}
        <div className="card mb-4">
          <div className="card-header bg-info bg-opacity-10">
            <h5 className="mb-0">💰 توزیع پرداخت (ترکیبی)</h5>
            <small className="text-muted">می‌توانید مبلغ فاکتور را بین چند روش پرداخت تقسیم کنید</small>
          </div>
          
          <div className="card-body">
            {/* نمایش مبلغ کل */}
            <div className="alert alert-primary mb-4">
              <div className="row">
                <div className="col-md-6">
                  <strong>مبلغ کل فاکتور:</strong>
                  <div className="fs-4 fw-bold text-primary">
                    {totalSaleAmount.toLocaleString()} ریال
                  </div>
                </div>
                <div className="col-md-6">
                  <strong>باقیمانده (نسیه):</strong>
                  <div className={`fs-4 fw-bold ${creditAmount > 0 ? 'text-warning' : 'text-success'}`}>
                    {creditAmount.toLocaleString()} ریال
                  </div>
                </div>
              </div>
            </div>
            
            {/* اعتبارسنجی */}
            {!validatePaymentTotal() && (
              <div className="alert alert-danger mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                مجموع پرداخت‌ها نمی‌تواند بیشتر از مبلغ فاکتور باشد!
              </div>
            )}
            
            <div className="row g-3">
              {/* نقدی */}
              <div className="col-md-6">
                <div className="card h-100 border-success">
                  <div className="card-header bg-success bg-opacity-10">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.paymentDistribution.cash.enabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paymentDistribution: {
                            ...prev.paymentDistribution,
                            cash: {
                              ...prev.paymentDistribution.cash,
                              enabled: e.target.checked
                            }
                          }
                        }))}
                        disabled={loading}
                      />
                      <label className="form-check-label fw-bold">
                        💰 نقدی
                      </label>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    {formData.paymentDistribution.cash.enabled && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">مبلغ نقدی (ریال)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.paymentDistribution.cash.amount || 0}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentDistribution: {
                                ...prev.paymentDistribution,
                                cash: {
                                  ...prev.paymentDistribution.cash,
                                  amount: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            min="0"
                            max={totalSaleAmount}
                            disabled={loading}
                          />
                          <small className="text-muted">
                            حداکثر: {totalSaleAmount.toLocaleString()} ریال
                          </small>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">حساب صندوق</label>
                          <select
                            className="form-select"
                            value={formData.paymentDistribution.cash.cashAccountId || ""}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentDistribution: {
                                ...prev.paymentDistribution,
                                cash: {
                                  ...prev.paymentDistribution.cash,
                                  cashAccountId: e.target.value ? parseInt(e.target.value) : null
                                }
                              }
                            }))}
                            disabled={loading}
                          >
                            <option value="">انتخاب حساب صندوق</option>
                            {cashAccount && (
                              <option value={cashAccount.id}>
                                {cashAccount.code} - {cashAccount.name}
                              </option>
                            )}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* چک */}
              <div className="col-md-6">
                <div className="card h-100 border-warning">
                  <div className="card-header bg-warning bg-opacity-10">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.paymentDistribution.cheque.enabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paymentDistribution: {
                            ...prev.paymentDistribution,
                            cheque: {
                              ...prev.paymentDistribution.cheque,
                              enabled: e.target.checked
                            }
                          }
                        }))}
                        disabled={loading}
                      />
                      <label className="form-check-label fw-bold">
                        🧾 چک
                      </label>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    {formData.paymentDistribution.cheque.enabled && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">جمع مبلغ چک‌ها</label>
                          <div className="fs-5 fw-bold text-warning">
                            {formData.paymentDistribution.cheque.amount.toLocaleString()} ریال
                          </div>
                          <small className="text-muted">
                            از {formData.paymentDistribution.cheque.cheques.length} فقره چک
                          </small>
                        </div>
                        
                        {/* لیست چک‌ها */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0">چک‌ها</label>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning"
                              onClick={addCheque}
                              disabled={loading}
                            >
                              <i className="bi bi-plus-circle me-1"></i>
                              افزودن چک
                            </button>
                          </div>
                          
                          {formData.paymentDistribution.cheque.cheques.length === 0 ? (
                            <div className="alert alert-warning p-2 small">
                              هنوز چکی اضافه نشده است
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-sm">
                                <thead>
                                  <tr>
                                    <th>شماره چک</th>
                                    <th>مبلغ</th>
                                    <th>سررسید</th>
                                    <th>بانک</th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {formData.paymentDistribution.cheque.cheques.map((cheque, index) => (
                                    <tr key={cheque.id}>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={cheque.chequeNumber}
                                          onChange={(e) => updateCheque(index, 'chequeNumber', e.target.value)}
                                          placeholder="شماره چک"
                                          disabled={loading}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={cheque.amount}
                                          onChange={(e) => updateCheque(index, 'amount', e.target.value)}
                                          placeholder="مبلغ"
                                          disabled={loading}
                                          style={{ width: '120px' }}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="date"
                                          className="form-control form-control-sm"
                                          value={cheque.dueDate}
                                          onChange={(e) => updateCheque(index, 'dueDate', e.target.value)}
                                          disabled={loading}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={cheque.bankName}
                                          onChange={(e) => updateCheque(index, 'bankName', e.target.value)}
                                          placeholder="نام بانک"
                                          disabled={loading}
                                        />
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => removeCheque(index)}
                                          disabled={loading}
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">حساب چک‌های وارده</label>
                          <select
                            className="form-select"
                            value={formData.paymentDistribution.cheque.chequeAccountId || ""}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentDistribution: {
                                ...prev.paymentDistribution,
                                cheque: {
                                  ...prev.paymentDistribution.cheque,
                                  chequeAccountId: e.target.value ? parseInt(e.target.value) : null
                                }
                              }
                            }))}
                            disabled={loading}
                          >
                            <option value="">انتخاب حساب چک‌های وارده</option>
                            {chequeAccount && (
                              <option value={chequeAccount.id}>
                                {chequeAccount.code} - {chequeAccount.name}
                              </option>
                            )}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* حواله */}
              <div className="col-md-6">
                <div className="card h-100 border-primary">
                  <div className="card-header bg-primary bg-opacity-10">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.paymentDistribution.transfer.enabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paymentDistribution: {
                            ...prev.paymentDistribution,
                            transfer: {
                              ...prev.paymentDistribution.transfer,
                              enabled: e.target.checked
                            }
                          }
                        }))}
                        disabled={loading}
                      />
                      <label className="form-check-label fw-bold">
                        🏦 حواله بانکی
                      </label>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    {formData.paymentDistribution.transfer.enabled && (
                      <>
                        <div className="mb-3">
                          <label className="form-label">مبلغ حواله (ریال)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.paymentDistribution.transfer.amount || 0}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentDistribution: {
                                ...prev.paymentDistribution,
                                transfer: {
                                  ...prev.paymentDistribution.transfer,
                                  amount: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            min="0"
                            max={totalSaleAmount}
                            disabled={loading}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">حساب بانک مقصد</label>
                          <select
                            className="form-select"
                            value={formData.paymentDistribution.transfer.bankDetailAccountId || ""}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentDistribution: {
                                ...prev.paymentDistribution,
                                transfer: {
                                  ...prev.paymentDistribution.transfer,
                                  bankDetailAccountId: e.target.value ? parseInt(e.target.value) : null
                                }
                              }
                            }))}
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
                        
                        <div className="mb-3">
                          <label className="form-label">شرح حواله</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.paymentDistribution.transfer.description}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              paymentDistribution: {
                                ...prev.paymentDistribution,
                                transfer: {
                                  ...prev.paymentDistribution.transfer,
                                  description: e.target.value
                                }
                              }
                            }))}
                            placeholder="شرح حواله بانکی..."
                            disabled={loading}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* نسیه (باقیمانده) */}
              <div className="col-md-6">
                <div className="card h-100 border-secondary">
                  <div className="card-header bg-secondary bg-opacity-10">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={true}
                        disabled
                      />
                      <label className="form-check-label fw-bold">
                        📝 نسیه (باقیمانده)
                      </label>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="text-center py-3">
                      <div className="fs-1 mb-2">📋</div>
                      <div className="fs-4 fw-bold mb-2">
                        {creditAmount.toLocaleString()} ریال
                      </div>
                      <p className="text-muted small mb-0">
                        باقیمانده بدهی مشتری پس از کسر پرداخت‌ها
                      </p>
                      {creditAmount > 0 && (
                        <div className="alert alert-warning mt-3 p-2 small">
                          <i className="bi bi-info-circle me-1"></i>
                          این مبلغ به صورت نسیه در حساب مشتری باقی می‌ماند
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* خلاصه پرداخت‌ها */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card border-dark">
                  <div className="card-header bg-dark bg-opacity-10">
                    <h6 className="mb-0">📊 خلاصه پرداخت‌ها</h6>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr className="table-light">
                            <th>روش پرداخت</th>
                            <th>وضعیت</th>
                            <th>مبلغ (ریال)</th>
                            <th>درصد از کل</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>💰 نقدی</td>
                            <td>
                              {formData.paymentDistribution.cash.enabled ? (
                                <span className="badge bg-success">فعال</span>
                              ) : (
                                <span className="badge bg-secondary">غیرفعال</span>
                              )}
                            </td>
                            <td className="fw-bold">
                              {formData.paymentDistribution.cash.amount.toLocaleString()}
                            </td>
                            <td>
                              {totalSaleAmount > 0 
                                ? ((formData.paymentDistribution.cash.amount / totalSaleAmount) * 100).toFixed(1)
                                : 0}%
                            </td>
                          </tr>
                          
                          <tr>
                            <td>🧾 چک</td>
                            <td>
                              {formData.paymentDistribution.cheque.enabled ? (
                                <span className="badge bg-success">فعال</span>
                              ) : (
                                <span className="badge bg-secondary">غیرفعال</span>
                              )}
                            </td>
                            <td className="fw-bold">
                              {formData.paymentDistribution.cheque.amount.toLocaleString()}
                            </td>
                            <td>
                              {totalSaleAmount > 0 
                                ? ((formData.paymentDistribution.cheque.amount / totalSaleAmount) * 100).toFixed(1)
                                : 0}%
                            </td>
                          </tr>
                          
                          <tr>
                            <td>🏦 حواله</td>
                            <td>
                              {formData.paymentDistribution.transfer.enabled ? (
                                <span className="badge bg-success">فعال</span>
                              ) : (
                                <span className="badge bg-secondary">غیرفعال</span>
                              )}
                            </td>
                            <td className="fw-bold">
                              {formData.paymentDistribution.transfer.amount.toLocaleString()}
                            </td>
                            <td>
                              {totalSaleAmount > 0 
                                ? ((formData.paymentDistribution.transfer.amount / totalSaleAmount) * 100).toFixed(1)
                                : 0}%
                            </td>
                          </tr>
                          
                          <tr className="table-warning">
                            <td>📝 نسیه (باقیمانده)</td>
                            <td>
                              <span className="badge bg-warning">اتوماتیک</span>
                            </td>
                            <td className="fw-bold">
                              {creditAmount.toLocaleString()}
                            </td>
                            <td>
                              {totalSaleAmount > 0 
                                ? ((creditAmount / totalSaleAmount) * 100).toFixed(1)
                                : 0}%
                            </td>
                          </tr>
                          
                          <tr className="table-primary">
                            <td colSpan="2" className="text-end fw-bold">
                              جمع کل:
                            </td>
                            <td className="fw-bold fs-5">
                              {totalSaleAmount.toLocaleString()}
                            </td>
                            <td className="fw-bold fs-5">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* وضعیت اعتبارسنجی */}
                    <div className={`alert ${validatePaymentTotal() ? 'alert-success' : 'alert-danger'}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <i className={`bi ${validatePaymentTotal() ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                          {validatePaymentTotal() 
                            ? '✅ مجموع پرداخت‌ها با مبلغ فاکتور برابر است' 
                            : '❌ مجموع پرداخت‌ها بیشتر از مبلغ فاکتور است!'}
                        </div>
                        <div className="fw-bold">
                          مجموع پرداخت‌ها: {
                            (formData.paymentDistribution.cash.amount + 
                             formData.paymentDistribution.cheque.amount + 
                             formData.paymentDistribution.transfer.amount)
                            .toLocaleString()
                          } ریال
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                          {(item.quantity * item.salePrice).toLocaleString()} ریال
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
                  <h6 className="alert-heading">📝 ساختار سند حسابداری (ترکیبی):</h6>
                  <div className="small">
                    <div className="mb-2">۱. بستانکار: موجودی کالا (1-04-0003)</div>
                    <div className="mb-2 pl-3">بدهکار: حساب مشتری (مبلغ کل)</div>
                    
                    {formData.paymentDistribution.cash.enabled && formData.paymentDistribution.cash.amount > 0 && (
                      <div className="mb-2">۲. بستانکار: حساب مشتری</div>
                    )}
                    {formData.paymentDistribution.cash.enabled && formData.paymentDistribution.cash.amount > 0 && (
                      <div className="mb-2 pl-3">بدهکار: صندوق (1-01-0002-01)</div>
                    )}
                    
                    {formData.paymentDistribution.cheque.enabled && formData.paymentDistribution.cheque.amount > 0 && (
                      <div className="mb-2">۳. بستانکار: حساب مشتری</div>
                    )}
                    {formData.paymentDistribution.cheque.enabled && formData.paymentDistribution.cheque.amount > 0 && (
                      <div className="mb-2 pl-3">بدهکار: چک‌های وارده (1-02-0001)</div>
                    )}
                    
                    {formData.paymentDistribution.transfer.enabled && formData.paymentDistribution.transfer.amount > 0 && (
                      <div className="mb-2">۴. بستانکار: حساب مشتری</div>
                    )}
                    {formData.paymentDistribution.transfer.enabled && formData.paymentDistribution.transfer.amount > 0 && (
                      <div className="mb-2 pl-3">بدهکار: حساب بانک</div>
                    )}
                    
                    {creditAmount > 0 && (
                      <div className="text-warning mt-2">
                        باقیمانده: {creditAmount.toLocaleString()} ریال نسیه
                      </div>
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
                    <li>📄 سند حسابداری ترکیبی ایجاد می‌شود</li>
                    <li>💰 پرداخت‌ها به صورت ترکیبی ثبت می‌شوند</li>
                    {formData.paymentDistribution.cheque.enabled && (
                      <li>🧾 چک‌های دریافتنی ثبت می‌شوند</li>
                    )}
                    {creditAmount > 0 && (
                      <li>📝 بخشی از مبلغ به صورت نسیه باقی می‌ماند</li>
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
                      !formData.customerDetailAccountId ||
                      !formData.warehouseId ||
                      !validatePaymentTotal()
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
                        ثبت فاکتور فروش (ترکیبی)
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