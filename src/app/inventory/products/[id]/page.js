'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm from '@/components/forms/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/products/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        router.push('/inventory/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      router.push('/inventory/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/inventory/products');
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
        <h1 className="text-2xl font-bold">ویرایش کالا</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          بازگشت
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        {product && <ProductForm initialData={product} onSuccess={handleSuccess} />}
      </div>
    </div>
  );
}