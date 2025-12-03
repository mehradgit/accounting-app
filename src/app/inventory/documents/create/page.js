'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InventoryDocumentForm from '@/components/forms/InventoryDocumentForm';

export default function CreateInventoryDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [defaultType, setDefaultType] = useState('');

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setDefaultType(type);
    }
  }, [searchParams]);

  const handleSuccess = () => {
    router.push('/inventory/documents');
    router.refresh();
  };

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/dashboard" className="text-decoration-none">
              <i className="bi bi-house-door me-1"></i>
              داشبورد
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/inventory" className="text-decoration-none">
              <i className="bi bi-archive me-1"></i>
              انبار
            </a>
          </li>
          <li className="breadcrumb-item">
            <a href="/inventory/documents" className="text-decoration-none">
              <i className="bi bi-file-earmark-text me-1"></i>
              اسناد انبار
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-plus-circle me-1"></i>
            ثبت سند جدید
          </li>
        </ol>
      </nav>

      {/* Main Header */}
      <div className="row align-items-center mb-4">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-gradient p-3 rounded-3 me-3">
              <i className="bi bi-file-earmark-plus text-white fs-4"></i>
            </div>
            <div>
              <h1 className="h3 fw-bold mb-1">ثبت سند انبار جدید</h1>
              <p className="text-muted mb-0">فرم ثبت اطلاعات سند ورود/خروج انبار</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-end gap-2">
            <button
              onClick={() => router.push('/inventory/documents')}
              className="btn btn-outline-secondary d-flex align-items-center"
            >
              <i className="bi bi-arrow-right me-2"></i>
              بازگشت به لیست
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-light border d-flex align-items-center"
              title="بارگذاری مجدد"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="steps">
                <div className="step-item active">
                  <div className="step-progress">
                    <span className="step-count">1</span>
                  </div>
                  <div className="step-label">
                    <small className="text-muted">مرحله اول</small>
                    <div className="fw-medium">اطلاعات سند</div>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-progress">
                    <span className="step-count">2</span>
                  </div>
                  <div className="step-label">
                    <small className="text-muted">مرحله دوم</small>
                    <div className="fw-medium">انتخاب کالاها</div>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-progress">
                    <span className="step-count">3</span>
                  </div>
                  <div className="step-label">
                    <small className="text-muted">مرحله سوم</small>
                    <div className="fw-medium">تایید نهایی</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="row">
        <div className="col-12 col-lg-10 col-xl-8 mx-auto">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-white py-4 border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title fw-bold mb-1">
                    <i className="bi bi-pencil-square text-primary me-2"></i>
                    فرم اطلاعات سند انبار
                  </h5>
                  <p className="text-muted small mb-0">
                    لطفاً تمامی فیلدهای ضروری (<span className="text-danger">*</span>) را تکمیل نمایید
                  </p>
                </div>
                <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                  <i className="bi bi-clock-history me-1"></i>
                  تکمیل در ۵ دقیقه
                </div>
              </div>
            </div>
            
            <div className="card-body p-4 p-md-5">
              <InventoryDocumentForm 
                onSuccess={handleSuccess}
                defaultType={defaultType}
              />
            </div>
            
            <div className="card-footer bg-light py-3 border-top">
              <div className="row align-items-center">
                <div className="col-md-6 mb-2 mb-md-0">
                  <div className="d-flex align-items-center">
                    <div className="text-success me-2">
                      <i className="bi bi-shield-check fs-5"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">اطلاعات شما امن است</small>
                      <small className="fw-medium">رمزنگاری شده و محافظت می‌شود</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/inventory/documents')}
                      className="btn btn-outline-danger px-4 d-flex align-items-center"
                    >
                      <i className="bi bi-x-lg me-2"></i>
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="row mt-4">
        <div className="col-md-4 mb-3">
          <div className="card border-0 bg-light h-100">
            <div className="card-body">
              <div className="d-flex">
                <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                  <i className="bi bi-lightbulb text-warning fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-2">انتخاب نوع سند</h6>
                  <p className="text-muted small mb-0">
                    نوع سند را با توجه به اثر آن بر موجودی انبار (افزایش یا کاهش) انتخاب کنید.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 bg-light h-100">
            <div className="card-body">
              <div className="d-flex">
                <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                  <i className="bi bi-info-circle text-info fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-2">تعداد و قیمت کالاها</h6>
                  <p className="text-muted small mb-0">
                    تعداد کالاها را با دقت وارد کنید. قیمت واحد به صورت ریال محاسبه می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card border-0 bg-light h-100">
            <div className="card-body">
              <div className="d-flex">
                <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                  <i className="bi bi-question-circle text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-2">پشتیبانی</h6>
                  <p className="text-muted small mb-0">
                    در صورت نیاز به راهنمایی بیشتر، با واحد فنی تماس بگیرید.
                    <a href="#" className="text-decoration-none d-block mt-1">
                      <i className="bi bi-headset me-1"></i>
                      تماس با پشتیبانی
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS برای Steps */}
      <style jsx>{`
        .steps {
          display: flex;
          justify-content: space-between;
          position: relative;
        }
        .steps::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #e9ecef;
          z-index: 1;
        }
        .step-item {
          position: relative;
          z-index: 2;
          text-align: center;
          flex: 1;
        }
        .step-progress {
          width: 40px;
          height: 40px;
          margin: 0 auto 10px;
          background-color: #fff;
          border: 2px solid #e9ecef;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .step-item.active .step-progress {
          border-color: #0d6efd;
          background-color: #0d6efd;
        }
        .step-count {
          font-size: 14px;
          font-weight: 600;
          color: #6c757d;
        }
        .step-item.active .step-count {
          color: #fff;
        }
        .step-label small {
          font-size: 12px;
        }
        .step-item.active .step-label div {
          color: #0d6efd;
        }
        @media (max-width: 768px) {
          .steps {
            flex-direction: column;
            gap: 20px;
          }
          .steps::before {
            display: none;
          }
          .step-item {
            display: flex;
            align-items-center;
            text-align: right;
          }
          .step-progress {
            margin: 0 15px 0 0;
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  );
}