'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import UnitForm from '@/components/forms/UnitForm';

export default function EditUnitPage() {
  const router = useRouter();
  const params = useParams();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchUnit();
    }
  }, [params.id]);

  const fetchUnit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/units/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setUnit(data);
      } else {
        router.push('/inventory/units');
      }
    } catch (error) {
      console.error('Error fetching unit:', error);
      router.push('/inventory/units');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/inventory/units');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ویرایش واحد</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          بازگشت
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        {unit && <UnitForm initialData={unit} onSuccess={handleSuccess} />}
      </div>
    </div>
  );
}