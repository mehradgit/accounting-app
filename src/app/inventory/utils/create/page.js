'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UnitForm from '@/components/forms/UnitForm';

export default function CreateUnitPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/inventory/units');
    router.refresh();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">افزودن واحد جدید</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          بازگشت
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <UnitForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}