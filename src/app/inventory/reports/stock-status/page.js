'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StockStatusReportPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    warehouseId: '',
    categoryId: '',
    showLowStock: false
  });

  useEffect(() => {
    loadDependencies();
  }, []);

  const loadDependencies = async () => {
    try {
      const [warehousesRes, categoriesRes] = await Promise.all([
        fetch('/api/inventory/warehouses'),
        fetch('/api/inventory/product-categories')
      ]);

      const [warehousesData, categoriesData] = await Promise.all([
        warehousesRes.json(),
        categoriesRes.json()
      ]);

      setWarehouses(warehousesData.warehouses || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.warehouseId) {
        params.append('warehouseId', filters.warehouseId);
      }
      
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      
      if (filters.showLowStock) {
        params.append('showLowStock', 'true');
      }
      
      const response = await fetch(`/api/inventory/reports/stock-status?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = (format) => {
    const params = new URLSearchParams();
    
    if (filters.warehouseId) {
      params.append('warehouseId', filters.warehouseId);
    }
    
    if (filters.categoryId) {
      params.append('categoryId', filters.categoryId);
    }
    
    window.open(`/api/inventory/reports/stock-status/export?${params}&format=${format}`, '_blank');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">گزارش موجودی انبار</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          بازگشت
        </button>
      </div>
      
      {/* فیلترها */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">انبار</label>
            <select
              value={filters.warehouseId}
              onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">همه انبارها</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">گروه کالا</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">همه گروه‌ها</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showLowStock}
                onChange={(e) => handleFilterChange('showLowStock', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">نمایش فقط کالاهای کم موجود</span>
            </label>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateReport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'در حال تولید...' : 'تولید گزارش'}
            </button>
          </div>
        </div>
      </div>
      
      {/* گزارش */}
      {report && (
        <>
          {/* آمار کلی */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">تعداد کالاها</div>
              <div className="text-2xl font-bold mt-1">{report.summary.totalItems}</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">کل تعداد</div>
              <div className="text-2xl font-bold mt-1">
                {report.summary.totalQuantity.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">ارزش کل</div>
              <div className="text-2xl font-bold mt-1">
                {report.summary.totalValue.toLocaleString()} ریال
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">کالاهای کم موجود</div>
              <div className="text-2xl font-bold mt-1 text-red-600">
                {report.summary.lowStockItems}
              </div>
            </div>
          </div>
          
          {/* جدول گزارش */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">جزئیات موجودی</h2>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  خروجی Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  خروجی PDF
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium">کد کالا</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">نام کالا</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">گروه</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">انبار</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">موجودی</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">واحد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">قیمت خرید</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">ارزش</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">حداقل</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.report.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{item.productCode}</span>
                      </td>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3">{item.category}</td>
                      <td className="px-4 py-3">{item.warehouse}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          item.isLowStock ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.unit}</td>
                      <td className="px-4 py-3">{item.unitPrice.toLocaleString()} ریال</td>
                      <td className="px-4 py-3 font-medium">{item.totalValue.toLocaleString()} ریال</td>
                      <td className="px-4 py-3">{item.minStock}</td>
                      <td className="px-4 py-3">
                        {item.isLowStock ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                            کمبود
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            مناسب
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}