'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react'; // اضافه کردن import React

export default function InventoryDocumentForm({ onSuccess, defaultType = '' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [createVoucher, setCreateVoucher] = useState(true);

  const [formData, setFormData] = useState({
    typeId: defaultType || '',
    warehouseId: '',
    personId: '',
    documentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    description: '',
    items: []
  });

  const [errors, setErrors] = useState({});
  const [currentProduct, setCurrentProduct] = useState(null);

  useEffect(() => {
    loadDependencies();
  }, []);

  const loadDependencies = async () => {
    try {
      console.log('Loading dependencies...');
      
      const [warehousesRes, typesRes, productsRes, personsRes] = await Promise.all([
        fetch('/api/inventory/warehouses'),
        fetch('/api/inventory/transaction-types'),
        fetch('/api/inventory/products'),
        fetch('/api/persons')
      ]);

      console.log('Responses received:', {
        warehouses: warehousesRes.status,
        types: typesRes.status,
        products: productsRes.status,
        persons: personsRes.status
      });

      const warehousesData = await warehousesRes.json();
      const typesData = await typesRes.json();
      const productsData = await productsRes.json();
      const personsData = await personsRes.json();

      console.log('Data received:', {
        warehousesData,
        typesData,
        productsData,
        personsData
      });

      // بررسی فرمت داده‌ها
      const warehousesArray = Array.isArray(warehousesData) ? warehousesData : (warehousesData.warehouses || []);
      const typesArray = Array.isArray(typesData) ? typesData : (typesData.types || []);
      const productsArray = Array.isArray(productsData) ? productsData : (productsData.products || []);
      const personsArray = Array.isArray(personsData) ? personsData : (personsData.persons || []);

      console.log('Arrays:', {
        warehousesArray,
        typesArray,
        productsArray,
        personsArray
      });

      setWarehouses(warehousesArray);
      setTransactionTypes(typesArray);
      setProducts(productsArray);
      setPersons(personsArray);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.typeId) {
      newErrors.typeId = 'نوع سند الزامی است';
    }
    
    if (!formData.warehouseId) {
      newErrors.warehouseId = 'انبار الزامی است';
    }
    
    if (!formData.documentDate) {
      newErrors.documentDate = 'تاریخ سند الزامی است';
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'حداقل یک کالا باید اضافه شود';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        typeId: parseInt(formData.typeId),
        warehouseId: parseInt(formData.warehouseId),
        personId: formData.personId ? parseInt(formData.personId) : null,
        items: formData.items.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice) || 0,
          description: item.description || ''
        })),
        createVoucher
      };

      console.log('Submitting payload:', payload);

      const response = await fetch('/api/inventory/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        alert('سند انبار با موفقیت ثبت شد');
        
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در ثبت سند');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('خطا در ثبت سند');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    setCurrentProduct(product);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: '',
        quantity: 1,
        unitPrice: currentProduct?.defaultPurchasePrice || 0,
        description: ''
      }]
    }));
  };

  const removeItem = (index) => {
    if (confirm('آیا از حذف این کالا اطمینان دارید؟')) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        unitPrice: product?.defaultPurchasePrice || 0
      };
      handleProductSelect(value);
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value
      };
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const clearItems = () => {
    if (confirm('آیا از حذف تمام کالاها اطمینان دارید؟')) {
      setFormData(prev => ({
        ...prev,
        items: []
      }));
    }
  };

  const calculateItemTotal = (quantity, unitPrice) => {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);
  };

  const totalAmount = formData.items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.quantity, item.unitPrice);
  }, 0);

  const totalQuantity = formData.items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <div className="row g-4 mb-4">
        {/* اطلاعات اصلی سند */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light py-3">
              <h6 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                اطلاعات اصلی
              </h6>
            </div>
            <div className="card-body">
              {/* نوع سند */}
              <div className="mb-3">
                <label htmlFor="typeId" className="form-label">
                  نوع سند <span className="text-danger">*</span>
                </label>
                <select
                  id="typeId"
                  name="typeId"
                  value={formData.typeId}
                  onChange={handleChange}
                  className={`form-select ${errors.typeId ? 'is-invalid' : ''}`}
                  required
                >
                  <option value="">انتخاب نوع سند</option>
                  {transactionTypes.length === 0 ? (
                    <option value="" disabled>
                      در حال بارگذاری...
                    </option>
                  ) : (
                    transactionTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.effect === 'increase' ? 'افزایش موجودی' : 'کاهش موجودی'})
                      </option>
                    ))
                  )}
                </select>
                {errors.typeId && <div className="invalid-feedback">{errors.typeId}</div>}
                <div className="form-text">
                  {transactionTypes.length === 0 && 'لطفاً منتظر بمانید...'}
                  {transactionTypes.length > 0 && `${transactionTypes.length} نوع سند موجود است`}
                </div>
              </div>

              {/* انبار */}
              <div className="mb-3">
                <label htmlFor="warehouseId" className="form-label">
                  انبار <span className="text-danger">*</span>
                </label>
                <select
                  id="warehouseId"
                  name="warehouseId"
                  value={formData.warehouseId}
                  onChange={handleChange}
                  className={`form-select ${errors.warehouseId ? 'is-invalid' : ''}`}
                  required
                >
                  <option value="">انتخاب انبار</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </option>
                  ))}
                </select>
                {errors.warehouseId && <div className="invalid-feedback">{errors.warehouseId}</div>}
              </div>

              {/* تاریخ سند */}
              <div className="mb-3">
                <label htmlFor="documentDate" className="form-label">
                  تاریخ سند <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  id="documentDate"
                  name="documentDate"
                  value={formData.documentDate}
                  onChange={handleChange}
                  className={`form-control ${errors.documentDate ? 'is-invalid' : ''}`}
                  required
                />
                {errors.documentDate && <div className="invalid-feedback">{errors.documentDate}</div>}
              </div>

              {/* طرف حساب */}
              <div className="mb-3">
                <label htmlFor="personId" className="form-label">
                  طرف حساب
                </label>
                <select
                  id="personId"
                  name="personId"
                  value={formData.personId}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">بدون طرف حساب</option>
                  {persons.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.type === 'customer' ? 'مشتری' : 'تامین کننده'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* اطلاعات جانبی */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-light py-3">
              <h6 className="mb-0">
                <i className="bi bi-card-checklist me-2"></i>
                اطلاعات تکمیلی
              </h6>
            </div>
            <div className="card-body">
              {/* شماره مرجع */}
              <div className="mb-3">
                <label htmlFor="referenceNumber" className="form-label">
                  شماره مرجع
                </label>
                <input
                  type="text"
                  id="referenceNumber"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="شماره فاکتور یا سند مرجع"
                />
              </div>

              {/* توضیحات */}
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  توضیحات
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  placeholder="توضیحات مربوط به سند"
                />
              </div>

              {/* تنظیمات */}
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="createVoucher"
                    checked={createVoucher}
                    onChange={(e) => setCreateVoucher(e.target.checked)}
                    className="form-check-input"
                  />
                  <label htmlFor="createVoucher" className="form-check-label">
                    ایجاد سند حسابداری مرتبط
                  </label>
                  <div className="form-text">
                    در صورت انتخاب، سند حسابداری متناظر با این سند انبار ایجاد می‌شود
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بخش کالاها */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <i className="bi bi-boxes me-2"></i>
              کالاها
            </h6>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={clearItems}
                className="btn btn-outline-danger btn-sm d-flex align-items-center"
                disabled={formData.items.length === 0}
              >
                <i className="bi bi-trash me-1"></i>
                حذف همه
              </button>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-success btn-sm d-flex align-items-center"
              >
                <i className="bi bi-plus-circle me-1"></i>
                افزودن کالا
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {formData.items.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-box-seam display-5 d-block mb-3"></i>
              <p>هنوز کالایی اضافه نشده است</p>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                افزودن اولین کالا
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40%' }}>کالا</th>
                    <th style={{ width: '15%' }}>تعداد</th>
                    <th style={{ width: '15%' }}>قیمت واحد</th>
                    <th style={{ width: '15%' }}>مبلغ کل</th>
                    <th style={{ width: '10%' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const product = products.find(p => p.id === parseInt(item.productId));
                    const itemTotal = calculateItemTotal(item.quantity, item.unitPrice);
                    
                    return (
                      <tr key={index}>
                        <td>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="form-select"
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
                          {product && (
                            <small className="text-muted d-block mt-1">
                              موجودی فعلی: {product.currentStock || 0}
                            </small>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="form-control text-center"
                            min="0.001"
                            step="0.001"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="form-control text-center"
                            min="0"
                            step="1000"
                          />
                          <small className="text-muted d-block">
                            {item.unitPrice.toLocaleString('fa-IR')} ریال
                          </small>
                        </td>
                        <td>
                          <div className="fw-bold text-success">
                            {itemTotal.toLocaleString('fa-IR')} ریال
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="btn btn-outline-danger btn-sm"
                            title="حذف"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* جمع‌های کل */}
          {formData.items.length > 0 && (
            <div className="row mt-4">
              <div className="col-md-6">
                <div className="alert alert-info mb-0">
                  <div className="d-flex justify-content-between">
                    <span>تعداد کالاهای مختلف:</span>
                    <span className="fw-bold">{formData.items.length}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>تعداد کل اقلام:</span>
                    <span className="fw-bold">{totalQuantity.toLocaleString('fa-IR')}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="alert alert-success mb-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-5">جمع مبلغ کل:</span>
                    <span className="fs-4 fw-bold">{totalAmount.toLocaleString('fa-IR')} ریال</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {errors.items && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errors.items}
        </div>
      )}

      {/* دکمه‌های فرم */}
      <div className="border-top pt-4 mt-3">
        <div className="d-flex justify-content-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-outline-secondary d-flex align-items-center px-4"
            disabled={loading}
          >
            <i className="bi bi-arrow-right me-2"></i>
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-success d-flex align-items-center px-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                در حال ثبت...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                ثبت سند انبار
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}