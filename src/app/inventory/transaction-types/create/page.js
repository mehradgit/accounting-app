// src/app/inventory/transaction-types/create/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateTransactionTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    effect: 'increase',
    description: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // حذف خطا برای فیلد مربوطه
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.code.trim()) {
      errors.code = 'کد نوع تراکنش الزامی است';
    } else if (formData.code.trim().length < 2) {
      errors.code = 'کد باید حداقل ۲ کاراکتر باشد';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'نام نوع تراکنش الزامی است';
    }
    
    if (!formData.effect) {
      errors.effect = 'انتخاب اثر تراکنش الزامی است';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/inventory/transaction-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          effect: formData.effect,
          description: formData.description.trim()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('نوع تراکنش با موفقیت ایجاد شد');
        router.push('/inventory/transaction-types');
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در ایجاد نوع تراکنش');
      }
    } catch (error) {
      console.error('Error creating transaction type:', error);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/dashboard" className="text-decoration-none">
              <i className="bi bi-house-door me-1"></i>
              داشبورد
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/inventory" className="text-decoration-none">
              <i className="bi bi-archive me-1"></i>
              انبار
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/inventory/transaction-types" className="text-decoration-none">
              <i className="bi bi-arrow-left-right me-1"></i>
              انواع اسناد انبار
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            <i className="bi bi-plus-circle me-1"></i>
            افزودن نوع جدید
          </li>
        </ol>
      </nav>

      {/* Main Header */}
      <div className="row align-items-center mb-4">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-gradient p-3 rounded-3 me-3">
              <i className="bi bi-plus-circle text-white fs-4"></i>
            </div>
            <div>
              <h1 className="h3 fw-bold mb-1">افزودن نوع تراکنش جدید</h1>
              <p className="text-muted mb-0">فرم ثبت نوع جدید تراکنش انبار</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-end gap-2">
            <button
              onClick={() => router.push('/inventory/transaction-types')}
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
                    <div className="fw-medium">اطلاعات پایه</div>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-progress">
                    <span className="step-count">2</span>
                  </div>
                  <div className="step-label">
                    <small className="text-muted">مرحله دوم</small>
                    <div className="fw-medium">تنظیمات اثر</div>
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
        <div className="col-12 col-lg-8 col-xl-6 mx-auto">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-white py-4 border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="card-title fw-bold mb-1">
                    <i className="bi bi-pencil-square text-primary me-2"></i>
                    فرم اطلاعات نوع تراکنش
                  </h5>
                  <p className="text-muted small mb-0">
                    لطفاً تمامی فیلدهای ضروری (<span className="text-danger">*</span>) را تکمیل نمایید
                  </p>
                </div>
                <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                  <i className="bi bi-clock-history me-1"></i>
                  تکمیل در ۲ دقیقه
                </div>
              </div>
            </div>
            
            <div className="card-body p-4 p-md-5">
              {/* Display error message */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  {/* کد */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="code" className="form-label">
                        کد نوع تراکنش <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.code ? 'is-invalid' : ''}`}
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="مثال: PUR یا SAL"
                        required
                      />
                      {formErrors.code && (
                        <div className="invalid-feedback">{formErrors.code}</div>
                      )}
                      <div className="form-text">
                        کد منحصر به فرد برای شناسایی نوع تراکنش (حداقل ۲ کاراکتر)
                      </div>
                    </div>
                  </div>

                  {/* نام */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">
                        نام نوع تراکنش <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="مثال: خرید یا فروش"
                        required
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback">{formErrors.name}</div>
                      )}
                      <div className="form-text">
                        نام فارسی کامل نوع تراکنش
                      </div>
                    </div>
                  </div>

                  {/* اثر */}
                  <div className="col-12">
                    <div className="mb-4">
                      <label htmlFor="effect" className="form-label">
                        اثر تراکنش <span className="text-danger">*</span>
                      </label>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className={`card border ${formData.effect === 'increase' ? 'border-success border-2' : 'border-light'}`}>
                            <div className="card-body text-center p-4 cursor-pointer" onClick={() => setFormData(prev => ({...prev, effect: 'increase'}))}>
                              <div className="mb-3">
                                <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block">
                                  <i className="bi bi-plus-circle text-success fs-3"></i>
                                </div>
                              </div>
                              <h5 className="fw-bold">افزایش موجودی</h5>
                              <p className="text-muted small mb-0">
                                این نوع تراکنش باعث افزایش موجودی انبار می‌شود
                              </p>
                              <div className="mt-3">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="effect"
                                    id="effectIncrease"
                                    value="increase"
                                    checked={formData.effect === 'increase'}
                                    onChange={handleChange}
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="effectIncrease">
                                    انتخاب
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className={`card border ${formData.effect === 'decrease' ? 'border-danger border-2' : 'border-light'}`}>
                            <div className="card-body text-center p-4 cursor-pointer" onClick={() => setFormData(prev => ({...prev, effect: 'decrease'}))}>
                              <div className="mb-3">
                                <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-inline-block">
                                  <i className="bi bi-dash-circle text-danger fs-3"></i>
                                </div>
                              </div>
                              <h5 className="fw-bold">کاهش موجودی</h5>
                              <p className="text-muted small mb-0">
                                این نوع تراکنش باعث کاهش موجودی انبار می‌شود
                              </p>
                              <div className="mt-3">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="effect"
                                    id="effectDecrease"
                                    value="decrease"
                                    checked={formData.effect === 'decrease'}
                                    onChange={handleChange}
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="effectDecrease">
                                    انتخاب
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {formErrors.effect && (
                        <div className="invalid-feedback d-block">{formErrors.effect}</div>
                      )}
                      <div className="form-text mt-2">
                        انتخاب دقیق اثر تراکنش بسیار مهم است زیرا بر موجودی انبار تأثیر می‌گذارد
                      </div>
                    </div>
                  </div>

                  {/* توضیحات */}
                  <div className="col-12">
                    <div className="mb-4">
                      <label htmlFor="description" className="form-label">
                        توضیحات
                      </label>
                      <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="توضیحات اضافی درباره این نوع تراکنش..."
                      />
                      <div className="form-text">
                        هر گونه توضیح اضافی درباره شرایط و کاربرد این نوع تراکنش
                      </div>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div className="alert alert-light border mt-4">
                  <h6 className="alert-heading mb-3">
                    <i className="bi bi-lightbulb me-2"></i>
                    مثال‌های رایج
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="d-flex mb-2">
                        <span className="badge bg-success me-2">PUR</span>
                        <div>
                          <div className="fw-medium">خرید</div>
                          <small className="text-muted">افزایش موجودی - خرید از تامین کننده</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex mb-2">
                        <span className="badge bg-danger me-2">SAL</span>
                        <div>
                          <div className="fw-medium">فروش</div>
                          <small className="text-muted">کاهش موجودی - فروش به مشتری</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex mb-2">
                        <span className="badge bg-success me-2">RET-IN</span>
                        <div>
                          <div className="fw-medium">برگشت از فروش</div>
                          <small className="text-muted">افزایش موجودی - برگشت کالا از مشتری</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex mb-2">
                        <span className="badge bg-danger me-2">RET-OUT</span>
                        <div>
                          <div className="fw-medium">برگشت از خرید</div>
                          <small className="text-muted">کاهش موجودی - برگشت کالا به تامین کننده</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    onClick={() => router.push('/inventory/transaction-types')}
                    className="btn btn-outline-secondary px-4 d-flex align-items-center"
                    disabled={loading}
                  >
                    <i className="bi bi-x-lg me-2"></i>
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-flex align-items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        در حال ثبت...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        ثبت نوع تراکنش
                      </>
                    )}
                  </button>
                </div>
              </form>
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
                  <div className="text-end">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      پس از ثبت، می‌توانید این نوع را در اسناد انبار استفاده کنید
                    </small>
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
                  <h6 className="fw-bold mb-2">راهنمایی کدگذاری</h6>
                  <p className="text-muted small mb-0">
                    از کدهای مختصر و معنادار استفاده کنید. پیشنهاد می‌شود از حروف انگلیسی استفاده شود.
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
                  <h6 className="fw-bold mb-2">انتخاب اثر صحیح</h6>
                  <p className="text-muted small mb-0">
                    اثر تراکنش را با دقت انتخاب کنید زیرا بر موجودی انبار تأثیر مستقیم دارد.
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
                    <Link href="#" className="text-decoration-none d-block mt-1">
                      <i className="bi bi-headset me-1"></i>
                      تماس با پشتیبانی
                    </Link>
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
        .cursor-pointer {
          cursor: pointer;
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