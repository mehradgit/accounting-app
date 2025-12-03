"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductForm({ product, onSuccess }) {
  const router = useRouter();

  // State برای فرم
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    barcode: "",
    categoryId: "",
    unitId: "",
    defaultPurchasePrice: 0,
    defaultSalePrice: 0,
    defaultWholesalePrice: 0,
    minStock: 0,
    maxStock: 0,
    detailAccountId: "",
  });

  // State برای داده‌های کمکی
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [detailAccounts, setDetailAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchUnits(),
        fetchProductDetailAccounts(),
      ]);

      // اگر در حالت ویرایش هستیم، اطلاعات محصول را لود کن
      if (product) {
        setFormData({
          code: product.code || "",
          name: product.name || "",
          barcode: product.barcode || "",
          categoryId: product.categoryId || "",
          unitId: product.unitId || "",
          defaultPurchasePrice: product.defaultPurchasePrice || 0,
          defaultSalePrice: product.defaultSalePrice || 0,
          defaultWholesalePrice: product.defaultWholesalePrice || 0,
          minStock: product.minStock || 0,
          maxStock: product.maxStock || 0,
          detailAccountId: product.detailAccountId || "",
        });
      }
    };

    fetchData();
  }, [product]);

  // تابع برای دریافت دسته‌بندی‌ها
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/inventory/product-categories");
      if (response.ok) {
        const data = await response.json();
        // بررسی کنید که آیا data یک آرایه است یا نه
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.categories && Array.isArray(data.categories)) {
          // اگر API به صورت { categories: [...] } برمی‌گردد
          setCategories(data.categories);
        } else {
          console.error(
            "فرمت داده دریافتی برای دسته‌بندی‌ها نامعتبر است:",
            data
          );
          setCategories([]);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  // تابع برای دریافت واحدها
  const fetchUnits = async () => {
    try {
      const response = await fetch("/api/inventory/units");
      if (response.ok) {
        const data = await response.json();
        // بررسی کنید که آیا data یک آرایه است یا نه
        if (Array.isArray(data)) {
          setUnits(data);
        } else if (data.units && Array.isArray(data.units)) {
          // اگر API به صورت { units: [...] } برمی‌گردد
          setUnits(data.units);
        } else {
          console.error("فرمت داده دریافتی برای واحدها نامعتبر است:", data);
          setUnits([]);
        }
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    }
  };

  // تابع برای دریافت حساب‌های تفصیلی مخصوص کالاها
  const fetchProductDetailAccounts = async () => {
    try {
      setLoading(true);
      let data;

      // ابتدا سعی کنید از API مخصوص استفاده کنید
      try {
        const response = await fetch("/api/detail-accounts/for-products");
        if (response.ok) {
          data = await response.json();
          if (Array.isArray(data)) {
            setDetailAccounts(data);
            return;
          }
        }
      } catch (error) {
        console.log("API مخصوص پیدا نشد، از API عمومی استفاده می‌کنیم");
      }

      // اگر API مخصوص کار نکرد، از API عمومی با فیلتر استفاده کنید
      const fallbackResponse = await fetch(
        "/api/detail-accounts?mainAccountCode=1-04"
      );
      if (fallbackResponse.ok) {
        data = await fallbackResponse.json();
        if (Array.isArray(data)) {
          setDetailAccounts(data);
        } else {
          setDetailAccounts([]);
        }
      } else {
        setDetailAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching product detail accounts:", error);
      setDetailAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // تابع کمکی برای نمایش ایمن آرایه
  const renderOptions = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <option value="" disabled>
          موردی یافت نشد
        </option>
      );
    }

    return items.map((item) => (
      <option key={item.id} value={item.id}>
        {item.code} - {item.name}
      </option>
    ));
  };

  // تغییرات فرم
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // حذف خطا برای فیلد مربوطه
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // اعتبارسنجی فرم
  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "کد کالا الزامی است";
    }

    if (!formData.name.trim()) {
      newErrors.name = "نام کالا الزامی است";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "گروه کالا الزامی است";
    }

    if (!formData.unitId) {
      newErrors.unitId = "واحد اندازه‌گیری الزامی است";
    }

    if (parseFloat(formData.defaultPurchasePrice) < 0) {
      newErrors.defaultPurchasePrice = "قیمت خرید نمی‌تواند منفی باشد";
    }

    if (parseFloat(formData.defaultSalePrice) < 0) {
      newErrors.defaultSalePrice = "قیمت فروش نمی‌تواند منفی باشد";
    }

    if (
      formData.maxStock > 0 &&
      parseFloat(formData.minStock) > parseFloat(formData.maxStock)
    ) {
      newErrors.minStock = "حداقل موجودی نمی‌تواند بیشتر از حداکثر موجودی باشد";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ارسال فرم
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url = product
        ? `/api/inventory/products/${product.id}`
        : "/api/inventory/products";

      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(product ? "کالا با موفقیت ویرایش شد" : "کالا با موفقیت ایجاد شد");

        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "خطا در ثبت کالا");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <div className="row">
        {/* اطلاعات اصلی */}
        <div className="col-md-6 mb-3">
          <label htmlFor="code" className="form-label">
            کد کالا <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.code ? "is-invalid" : ""}`}
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            disabled={!!product}
          />
          {errors.code && <div className="invalid-feedback">{errors.code}</div>}
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="name" className="form-label">
            نام کالا <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        {/* گروه و واحد */}
        <div className="col-md-6 mb-3">
          <label htmlFor="categoryId" className="form-label">
            گروه کالا <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${errors.categoryId ? "is-invalid" : ""}`}
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
          >
            <option value="">انتخاب کنید</option>
            {renderOptions(categories)}
          </select>
          {errors.categoryId && (
            <div className="invalid-feedback">{errors.categoryId}</div>
          )}
          <div className="form-text">
            {categories.length === 0 && "در حال بارگذاری گروه‌ها..."}
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="unitId" className="form-label">
            واحد اندازه‌گیری <span className="text-danger">*</span>
          </label>
          <select
            className={`form-select ${errors.unitId ? "is-invalid" : ""}`}
            id="unitId"
            name="unitId"
            value={formData.unitId}
            onChange={handleChange}
            required
          >
            <option value="">انتخاب کنید</option>
            {renderOptions(units)}
          </select>
          {errors.unitId && (
            <div className="invalid-feedback">{errors.unitId}</div>
          )}
          <div className="form-text">
            {units.length === 0 && "در حال بارگذاری واحدها..."}
          </div>
        </div>

        {/* قیمت‌ها */}
        <div className="col-md-4 mb-3">
          <label htmlFor="defaultPurchasePrice" className="form-label">
            قیمت خرید پیش‌فرض
          </label>
          <input
            type="number"
            className={`form-control ${
              errors.defaultPurchasePrice ? "is-invalid" : ""
            }`}
            id="defaultPurchasePrice"
            name="defaultPurchasePrice"
            value={formData.defaultPurchasePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
          {errors.defaultPurchasePrice && (
            <div className="invalid-feedback">
              {errors.defaultPurchasePrice}
            </div>
          )}
        </div>

        <div className="col-md-4 mb-3">
          <label htmlFor="defaultSalePrice" className="form-label">
            قیمت فروش پیش‌فرض
          </label>
          <input
            type="number"
            className={`form-control ${
              errors.defaultSalePrice ? "is-invalid" : ""
            }`}
            id="defaultSalePrice"
            name="defaultSalePrice"
            value={formData.defaultSalePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
          {errors.defaultSalePrice && (
            <div className="invalid-feedback">{errors.defaultSalePrice}</div>
          )}
        </div>

        <div className="col-md-4 mb-3">
          <label htmlFor="defaultWholesalePrice" className="form-label">
            قیمت عمده‌فروشی
          </label>
          <input
            type="number"
            className="form-control"
            id="defaultWholesalePrice"
            name="defaultWholesalePrice"
            value={formData.defaultWholesalePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        {/* کنترل موجودی */}
        <div className="col-md-6 mb-3">
          <label htmlFor="minStock" className="form-label">
            حداقل موجودی
          </label>
          <input
            type="number"
            className={`form-control ${errors.minStock ? "is-invalid" : ""}`}
            id="minStock"
            name="minStock"
            value={formData.minStock}
            onChange={handleChange}
            min="0"
            step="0.001"
          />
          {errors.minStock && (
            <div className="invalid-feedback">{errors.minStock}</div>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="maxStock" className="form-label">
            حداکثر موجودی
          </label>
          <input
            type="number"
            className="form-control"
            id="maxStock"
            name="maxStock"
            value={formData.maxStock}
            onChange={handleChange}
            min="0"
            step="0.001"
          />
        </div>

        {/* حساب تفصیلی */}
        <div className="col-md-6 mb-3">
          <label htmlFor="detailAccountId" className="form-label">
            حساب تفصیلی مرتبط
          </label>
          <select
            className="form-select"
            id="detailAccountId"
            name="detailAccountId"
            value={formData.detailAccountId}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">انتخاب کنید (اختیاری)</option>
            {detailAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
                {account.subAccount && ` (${account.subAccount.code})`}
              </option>
            ))}
          </select>
          <div className="form-text">
            حساب‌های تفصیلی زیرمجموعه حساب کل "موجودی کالا و مواد (1-04)"
          </div>
        </div>

        {/* بارکد */}
        <div className="col-md-6 mb-3">
          <label htmlFor="barcode" className="form-label">
            بارکد
          </label>
          <input
            type="text"
            className="form-control"
            id="barcode"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
          />
        </div>

        {/* دکمه‌های فرم */}
        <div className="col-12 mt-4">
          <div className="d-flex justify-content-between">
            <button
              type="button"
              onClick={() => router.push("/inventory/products")}
              className="btn btn-outline-secondary"
              disabled={loading}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  در حال ثبت...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {product ? "ویرایش کالا" : "ثبت کالا"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
