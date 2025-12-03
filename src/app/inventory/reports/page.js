'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InventoryReportsPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalTransactions: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    try {
      const response = await fetch('/api/inventory/reports/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching report stats:', error);
    }
  };

  const reports = [
    {
      title: 'گزارش موجودی انبار',
      description: 'مشاهده موجودی کالاها در انبارهای مختلف',
      icon: '📦',
      href: '/inventory/reports/stock-status',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'گزارش گردش کالا',
      description: 'گزارش خرید، فروش و گردش کالاها',
      icon: '🔄',
      href: '/inventory/reports/inventory-turnover',
      color: 'bg-green-100 text-green-700'
    },
    {
      title: 'گزارش کاردکس',
      description: 'سابقه ورود و خروج کالاها به تفکیک انبار',
      icon: '📋',
      href: '/inventory/reports/stock-movement',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      title: 'کالاهای کم موجود',
      description: 'لیست کالاهایی که موجودی آنها به حداقل رسیده',
      icon: '⚠️',
      href: '/inventory/reports/low-stock',
      color: 'bg-red-100 text-red-700'
    },
    {
      title: 'گزارش ارزش موجودی',
      description: 'ارزش ریالی موجودی کالاها در انبار',
      icon: '💰',
      href: '/inventory/reports/inventory-value',
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      title: 'گزارش کالاهای راکد',
      description: 'کالاهایی که در بازه زمانی مشخص حرکتی نداشته‌اند',
      icon: '📉',
      href: '/inventory/reports/slow-moving',
      color: 'bg-gray-100 text-gray-700'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">گزارشات انبار</h1>
      
      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">تعداد کالاها</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">تعداد انبارها</p>
              <p className="text-2xl font-bold">{stats.totalWarehouses}</p>
            </div>
            <div className="text-3xl">🏪</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">تعداد تراکنش‌ها</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">ارزش کل موجودی</p>
              <p className="text-2xl font-bold">{stats.totalValue.toLocaleString()} ریال</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>
      
      {/* گزارشات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => (
          <Link
            key={index}
            href={report.href}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start">
              <div className={`p-3 rounded-lg ${report.color} mr-4`}>
                <span className="text-2xl">{report.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">{report.title}</h3>
                <p className="text-gray-600 text-sm">{report.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* گزارشات سریع */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">گزارشات سریع</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/api/inventory/reports/stock-status/export?format=excel"
            className="bg-white p-4 rounded-lg shadow hover:bg-gray-50 flex items-center justify-between"
          >
            <span>خروجی Excel موجودی</span>
            <span>📥</span>
          </a>
          <a
            href="/api/inventory/reports/inventory-value/export?format=pdf"
            className="bg-white p-4 rounded-lg shadow hover:bg-gray-50 flex items-center justify-between"
          >
            <span>خروجی PDF ارزش</span>
            <span>📄</span>
          </a>
          <a
            href="/api/inventory/reports/transactions/export?format=csv"
            className="bg-white p-4 rounded-lg shadow hover:bg-gray-50 flex items-center justify-between"
          >
            <span>خروجی CSV تراکنش‌ها</span>
            <span>📊</span>
          </a>
        </div>
      </div>
    </div>
  );
}