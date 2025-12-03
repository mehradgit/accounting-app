'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UnitsPage() {
  const router = useRouter();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/units');
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این واحد اطمینان دارید؟\nتوجه: کالاهایی که از این واحد استفاده می‌کنند باید تغییر کنند.')) return;
    
    try {
      const response = await fetch(`/api/inventory/units/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('واحد با موفقیت حذف شد');
        fetchUnits();
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در حذف واحد');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('خطا در حذف واحد');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت واحدهای اندازه‌گیری</h1>
        <Link
          href="/inventory/units/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          افزودن واحد جدید
        </Link>
      </div>
      
      {/* جدول واحدها */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">در حال بارگذاری...</div>
        ) : units.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            واحدی یافت نشد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium">کد</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">نام</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">توضیحات</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">تعداد کالاها</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                        {unit.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{unit.name}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate" title={unit.description}>
                        {unit.description || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {unit._count?.products || 0} کالا
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2 space-x-reverse">
                        <Link
                          href={`/inventory/units/${unit.id}`}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                        >
                          ویرایش
                        </Link>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}