// src/app/inventory/documents/purchase-materials/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PurchaseMaterialsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [detailAccounts, setDetailAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    supplierId: "",
    description: "",
    
    // اطلاعات پرداخت
    paymentMethod: "", // 'cash', 'transfer', 'cheque', 'credit'
    expenseDetailAccountId: "",
    bankDetailAccountId: "",
    paymentDescription: "",
    
    // اطلاعات چک (اگر پرداخت چکی است)
    chequeData: {
      chequeNumber: "",
      amount: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      description: ""
    },
    
    // مواد خریداری شده
    materials: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // بارگذاری موازی داده‌ها
      const [
        warehousesRes,
        productsRes,
        suppliersRes,
        detailAccountsRes,
        banksRes
      ] = await Promise.all([
        fetch("/api/inventory/warehouses"),
        fetch("/api/inventory/products"),
        fetch("/api/persons"),
        fetch("/api/detail-accounts"),
        fetch("/api/detail-accounts/bank-accounts")
      ]);

      // پردازش پاسخ‌ها
      if (warehousesRes.ok) {
        const data = await warehousesRes.json();
        setWarehouses(data.warehouses || []);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        // فقط تامین‌کنندگان
        const suppliersData = Array.isArray(data) ? data : [];
        setSuppliers(suppliersData.filter(p => p.type === 'supplier'));
      }

      if (detailAccountsRes.ok) {
        const data = await detailAccountsRes.json();
        const accountsArray = Array.isArray(data) ? data : 
                            data.accounts || data.detailAccounts || [];
        // حساب‌های هزینه/خرید
        const expenseAccounts = accountsArray.filter(acc => 
          acc.name && (
            acc.name.includes('مواد') ||
            acc.name.includes('خرید') ||
            acc.name.includes('هزینه') ||
            (acc.subAccount && (
              acc.subAccount.code.startsWith('6') || // حساب‌های هزینه
              acc.subAccount.code.startsWith('1-04') // موجودی مواد
            ))
          )
        );
        setDetailAccounts(expenseAccounts);
      }

      if (banksRes.ok) {
        const data = await banksRes.json();
        setBankAccounts(data.accounts || []);
      }

    } catch (error) {
      console.error("خطا در بارگذاری داده‌ها:", error);
      alert("خطا در بارگذاری اطلاعات اولیه");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // اعتبارسنجی
    if (formData.materials.length === 0) {
      alert("حداقل یک ماده اولیه باید اضافه شود");
      return;
    }

    if (!formData.warehouseId) {
      alert("انبار مقصد را انتخاب کنید");
      return;
    }

    // اگر روش پرداخت مشخص شده، حساب هزینه باید مشخص باشد
    if (formData.paymentMethod && !formData.expenseDetailAccountId) {
      alert("برای ثبت پرداخت، حساب هزینه/خرید را انتخاب کنید");
      return;
    }

    // اگر پرداخت حواله یا چک است، حساب بانک باید مشخص باشد
    if ((formData.paymentMethod === 'transfer' || formData.paymentMethod === 'cheque') && 
        !formData.bankDetailAccountId) {
      alert("برای این روش پرداخت، حساب بانک را انتخاب کنید");
      return;
    }

    // اگر پرداخت چکی است، اطلاعات چک را بررسی کن
    if (formData.paymentMethod === 'cheque') {
      if (!formData.chequeData.chequeNumber || !formData.chequeData.amount || 
          !formData.chequeData.issueDate || !formData.chequeData.dueDate) {
        alert("لطفاً اطلاعات کامل چک را وارد کنید");
        return;
      }
    }

    setLoading(true);

    try {
      // محاسبه مجموع مقادیر
      const totalQuantity = formData.materials.reduce((sum, item) => 
        sum + (parseFloat(item.quantity) || 0), 0
      );
      
      const totalAmount = formData.materials.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        return sum + (quantity * unitPrice);
      }, 0);

      // آماده‌سازی payload
      const payload = {
        typeId: getTransactionTypeId(), // نوع سند خرید
        warehouseId: parseInt(formData.warehouseId),
        personId: formData.supplierId ? parseInt(formData.supplierId) : null,
        documentDate: formData.invoiceDate,
        referenceNumber: formData.invoiceNumber,
        description: formData.description,
        items: formData.materials.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          description: item.description || ''
        })),
        
        // اطلاعات پرداخت
        paymentMethod: formData.paymentMethod,
        bankDetailAccountId: formData.bankDetailAccountId ? 
          parseInt(formData.bankDetailAccountId) : null,
        expenseDetailAccountId: formData.expenseDetailAccountId ? 
          parseInt(formData.expenseDetailAccountId) : null,
        paymentDescription: formData.paymentDescription,
        chequeData: formData.paymentMethod === 'cheque' ? formData.chequeData : null,
        
        // اطلاعات محاسباتی
        totalQuantity,
        totalAmount
      };

      console.log("📤 ارسال داده‌های خرید مواد اولیه:", payload);

      const response = await fetch("/api/inventory/documents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        let successMessage = "✅ خرید مواد اولیه با موفقیت ثبت شد";
        
        if (data.voucher) {
          successMessage += `\n📄 سند حسابداری: ${data.voucher.voucherNumber}`;
        }
        
        if (data.cheque) {
          successMessage += `\n🧾 چک ثبت شده: ${data.cheque.chequeNumber}`;
        }
        
        alert(successMessage);
        
        // بازگشت به لیست اسناد
        router.push("/inventory/documents");
        router.refresh();
        
      } else {
        throw new Error(data.error || data.message || "خطا در ثبت خرید");
      }

    } catch (error) {
      console.error("❌ خطا در ثبت خرید:", error);
      alert(`خطا در ثبت خرید: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeId = () => {
    // در اینجا باید ID نوع تراکنش خرید را پیدا کنیم
    // به صورت موقت مقدار 1 را برمی‌گردانیم (نوع خرید)
    return 1;
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          productId: "",
          quantity: 1,
          unitPrice: 0,
          description: ""
        }
      ]
    }));
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    setFormData(prev => ({ ...prev, materials: newMaterials }));
  };

  const calculateTotal = () => {
    return formData.materials.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const handlePaymentMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  // وقتی محصول انتخاب شد، قیمت پیش‌فرض را تنظیم کن
  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product && product.defaultPurchasePrice > 0) {
      updateMaterial(index, "unitPrice", product.defaultPurchasePrice);
    }
    updateMaterial(index, "productId", productId);
  };

  return (
    <div className="container-fluid py-4">
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">🛒 خرید مواد اولیه</h1>
          <p className="text-muted mb-0">
            ثبت خرید مواد اولیه با قابلیت ایجاد خودکار سند حسابداری
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => router.back()}
            className="btn btn-outline-secondary"
          >
            بازگشت
          </button>
        </div>
      </div>

      {/* فرم خرید */}
      <form onSubmit={handleSubmit}>
        {/* بخش اطلاعات فاکتور و تامین‌کننده */}
        <div className="card mb-4">
          <div className="card-header bg-primary bg-opacity-10">
            <h5 className="mb-0">📋 اطلاعات خرید</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">
                  شماره فاکتور <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    invoiceNumber: e.target.value
                  }))}
                  required
                  placeholder="مثال: INV-1402-001"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  تاریخ فاکتور <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    invoiceDate: e.target.value
                  }))}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  انبار مقصد <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.warehouseId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    warehouseId: e.target.value
                  }))}
                  required
                >
                  <option value="">انتخاب انبار</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">تامین‌کننده</label>
                <select
                  className="form-select"
                  value={formData.supplierId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    supplierId: e.target.value
                  }))}
                >
                  <option value="">انتخاب تامین‌کننده</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="شرح خرید مواد اولیه..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* بخش پرداخت */}
        <div className="card mb-4">
          <div className="card-header bg-info bg-opacity-10">
            <h5 className="mb-0">💰 اطلاعات پرداخت</h5>
          </div>
          <div className="card-body">
            {/* انتخاب روش پرداخت */}
            <div className="row mb-4">
              <div className="col-12">
                <label className="form-label mb-3">روش پرداخت</label>
                <div className="d-flex flex-wrap gap-3">
                  {[
                    { id: 'cash', label: '💰 پرداخت نقدی', icon: 'bi-cash' },
                    { id: 'transfer', label: '🏦 پرداخت حواله', icon: 'bi-bank' },
                    { id: 'cheque', label: '🧾 پرداخت چکی', icon: 'bi-pen' },
                    { id: 'credit', label: '📝 خرید نسیه', icon: 'bi-clock' }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      className={`btn btn-outline-${formData.paymentMethod === method.id ? 'primary' : 'secondary'} d-flex align-items-center`}
                      onClick={() => handlePaymentMethodChange(method.id)}
                    >
                      <i className={`bi ${method.icon} me-2`}></i>
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* فرم‌های مربوط به هر روش پرداخت */}
            {formData.paymentMethod && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    حساب هزینه/خرید <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.expenseDetailAccountId}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      expenseDetailAccountId: e.target.value
                    }))}
                    required
                  >
                    <option value="">انتخاب حساب</option>
                    {detailAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.paymentMethod === 'transfer' || formData.paymentMethod === 'cheque') && (
                  <div className="col-md-6">
                    <label className="form-label">
                      حساب بانک <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.bankDetailAccountId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bankDetailAccountId: e.target.value
                      }))}
                      required
                    >
                      <option value="">انتخاب حساب بانک</option>
                      {bankAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-md-12">
                  <label className="form-label">شرح پرداخت</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.paymentDescription}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      paymentDescription: e.target.value
                    }))}
                    placeholder="شرح عملیات پرداخت..."
                  />
                </div>
              </div>
            )}

            {/* فرم اطلاعات چک */}
            {formData.paymentMethod === 'cheque' && (
              <div className="border rounded p-3 mt-3">
                <h6 className="mb-3">🧾 اطلاعات چک</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      شماره چک <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.chequeData.chequeNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        chequeData: {
                          ...prev.chequeData,
                          chequeNumber: e.target.value
                        }
                      }))}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      مبلغ چک <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.chequeData.amount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        chequeData: {
                          ...prev.chequeData,
                          amount: e.target.value
                        }
                      }))}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      تاریخ سررسید <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.chequeData.dueDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        chequeData: {
                          ...prev.chequeData,
                          dueDate: e.target.value
                        }
                      }))}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">شرح چک</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.chequeData.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        chequeData: {
                          ...prev.chequeData,
                          description: e.target.value
                        }
                      }))}
                      placeholder="شرح چک..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* بخش مواد اولیه */}
        <div className="card mb-4">
          <div className="card-header bg-success bg-opacity-10">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📦 مواد اولیه خریداری شده</h5>
              <button
                type="button"
                onClick={addMaterial}
                className="btn btn-sm btn-success"
              >
                <i className="bi bi-plus-circle me-1"></i>
                افزودن ماده اولیه
              </button>
            </div>
          </div>

          <div className="card-body">
            {formData.materials.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-box display-4 d-block mb-3"></i>
                هنوز ماده اولیه‌ای اضافه نشده است
              </div>
            ) : (
              <>
                {/* جدول مواد اولیه */}
                <div className="table-responsive">
                  <table className="table table-hover">
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
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={material.productId}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              required
                            >
                              <option value="">انتخاب کالا</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.code} - {product.name}
                                  {product.unit && ` (${product.unit.name})`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={material.quantity}
                              onChange={(e) => updateMaterial(index, "quantity", e.target.value)}
                              min="0.001"
                              step="0.001"
                              style={{ width: "100px" }}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={material.unitPrice}
                              onChange={(e) => updateMaterial(index, "unitPrice", e.target.value)}
                              min="0"
                              style={{ width: "150px" }}
                              required
                            />
                          </td>
                          <td className="fw-bold">
                            {(material.quantity * material.unitPrice).toLocaleString()} ریال
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={material.description}
                              onChange={(e) => updateMaterial(index, "description", e.target.value)}
                              placeholder="توضیحات..."
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeMaterial(index)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold fs-5">جمع کل:</td>
                        <td className="fw-bold fs-5 text-success">
                          {calculateTotal().toLocaleString()} ریال
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* خلاصه و دکمه‌های ثبت */}
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
                    <span className="fw-bold">{formData.materials.length}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>جمع تعداد:</span>
                    <span className="fw-bold">
                      {formData.materials.reduce((sum, item) => 
                        sum + (parseFloat(item.quantity) || 0), 0
                      )} واحد
                    </span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="fs-5">مبلغ کل خرید:</span>
                    <span className="fs-4 fw-bold text-success">
                      {calculateTotal().toLocaleString()} ریال
                    </span>
                  </div>
                </div>

                {formData.paymentMethod && (
                  <div className="alert alert-info mt-3">
                    <h6 className="alert-heading">روش پرداخت:</h6>
                    <p className="mb-0">
                      {formData.paymentMethod === 'cash' && '💰 پرداخت نقدی'}
                      {formData.paymentMethod === 'transfer' && '🏦 پرداخت حواله'}
                      {formData.paymentMethod === 'cheque' && '🧾 پرداخت چکی'}
                      {formData.paymentMethod === 'credit' && '📝 خرید نسیه'}
                    </p>
                  </div>
                )}
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
                    {formData.paymentMethod === 'cheque' && (
                      <li>🧾 چک پرداختی در سیستم چک‌ها ثبت می‌شود</li>
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
                    disabled={loading || formData.materials.length === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        در حال ثبت...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        ثبت خرید مواد اولیه
                        {formData.paymentMethod && ' و سند حسابداری'}
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