// src/app/inventory/documents/production-consumption/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductionConsumptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  const [formData, setFormData] = useState({
    productionOrderId: "",
    warehouseId: "",
    productId: "",
    description: "",
    materials: [], // { productId, quantity, unitPrice, description }
  });

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/inventory/warehouses");
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      } else {
        console.error('Failed to fetch warehouses:', response.status);
        setWarehouses([]);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setWarehouses([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/inventory/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.materials.length === 0) {
      alert("حداقل یک ماده اولیه باید اضافه شود");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/inventory/documents/production-consumption",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productionOrderId: formData.productionOrderId,
            warehouseId: parseInt(formData.warehouseId),
            productId: parseInt(formData.productId),
            rawMaterials: formData.materials,
            description: formData.description,
            createVoucher: true,
          }),
        }
      );

      if (response.ok) {
        alert("مصرف تولید با موفقیت ثبت شد");
        router.push("/inventory/documents");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ثبت مصرف تولید");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("خطا در ثبت مصرف تولید");
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          productId: "",
          quantity: 0,
          unitPrice: 0,
          description: "",
        },
      ],
    }));
  };

  const removeMaterial = (index) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const updateMaterial = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index][field] = value;
    setFormData((prev) => ({ ...prev, materials: newMaterials }));
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="h2 mb-4">ثبت مصرف مواد اولیه در تولید</h1>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">شماره دستور تولید</label>
              <input
                type="text"
                className="form-control"
                value={formData.productionOrderId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productionOrderId: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">انبار خط تولید</label>
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
              >
                <option value="">انتخاب کنید</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">محصول نهایی</label>
              <select
                className="form-select"
                value={formData.productId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productId: e.target.value,
                  }))
                }
                required
              >
                <option value="">انتخاب کنید</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">توضیحات</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* مواد اولیه */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">مواد اولیه مصرفی</h5>
              <button
                type="button"
                onClick={addMaterial}
                className="btn btn-sm btn-primary"
              >
                افزودن ماده اولیه
              </button>
            </div>
          </div>

          <div className="card-body">
            {formData.materials.length === 0 ? (
              <div className="text-center py-4 text-muted">
                هنوز ماده اولیه‌ای اضافه نشده است
              </div>
            ) : (
              formData.materials.map((material, index) => (
                <div key={index} className="border p-3 mb-3 rounded">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">ماده اولیه</label>
                      <select
                        className="form-select"
                        value={material.productId}
                        onChange={(e) =>
                          updateMaterial(index, "productId", e.target.value)
                        }
                        required
                      >
                        <option value="">انتخاب کنید</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label">مقدار</label>
                      <input
                        type="number"
                        className="form-control"
                        value={material.quantity}
                        onChange={(e) =>
                          updateMaterial(
                            index,
                            "quantity",
                            parseFloat(e.target.value)
                          )
                        }
                        min="0.001"
                        step="0.001"
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">قیمت واحد (ریال)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={material.unitPrice}
                        onChange={(e) =>
                          updateMaterial(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value)
                          )
                        }
                        min="0"
                        step="1000"
                        required
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label">مبلغ کل</label>
                      <div className="form-control-plaintext">
                        {(
                          material.quantity * material.unitPrice
                        ).toLocaleString()}{" "}
                        ریال
                      </div>
                    </div>

                    <div className="col-md-1">
                      <label className="form-label">&nbsp;</label>
                      <button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        className="btn btn-danger w-100"
                      >
                        حذف
                      </button>
                    </div>

                    <div className="col-12">
                      <label className="form-label">توضیحات</label>
                      <input
                        type="text"
                        className="form-control"
                        value={material.description}
                        onChange={(e) =>
                          updateMaterial(index, "description", e.target.value)
                        }
                        placeholder="توضیحات مصرف"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* جمع کل */}
            {formData.materials.length > 0 && (
              <div className="border-top pt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fs-5">جمع کل:</span>
                  <span className="fs-4 fw-bold text-primary">
                    {formData.materials
                      .reduce(
                        (sum, material) =>
                          sum + material.quantity * material.unitPrice,
                        0
                      )
                      .toLocaleString()}{" "}
                    ریال
                  </span>
                </div>
              </div>
            )}
          </div>
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
            className="btn btn-primary"
            disabled={loading || formData.materials.length === 0}
          >
            {loading ? "در حال ثبت..." : "ثبت مصرف تولید"}
          </button>
        </div>
      </form>
    </div>
  );
}
