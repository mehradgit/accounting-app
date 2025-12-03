// src/components/forms/InventoryDocumentForm.jsx - نسخه اصلاح شده
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryDocumentForm({ onSuccess, defaultType = '' }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    typeId: '',
    warehouseId: '',
    personId: '',
    documentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    description: '',
    
    // بخش پرداخت
    paymentMethod: '', // 'cash', 'transfer', 'cheque', ''
    bankDetailAccountId: '',
    expenseDetailAccountId: '',
    paymentDescription: '',
    
    // اطلاعات چک (اگر پرداخت چکی است)
    chequeData: {
      chequeNumber: '',
      amount: '',
      issueDate: '',
      dueDate: '',
      description: ''
    }
  });
  
  const [items, setItems] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [persons, setPersons] = useState([]);
  const [products, setProducts] = useState([]);
  const [detailAccounts, setDetailAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // بارگذاری داده‌های اولیه
  useEffect(() => {
    fetchInitialData();
  }, []);

  // تنظیم نوع پیش‌فرض
  useEffect(() => {
    if (defaultType && transactionTypes.length > 0) {
      const type = transactionTypes.find(t => 
        t.code.toLowerCase().includes(defaultType.toLowerCase()) ||
        t.name.includes(defaultType)
      );
      if (type) {
        setFormData(prev => ({ ...prev, typeId: type.id }));
      }
    }
  }, [defaultType, transactionTypes]);

  // فیلتر محصولات بر اساس جستجو
  useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.code.toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.barcode && product.barcode.includes(productSearch))
      );
      setFilteredProducts(filtered);
    }
  }, [productSearch, products]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // بارگذاری موازی داده‌ها
      const [typesRes, warehousesRes, personsRes, productsRes, accountsRes] = await Promise.all([
        fetch('/api/inventory/transaction-types'),
        fetch('/api/inventory/warehouses'),
        fetch('/api/persons'),
        fetch('/api/inventory/products'),
        fetch('/api/detail-accounts/for-products')
      ]);

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setTransactionTypes(Array.isArray(typesData) ? typesData : (typesData.types || []));
      }
      
      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData.warehouses || []);
      }
      
      if (personsRes.ok) {
        const personsData = await personsRes.ok ? await personsRes.json() : [];
        setPersons(personsData);
      }
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
        setFilteredProducts(productsData.products || []);
      }
      
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setDetailAccounts(accountsData);
      }
      
    } catch (error) {
      console.error('خطا در بارگذاری داده‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('لطفاً حداقل یک کالا اضافه کنید');
      return;
    }

    // اگر روش پرداخت مشخص شده، حساب هزینه باید مشخص باشد
    if (formData.paymentMethod && !formData.expenseDetailAccountId) {
      alert('برای ثبت پرداخت، حساب هزینه/خرید را انتخاب کنید');
      return;
    }

    // اگر پرداخت حواله یا چک است، حساب بانک باید مشخص باشد
    if ((formData.paymentMethod === 'transfer' || formData.paymentMethod === 'cheque') && 
        !formData.bankDetailAccountId) {
      alert('برای این روش پرداخت، حساب بانک را انتخاب کنید');
      return;
    }

    // اگر پرداخت چکی است، اطلاعات چک را بررسی کن
    if (formData.paymentMethod === 'cheque') {
      if (!formData.chequeData.chequeNumber || !formData.chequeData.amount || 
          !formData.chequeData.issueDate || !formData.chequeData.dueDate) {
        alert('لطفاً اطلاعات کامل چک را وارد کنید');
        return;
      }
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        items: items.map(item => ({
          productId: item.id,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          description: item.description || ''
        })),
        createVoucher: !!formData.paymentMethod // اگر روش پرداخت مشخص شده، سند حسابداری هم ایجاد شود
      };

      console.log('📤 ارسال داده‌ها:', payload);

      const response = await fetch('/api/inventory/documents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ سند انبار با موفقیت ثبت شد');
        
        // نمایش اطلاعات ثبت شده
        if (data.voucher) {
          alert(`📄 سند حسابداری شماره ${data.voucher.voucherNumber} نیز ثبت شد`);
        }
        
        if (data.cheque) {
          alert(`🧾 چک شماره ${data.cheque.chequeNumber} نیز ثبت شد`);
        }
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/inventory/documents');
        }
      } else {
        throw new Error(data.error || 'خطا در ثبت سند');
      }
    } catch (error) {
      console.error('❌ خطا در ثبت سند:', error);
      alert(`خطا در ثبت سند: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (product) => {
    if (items.some(item => item.id === product.id)) {
      alert('این کالا قبلاً اضافه شده است');
      return;
    }

    const newItem = {
      id: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit?.name || 'عدد',
      quantity: 1,
      unitPrice: product.defaultPurchasePrice || 0,
      description: ''
    };

    setItems([...items, newItem]);
    setProductSearch('');
    setFilteredProducts(products);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0).toFixed(0);
  };

  // کامپوننت برای فرم چک
  const ChequeFormSection = () => (
    <div className="card border mb-4">
      <div className="card-header bg-warning bg-opacity-10">
        <h6 className="mb-0">
          <i className="bi bi-pen text-warning me-2"></i>
          اطلاعات چک
        </h6>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">
              شماره چک <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.chequeData.chequeNumber}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                chequeData: { ...prev.chequeData, chequeNumber: e.target.value }
              }))}
              required
            />
          </div>
          
          <div className="col-md-6">
            <label className="form-label">
              مبلغ چک <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="form-control"
              value={formData.chequeData.amount}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                chequeData: { ...prev.chequeData, amount: e.target.value }
              }))}
              required
            />
          </div>
          
          <div className="col-md-6">
            <label className="form-label">
              تاریخ صدور <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={formData.chequeData.issueDate}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                chequeData: { ...prev.chequeData, issueDate: e.target.value }
              }))}
              required
            />
          </div>
          
          <div className="col-md-6">
            <label className="form-label">
              تاریخ سررسید <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={formData.chequeData.dueDate}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                chequeData: { ...prev.chequeData, dueDate: e.target.value }
              }))}
              required
            />
          </div>
          
          <div className="col-12">
            <label className="form-label">شرح چک</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.chequeData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                chequeData: { ...prev.chequeData, description: e.target.value }
              }))}
              placeholder="شرح دلخواه برای چک..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* بخش اطلاعات اصلی */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">
            نوع سند <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={formData.typeId}
            onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
            required
          >
            <option value="">انتخاب کنید</option>
            {transactionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.effect === 'increase' ? 'افزایش' : 'کاهش'})
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-4">
          <label className="form-label">
            انبار <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            required
          >
            <option value="">انتخاب کنید</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-4">
          <label className="form-label">تاریخ سند <span className="text-danger">*</span></label>
          <input
            type="date"
            className="form-control"
            value={formData.documentDate}
            onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })}
            required
          />
        </div>
      </div>

      {/* بخش طرف حساب */}
      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">طرف حساب (اختیاری)</label>
          <select
            className="form-select"
            value={formData.personId}
            onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
          >
            <option value="">انتخاب کنید</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} ({person.type === 'supplier' ? 'تامین‌کننده' : 
                              person.type === 'customer' ? 'مشتری' : 'سایر'})
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-6">
          <label className="form-label">شماره ارجاع</label>
          <input
            type="text"
            className="form-control"
            value={formData.referenceNumber}
            onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            placeholder="مثلاً شماره فاکتور"
          />
        </div>
      </div>

      {/* بخش پرداخت */}
      <div className="card border mb-4">
        <div className="card-header bg-info bg-opacity-10">
          <h6 className="mb-0">
            <i className="bi bi-cash-coin text-info me-2"></i>
            اطلاعات پرداخت (اختیاری)
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">روش پرداخت</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="">انتخاب کنید</option>
                <option value="">بدون پرداخت (ثبت نسیه)</option>
                <option value="cash">پرداخت نقدی</option>
                <option value="transfer">پرداخت حواله</option>
                <option value="cheque">پرداخت چکی</option>
              </select>
            </div>
            
            <div className="col-md-6">
              <label className="form-label">حساب هزینه/خرید</label>
              <select
                className="form-select"
                value={formData.expenseDetailAccountId}
                onChange={(e) => setFormData({ ...formData, expenseDetailAccountId: e.target.value })}
                disabled={!formData.paymentMethod}
              >
                <option value="">انتخاب کنید</option>
                {detailAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name} 
                    {account.subAccount && ` (${account.subAccount.code})`}
                  </option>
                ))}
              </select>
            </div>
            
            {(formData.paymentMethod === 'transfer' || formData.paymentMethod === 'cheque') && (
              <div className="col-md-6">
                <label className="form-label">حساب بانک <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={formData.bankDetailAccountId}
                  onChange={(e) => setFormData({ ...formData, bankDetailAccountId: e.target.value })}
                  required
                >
                  <option value="">انتخاب کنید</option>
                  {detailAccounts.filter(acc => 
                    acc.name.toLowerCase().includes('بانک') || 
                    acc.subAccount?.code?.startsWith('1-03') // حساب‌های بانکی
                  ).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="col-md-6">
              <label className="form-label">شرح پرداخت</label>
              <input
                type="text"
                className="form-control"
                value={formData.paymentDescription}
                onChange={(e) => setFormData({ ...formData, paymentDescription: e.target.value })}
                placeholder="شرح پرداخت..."
              />
            </div>
          </div>
          
          {/* فرم اطلاعات چک (فقط اگر پرداخت چکی است) */}
          {formData.paymentMethod === 'cheque' && <ChequeFormSection />}
        </div>
      </div>

      {/* بخش انتخاب کالاها */}
      <div className="card border mb-4">
        <div className="card-header bg-primary bg-opacity-10">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <i className="bi bi-cart-plus text-primary me-2"></i>
              کالاها
            </h6>
            <span className="badge bg-primary">
              {items.length} کالا
            </span>
          </div>
        </div>
        
        <div className="card-body">
          {/* جستجوی کالا */}
          <div className="mb-4">
            <label className="form-label">جستجوی کالا</label>
            <input
              type="text"
              className="form-control"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="جستجوی کالا با نام، کد یا بارکد..."
            />
            
            {/* لیست کالاهای پیشنهادی */}
            {productSearch && filteredProducts.length > 0 && (
              <div className="mt-2 border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredProducts.slice(0, 10).map((product) => (
                  <div
                    key={product.id}
                    className="p-2 border-bottom hover-bg-light cursor-pointer"
                    onClick={() => handleAddItem(product)}
                  >
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>{product.name}</strong>
                        <small className="text-muted d-block">
                          کد: {product.code} | واحد: {product.unit?.name || 'عدد'}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">
                          قیمت خرید: {product.defaultPurchasePrice?.toLocaleString()} ریال
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* لیست کالاهای انتخاب شده */}
          {items.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>کد</th>
                    <th>نام کالا</th>
                    <th>واحد</th>
                    <th>تعداد</th>
                    <th>قیمت واحد (ریال)</th>
                    <th>جمع (ریال)</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{item.unit}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          min="0.001"
                          step="0.001"
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          min="0"
                          style={{ width: '150px' }}
                        />
                      </td>
                      <td>
                        {(item.quantity * item.unitPrice).toLocaleString()} ریال
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="text-end fw-bold">جمع کل:</td>
                    <td className="fw-bold text-success">
                      {calculateTotal().toLocaleString()} ریال
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* بخش توضیحات */}
      <div className="mb-4">
        <label className="form-label">توضیحات سند</label>
        <textarea
          className="form-control"
          rows="3"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="توضیحات اختیاری..."
        />
      </div>

      {/* دکمه‌های ثبت */}
      <div className="d-flex justify-content-between">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          <i className="bi bi-arrow-right me-2"></i>
          انصراف
        </button>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || items.length === 0}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              در حال ثبت...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              ثبت سند انبار
              {formData.paymentMethod && ' و سند حسابداری'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}