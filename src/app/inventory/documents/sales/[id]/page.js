"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import PrintInvoice from "@/components/ui/PrintInvoice"; // ایمپورت کامپوننت پرینت
import Link from "next/link";

export default function SalesInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [accountNames, setAccountNames] = useState({});
  const printRef = useRef(); // اضافه کردن ref برای پرینت
  useEffect(() => {
    if (params.id) {
      fetchInvoiceData();
    }
  }, [params.id]);
  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاکتور فروش - ${
          data?.document?.referenceNumber || data?.document?.documentNumber
        }</title>
        <link rel="stylesheet" href="/styles/print.css">
        <style>
          body { font-family: 'Vazirmatn', Tahoma, sans-serif; }
          @page { size: A4 portrait; margin: 15mm; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${printRef.current.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // تأخیر برای بارگذاری فونت‌ها
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/inventory/documents/sales/${params.id}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result);
          // دریافت نام حساب‌ها
          fetchAccountNames(result);
        } else {
          setError(result.error || "خطا در دریافت اطلاعات");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "خطا در دریافت اطلاعات");
      }
    } catch (error) {
      console.error("خطا در دریافت فاکتور:", error);
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountNames = async (result) => {
    try {
      const names = {};

      if (result.payment?.details?.cash?.accountId) {
        const res = await fetch(
          `/api/detail-accounts/${result.payment.details.cash.accountId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            names.cashAccount = data.detailAccount?.name || "نامشخص";
          }
        }
      }

      if (result.payment?.details?.chequeAccountId) {
        const res = await fetch(
          `/api/accounts/${result.payment.details.chequeAccountId}`
        );
        if (res.ok) {
          const data = await res.json();
          names.chequeAccount = data.subAccount?.name || "نامشخص";
        }
      }

      if (result.payment?.details?.transfer?.bankAccountId) {
        const res = await fetch(
          `/api/detail-accounts/${result.payment.details.transfer.bankAccountId}`
        );
        if (res.ok) {
          const data = await res.json();
          names.bankAccount = data.detailAccount?.name || "نامشخص";
        }
      }

      setAccountNames(names);
    } catch (error) {
      console.error("خطا در دریافت نام حساب‌ها:", error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "۰ ریال";
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "ندارد";
    try {
      return new Date(dateString).toLocaleDateString("fa-IR");
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      cash: "نقدی",
      cheque: "چکی",
      transfer: "حواله بانکی",
      credit: "نسیه",
      combined: "ترکیبی",
      unknown: "نامشخص",
    };
    return methods[method] || method;
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      cash: "success",
      cheque: "warning",
      transfer: "info",
      credit: "danger",
      combined: "primary",
      unknown: "secondary",
    };
    return colors[method] || "secondary";
  };

  const calculatePercentage = (part, total) => {
    if (!total || total <= 0) return 0;
    return (part / total) * 100;
  };

  // تابع برای نمایش جزئیات پرداخت ترکیبی
  const renderCombinedPaymentDetails = () => {
    if (!data?.payment?.distribution || data.payment.method !== "combined")
      return null;

    const { distribution, summary, details } = data.payment;
    const hasCombinedPayment =
      summary.cash > 0 || summary.cheque > 0 || summary.transfer > 0;

    if (!hasCombinedPayment) return null;
    return (
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-credit-card me-2"></i>
            جزئیات پرداخت ترکیبی
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* نقدی */}
            {summary.cash > 0 && (
              <div className="col-md-6 mb-3">
                <div className="card border-success h-100">
                  <div className="card-header bg-success bg-opacity-10">
                    <h6 className="mb-0">💰 نقدی</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fs-5">مبلغ:</span>
                      <span className="fs-4 fw-bold text-success">
                        {formatCurrency(summary.cash)}
                      </span>
                    </div>

                    {/* درصد از کل */}
                    {summary.totalAmount > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">
                          {calculatePercentage(
                            summary.cash,
                            summary.totalAmount
                          ).toFixed(1)}
                          % از کل
                        </small>
                      </div>
                    )}

                    {/* حساب صندوق */}
                    {details.cash?.accountName && (
                      <div className="mt-3">
                        <small className="text-muted d-block">
                          حساب صندوق:
                        </small>
                        <div className="fw-bold">
                          {details.cash.accountName}
                        </div>
                      </div>
                    )}

                    <div className="mt-3">
                      <span className="badge bg-success">تسویه شده</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* چک */}
            {summary.cheque > 0 && (
              <div className="col-md-6 mb-3">
                <div className="card border-warning h-100">
                  <div className="card-header bg-warning bg-opacity-10">
                    <h6 className="mb-0">
                      🧾 چک (
                      {distribution.cheque?.cheques?.length ||
                        details.cheques?.length ||
                        0}{" "}
                      فقره)
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fs-5">مبلغ کل:</span>
                      <span className="fs-4 fw-bold text-warning">
                        {formatCurrency(summary.cheque)}
                      </span>
                    </div>

                    {/* درصد از کل */}
                    {summary.totalAmount > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">
                          {calculatePercentage(
                            summary.cheque,
                            summary.totalAmount
                          ).toFixed(1)}
                          % از کل
                        </small>
                      </div>
                    )}

                    {/* حساب چک‌های وارده */}
                    {(details.chequeAccountName ||
                      accountNames.chequeAccount) && (
                      <div className="mt-2 small">
                        <span className="text-muted">حساب چک‌های وارده:</span>
                        <span className="ms-1 fw-bold">
                          {details.chequeAccountName ||
                            accountNames.chequeAccount}
                        </span>
                      </div>
                    )}

                    {/* لیست چک‌ها */}
                    {(distribution.cheque?.cheques || details.cheques) &&
                      (distribution.cheque?.cheques?.length > 0 ||
                        details.cheques?.length > 0) && (
                        <div className="mt-3">
                          <small className="text-muted d-block mb-2">
                            جزئیات چک‌ها:
                          </small>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                              <thead>
                                <tr>
                                  <th>ردیف</th>
                                  <th>شماره چک</th>
                                  <th>بانک</th>
                                  <th>مبلغ</th>
                                  <th>سررسید</th>
                                  <th>وضعیت</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(
                                  distribution.cheque?.cheques ||
                                  details.cheques
                                ).map((cheque, index) => (
                                  <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>
                                      <span className="badge bg-light text-dark">
                                        {cheque.chequeNumber || "بدون شماره"}
                                      </span>
                                    </td>
                                    <td>{cheque.bankName || "نامشخص"}</td>
                                    <td>{formatCurrency(cheque.amount)}</td>
                                    <td>{formatDate(cheque.dueDate)}</td>
                                    <td>
                                      <span
                                        className={`badge bg-${
                                          cheque.status === "pending"
                                            ? "warning"
                                            : "success"
                                        }`}
                                      >
                                        {cheque.status === "pending"
                                          ? "در جریان"
                                          : "وصول شده"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    <div className="mt-2">
                      <span className="badge bg-warning">در جریان وصول</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* حواله */}
            {summary.transfer > 0 && (
              <div className="col-md-6 mb-3">
                <div className="card border-info h-100">
                  <div className="card-header bg-info bg-opacity-10">
                    <h6 className="mb-0">🏦 حواله بانکی</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fs-5">مبلغ:</span>
                      <span className="fs-4 fw-bold text-info">
                        {formatCurrency(summary.transfer)}
                      </span>
                    </div>

                    {/* درصد از کل */}
                    {summary.totalAmount > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">
                          {calculatePercentage(
                            summary.transfer,
                            summary.totalAmount
                          ).toFixed(1)}
                          % از کل
                        </small>
                      </div>
                    )}

                    {/* اطلاعات حساب بانک */}
                    {(details.transfer?.bankAccountName ||
                      accountNames.bankAccount) && (
                      <div className="mt-2">
                        <small className="text-muted d-block">حساب بانک:</small>
                        <div className="fw-bold">
                          {details.transfer?.bankAccountName ||
                            accountNames.bankAccount}
                        </div>
                      </div>
                    )}

                    {/* اطلاعات حواله */}
                    <div className="mt-3">
                      {details.transfer?.description && (
                        <div className="alert alert-light p-2 small mb-2">
                          <strong>شرح:</strong> {details.transfer.description}
                        </div>
                      )}

                      {details.transfer?.trackingNumber && (
                        <div className="small mb-1">
                          <span className="text-muted">شماره پیگیری:</span>
                          <span className="fw-bold ms-1">
                            {details.transfer.trackingNumber}
                          </span>
                        </div>
                      )}

                      {details.transfer?.transferDate && (
                        <div className="small mb-1">
                          <span className="text-muted">تاریخ حواله:</span>
                          <span className="ms-1">
                            {formatDate(details.transfer.transferDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <span className="badge bg-info">در حال انتقال</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* نسیه */}
            {summary.credit > 0 && (
              <div className="col-md-6 mb-3">
                <div className="card border-danger h-100">
                  <div className="card-header bg-danger bg-opacity-10">
                    <h6 className="mb-0">📝 نسیه (باقیمانده)</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fs-5">مبلغ:</span>
                      <span className="fs-4 fw-bold text-danger">
                        {formatCurrency(summary.credit)}
                      </span>
                    </div>

                    {/* درصد از کل */}
                    {summary.totalAmount > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">
                          {calculatePercentage(
                            summary.credit,
                            summary.totalAmount
                          ).toFixed(1)}
                          % از کل
                        </small>
                      </div>
                    )}

                    <div className="alert alert-warning mt-3 p-2 small">
                      <i className="bi bi-info-circle me-1"></i>
                      این مبلغ به صورت نسیه در حساب مشتری باقی می‌ماند.
                    </div>

                    <div className="mt-2">
                      <span className="badge bg-danger">باقیمانده</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* خلاصه پرداخت‌ها */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-dark">
                <div className="card-header bg-dark bg-opacity-10">
                  <h6 className="mb-0">📊 خلاصه پرداخت‌ها</h6>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr className="table-light">
                          <th>روش پرداخت</th>
                          <th>مبلغ (ریال)</th>
                          <th>درصد از کل</th>
                          <th>وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.cash > 0 && (
                          <tr>
                            <td>💰 نقدی</td>
                            <td className="fw-bold">
                              {formatCurrency(summary.cash)}
                            </td>
                            <td>
                              {summary.totalAmount > 0
                                ? calculatePercentage(
                                    summary.cash,
                                    summary.totalAmount
                                  ).toFixed(1) + "%"
                                : "0%"}
                            </td>
                            <td>
                              <span className="badge bg-success">
                                تسویه شده
                              </span>
                            </td>
                          </tr>
                        )}

                        {summary.cheque > 0 && (
                          <tr>
                            <td>🧾 چک</td>
                            <td className="fw-bold">
                              {formatCurrency(summary.cheque)}
                            </td>
                            <td>
                              {summary.totalAmount > 0
                                ? calculatePercentage(
                                    summary.cheque,
                                    summary.totalAmount
                                  ).toFixed(1) + "%"
                                : "0%"}
                            </td>
                            <td>
                              <span className="badge bg-warning">
                                در جریان وصول
                              </span>
                            </td>
                          </tr>
                        )}

                        {summary.transfer > 0 && (
                          <tr>
                            <td>🏦 حواله</td>
                            <td className="fw-bold">
                              {formatCurrency(summary.transfer)}
                            </td>
                            <td>
                              {summary.totalAmount > 0
                                ? calculatePercentage(
                                    summary.transfer,
                                    summary.totalAmount
                                  ).toFixed(1) + "%"
                                : "0%"}
                            </td>
                            <td>
                              <span className="badge bg-info">
                                در حال انتقال
                              </span>
                            </td>
                          </tr>
                        )}

                        {summary.credit > 0 && (
                          <tr className="table-warning">
                            <td>📝 نسیه</td>
                            <td className="fw-bold">
                              {formatCurrency(summary.credit)}
                            </td>
                            <td>
                              {summary.totalAmount > 0
                                ? calculatePercentage(
                                    summary.credit,
                                    summary.totalAmount
                                  ).toFixed(1) + "%"
                                : "0%"}
                            </td>
                            <td>
                              <span className="badge bg-danger">باقیمانده</span>
                            </td>
                          </tr>
                        )}

                        <tr className="table-primary">
                          <td className="fw-bold">جمع کل</td>
                          <td className="fw-bold fs-5">
                            {formatCurrency(summary.totalAmount)}
                          </td>
                          <td className="fw-bold fs-5">100%</td>
                          <td>
                            <span className="badge bg-primary">
                              {formatCurrency(summary.totalPaid)} پرداخت شده
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* نوار پیشرفت */}
                  {summary.totalAmount > 0 && (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>وضعیت تسویه:</span>
                        <span>
                          {calculatePercentage(
                            summary.totalPaid,
                            summary.totalAmount
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{
                            width: `${calculatePercentage(
                              summary.cash,
                              summary.totalAmount
                            )}%`,
                          }}
                          title="نقدی"
                        ></div>
                        <div
                          className="progress-bar bg-warning"
                          role="progressbar"
                          style={{
                            width: `${calculatePercentage(
                              summary.cheque,
                              summary.totalAmount
                            )}%`,
                          }}
                          title="چک"
                        ></div>
                        <div
                          className="progress-bar bg-info"
                          role="progressbar"
                          style={{
                            width: `${calculatePercentage(
                              summary.transfer,
                              summary.totalAmount
                            )}%`,
                          }}
                          title="حواله"
                        ></div>
                        <div
                          className="progress-bar bg-danger"
                          role="progressbar"
                          style={{
                            width: `${calculatePercentage(
                              summary.credit,
                              summary.totalAmount
                            )}%`,
                          }}
                          title="نسیه"
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این فاکتور اطمینان دارید؟")) return;

    try {
      const response = await fetch(
        `/api/inventory/documents/sales/${params.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert("فاکتور با موفقیت حذف شد");
          router.push("/inventory/documents/sales-list");
        } else {
          alert(result.error || "خطا در حذف فاکتور");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "خطا در حذف فاکتور");
      }
    } catch (error) {
      console.error("خطا در حذف فاکتور:", error);
      alert("خطا در حذف فاکتور");
    }
  };
  const getCustomerName = () => {
    // اولویت ۱: نام از detailAccount مستقیماً
    if (data?.document?.detailAccount?.name) {
      console.log(
        "✅ نام مشتری از InventoryDocument.detailAccount:",
        data.document.detailAccount.name
      );
      return data.document.detailAccount.name;
    }

    // اولویت ۲: نام از person.detailAccount
    if (data?.document?.person?.detailAccount?.name) {
      console.log(
        "✅ نام مشتری از person.detailAccount:",
        data.document.person.detailAccount.name
      );
      return data.document.person.detailAccount.name;
    }

    // اولویت ۳: نام شخص
    if (data?.document?.person?.name) {
      console.log("✅ نام مشتری از person:", data.document.person.name);
      return data.document.person.name;
    }

    // اولویت ۴: نام از ledgerEntries
    if (data?.document?.ledgerEntries?.[0]?.person?.name) {
      console.log(
        "✅ نام مشتری از ledgerEntries:",
        data.document.ledgerEntries[0].person.name
      );
      return data.document.ledgerEntries[0].person.name;
    }

    console.log("❌ نام مشتری یافت نشد");
    return "مشتری نامشخص";
  };

  // تابع getCustomerCode:
  const getCustomerCode = () => {
    if (data?.document?.detailAccount?.code) {
      return data.document.detailAccount.code;
    }

    if (data?.document?.person?.detailAccount?.code) {
      return data.document.person.detailAccount.code;
    }

    return "کد نامشخص";
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال دریافت اطلاعات فاکتور...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || "فاکتور فروش یافت نشد"}
          <button
            onClick={fetchInvoiceData}
            className="btn btn-sm btn-outline-danger me-2"
          >
            تلاش مجدد
          </button>
          <Link
            href="/inventory/documents/sales-list"
            className="btn btn-sm btn-outline-primary"
          >
            بازگشت به لیست
          </Link>
        </div>
      </div>
    );
  }

  const { document, totals, payment } = data;

  return (
    <div className="container-fluid py-4">
      {/* هدر */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">🧾 فاکتور فروش</h1>
          <p className="text-muted mb-0">
            شماره:{" "}
            <strong>
              {document.referenceNumber || document.documentNumber}
            </strong>
            <span className="mx-3">|</span>
            تاریخ: {formatDate(document.documentDate)}
            <span className="mx-3">|</span>
            روش پرداخت:
            <span
              className={`badge bg-${getPaymentMethodColor(
                payment.method
              )} ms-2`}
            >
              {getPaymentMethodText(payment.method)}
            </span>
          </p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handlePrint} className="btn btn-outline-primary">
            <i className="bi bi-printer me-2"></i>
            چاپ فاکتور
          </button>
          <Link
            href="/inventory/documents/sales-list"
            className="btn btn-outline-secondary"
          >
            بازگشت به لیست
          </Link>
          {!document.voucherId && (
            <button onClick={handleDelete} className="btn btn-outline-danger">
              <i className="bi bi-trash me-2"></i>
              حذف فاکتور
            </button>
          )}
        </div>
      </div>

      {/* نمایش جزئیات پرداخت ترکیبی */}
      {renderCombinedPaymentDetails()}

      <div className="row">
        {/* ستون سمت راست - اطلاعات فاکتور */}
        <div className="col-md-8">
          {/* کارت اطلاعات پایه */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                اطلاعات فاکتور
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">
                      شماره فاکتور
                    </label>
                    <div className="fs-5 fw-bold">
                      {document.referenceNumber || document.documentNumber}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">
                      تاریخ فاکتور
                    </label>
                    <div className="fs-5">
                      {formatDate(document.documentDate)}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">انبار</label>
                    <div className="fs-5">
                      {document.warehouse?.name}
                      <span className="badge bg-secondary ms-2">
                        {document.warehouse?.code}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">مشتری</label>
                    <div className="fs-5 fw-bold">
                      {getCustomerName()}

                      {/* نمایش کد حساب */}
                      <div className="small text-muted mt-1">
                        <i className="bi bi-hash me-1"></i>
                        کد حساب: {getCustomerCode()}
                      </div>

                      {/* نمایش نوع حساب اگر وجود دارد */}
                      {data?.document?.detailAccount?.subAccount && (
                        <div className="small text-muted">
                          <i className="bi bi-diagram-3 me-1"></i>
                          حساب معین:{" "}
                          {data.document.detailAccount.subAccount.name}
                        </div>
                      )}
                    </div>

                    {/* نمایش اطلاعات تماس اگر از person موجود است */}
                    {data?.document?.person && (
                      <>
                        {data.document.person.phone && (
                          <div className="text-muted mt-2">
                            <i className="bi bi-telephone me-1"></i>
                            {data.document.person.phone}
                          </div>
                        )}

                        {data.document.person.address && (
                          <div className="text-muted small mt-1">
                            <i className="bi bi-geo-alt me-1"></i>
                            {data.document.person.address}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {document.description && (
                <div className="mt-3">
                  <label className="form-label text-muted">توضیحات</label>
                  <div className="alert alert-light">
                    {document.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* کارت اقلام فاکتور */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                اقلام فاکتور
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ردیف</th>
                      <th>کد کالا</th>
                      <th>نام کالا</th>
                      <th>گروه</th>
                      <th className="text-end">تعداد</th>
                      <th className="text-end">قیمت واحد</th>
                      <th className="text-end">جمع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.ledgerEntries.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {item.product?.code}
                          </span>
                        </td>
                        <td>
                          <strong>{item.product?.name}</strong>
                          <div className="small text-muted">
                            {item.product?.unit?.name}
                          </div>
                        </td>
                        <td>{item.product?.category?.name}</td>
                        <td className="text-end text-danger fw-bold">
                          {item.quantityOut.toLocaleString("fa-IR")}
                        </td>
                        <td className="text-end">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="text-end fw-bold text-success">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary">
                    <tr>
                      <td colSpan="4" className="text-end fw-bold">
                        جمع کل:
                      </td>
                      <td className="text-end fw-bold">
                        {totals.quantity.toLocaleString("fa-IR")}
                      </td>
                      <td></td>
                      <td className="text-end fw-bold fs-5 text-success">
                        {formatCurrency(totals.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ستون سمت چپ - اطلاعات مالی و عملیات */}
        <div className="col-md-4">
          {/* کارت خلاصه مالی */}
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-calculator me-2"></i>
                خلاصه مالی
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>تعداد اقلام:</span>
                  <span className="fw-bold">{totals.itemsCount}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>جمع تعداد:</span>
                  <span className="fw-bold">
                    {totals.quantity.toLocaleString("fa-IR")} واحد
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span className="fs-5">مبلغ کل فاکتور:</span>
                  <span className="fs-4 fw-bold text-success">
                    {formatCurrency(totals.amount)}
                  </span>
                </div>

                {/* نمایش وضعیت پرداخت */}
                {payment.summary && (
                  <>
                    <hr />
                    <div className="d-flex justify-content-between mb-2">
                      <span>پرداخت شده:</span>
                      <span className="fw-bold text-success">
                        {formatCurrency(payment.summary.totalPaid)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>باقیمانده:</span>
                      <span className="fw-bold text-danger">
                        {formatCurrency(payment.summary.remaining)}
                      </span>
                    </div>
                    <div className="progress mb-3" style={{ height: "10px" }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{
                          width: `${
                            (payment.summary.totalPaid / totals.amount) * 100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="progress-bar bg-danger"
                        role="progressbar"
                        style={{
                          width: `${
                            (payment.summary.remaining / totals.amount) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </>
                )}
              </div>

              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  اطلاعات مالی
                </h6>
                <p className="mb-2 small">
                  این فاکتور باعث کاهش موجودی کالا در انبار{" "}
                  {document.warehouse?.name} شده است.
                </p>
              </div>
            </div>
          </div>

          {/* کارت سند حسابداری */}
          {document.voucher ? (
            <div className="card mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-file-text me-2"></i>
                  سند حسابداری
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>شماره سند:</span>
                    <span className="badge bg-primary">
                      {document.voucher.voucherNumber}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>تاریخ سند:</span>
                    <span>{formatDate(document.voucher.voucherDate)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>مبلغ سند:</span>
                    <span className="fw-bold">
                      {formatCurrency(document.voucher.totalAmount)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>تعداد ردیف‌ها:</span>
                    <span>{document.voucher.items?.length || 0}</span>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Link
                    href={`/vouchers/${document.voucher.id}`}
                    className="btn btn-outline-info"
                  >
                    <i className="bi bi-eye me-2"></i>
                    مشاهده سند حسابداری
                  </Link>
                  <Link
                    href={`/vouchers/${document.voucher.id}/print`}
                    className="btn btn-outline-primary"
                    target="_blank"
                  >
                    <i className="bi bi-printer me-2"></i>
                    چاپ سند حسابداری
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card mb-4">
              <div className="card-header bg-warning">
                <h5 className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  سند حسابداری
                </h5>
              </div>
              <div className="card-body text-center">
                <i className="bi bi-file-x display-4 text-warning mb-3 d-block"></i>
                <p className="text-muted">
                  برای این فاکتور سند حسابداری ثبت نشده است
                </p>
              </div>
            </div>
          )}

          {/* کارت عملیات */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                عملیات
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary"
                >
                  <i className="bi bi-printer me-2"></i>
                  چاپ فاکتور
                </button>

                <Link
                  href={`/inventory/documents/${document.id}/edit`}
                  className="btn btn-outline-warning"
                >
                  <i className="bi bi-pencil me-2"></i>
                  ویرایش فاکتور
                </Link>

                {document.voucherId ? (
                  <button
                    disabled
                    className="btn btn-outline-secondary"
                    title="فاکتور دارای سند حسابداری قابل حذف نیست"
                  >
                    <i className="bi bi-trash me-2"></i>
                    حذف فاکتور (غیرفعال)
                  </button>
                ) : (
                  <button
                    onClick={handleDelete}
                    className="btn btn-outline-danger"
                  >
                    <i className="bi bi-trash me-2"></i>
                    حذف فاکتور
                  </button>
                )}

                <Link
                  href={`/inventory/documents/sales-invoice?copyFrom=${document.id}`}
                  className="btn btn-outline-info"
                >
                  <i className="bi bi-files me-2"></i>
                  کپی فاکتور
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* لینک‌های پایین */}
      <div className="mt-4 d-flex justify-content-between">
        <div>
          <Link
            href="/inventory/documents/sales-list"
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-right me-2"></i>
            بازگشت به لیست فاکتورها
          </Link>
        </div>

        <div className="d-flex gap-2">
          <Link
            href={`/reports/account-turnover?account=${document.person?.detailAccount?.code}`}
            className="btn btn-outline-info"
          >
            <i className="bi bi-graph-up me-2"></i>
            گردش حساب مشتری
          </Link>

          {document.ledgerEntries.length > 0 && (
            <Link
              href={`/inventory/products/${document.ledgerEntries[0].productId}/ledger`}
              className="btn btn-outline-warning"
            >
              <i className="bi bi-box-seam me-2"></i>
              کاردکس کالا
            </Link>
          )}
        </div>
      </div>
      <div ref={printRef} style={{ display: "none" }}>
        <PrintInvoice
          document={document}
          totals={totals}
          payment={payment}
          accountNames={accountNames}
        />
      </div>
    </div>
  );
}
