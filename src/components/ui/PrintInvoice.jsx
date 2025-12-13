// components/ui/PrintInvoice.jsx
import "@/styles/print.css";

export default function PrintInvoice({
  document,
  totals,
  payment,
  accountNames,
}) {
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "۰";
    return new Intl.NumberFormat("fa-IR").format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  const getCurrentBalance = () => {
    return payment?.summary?.remaining || 0;
  };

  const getTotalPaid = () => {
    return payment?.summary?.totalPaid || 0;
  };

  const calculateTotalQuantity = () => {
    if (!document?.ledgerEntries) return 0;
    return document.ledgerEntries.reduce(
      (total, item) => total + item.quantityOut,
      0
    );
  };

  return (
    <div className="print-only invoice-a4" dir="rtl">
      <style>
        {`
          @font-face {
            font-family: 'Vazirmatn';
            src: url('/fonts/Vazir.eot');
            src: url('/fonts/Vazir.eot?#iefix') format('embedded-opentype'),
                 url('/fonts/Vazir.woff2') format('woff2'),
                 url('/fonts/Vazir.woff') format('woff'),
                 url('/fonts/Vazir.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }

          .print-only { display: none; }

          @media print {
            /* تنظیمات صفحه برای چاپ */
            @page {
              size: A4 portrait;
              margin: 10mm 15mm;
            }

            body {
              margin: 0;
              padding: 0;
              width: 210mm;
              height: 297mm;
              font-family: 'Vazirmatn', Tahoma, sans-serif !important;
              font-size: 10pt;
              line-height: 1.3;
            }

            .no-print { display: none !important; }
            .print-only { 
              display: block !important;
              width: 180mm; /* 210mm - (15mm*2 margins) */
              min-height: 277mm; /* 297mm - (10mm*2 margins) */
              padding: 0;
              background: white;
              color: black;
              box-sizing: border-box;
              overflow: hidden;
            }

            /* استایل اصلی فاکتور */
            .invoice-a4 {
              border: 1px solid #000;
              position: relative;
            }

            /* هدر فاکتور */
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin: 8px 10px 5px 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #000;
            }

            .header-left {
              text-align: right;
              flex: 1;
            }

            .header-center {
              text-align: center;
              flex: 2;
            }

            .header-right {
              text-align: left;
              direction: ltr;
              flex: 1;
            }

            .invoice-title {
              font-size: 14pt;
              font-weight: bold;
              margin: 0;
            }

            .invoice-meta {
              font-size: 9pt;
              margin: 2px 0;
            }

            /* اطلاعات شرکت */
            .company-info {
              text-align: center;
            }

            .company-name {
              font-size: 12pt;
              font-weight: bold;
              margin: 0;
            }

            .company-address {
              font-size: 8pt;
              margin: 1px 0;
            }

            /* اطلاعات مشتری */
            .customer-info {
              margin: 0 10px 8px 10px;
              padding: 4px 5px;
              background: #f5f5f5;
              border: 1px solid #ccc;
              border-radius: 2px;
              font-size: 8pt;
            }

            .customer-row {
              display: flex;
              margin-bottom: 2px;
            }

            .customer-label {
              font-weight: bold;
              min-width: 50px;
            }

            /* جدول اقلام - عرض ثابت */
            .items-table-container {
              margin: 0 10px;
              overflow: hidden;
            }

            .items-table {
              width: 158mm; /* کمتر از عرض صفحه */
              border-collapse: collapse;
              margin: 5px 0;
              font-size: 8pt;
              table-layout: fixed;
            }

            .items-table th {
              border: 1px solid #000;
              padding: 3px 2px;
              text-align: center;
              background: #e0e0e0;
              font-weight: bold;
              height: 22px;
              overflow: hidden;
            }

            .items-table td {
              border: 1px solid #000;
              padding: 3px 2px;
              text-align: center;
              vertical-align: top;
              height: 20px;
              overflow: hidden;
            }

            .items-table .description {
              text-align: right;
              padding-right: 3px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .items-table .numbers {
              font-family: 'Courier New', monospace;
              direction: ltr;
              text-align: right;
              padding-right: 3px;
            }

            /* ابعاد ثابت ستون‌ها - مجموع 158mm */
            .items-table th:nth-child(1),
            .items-table td:nth-child(1) { width: 15mm; } /* ردیف */
            .items-table th:nth-child(2),
            .items-table td:nth-child(2) { width: 20mm; } /* کد */
            .items-table th:nth-child(3),
            .items-table td:nth-child(3) { width: 53mm; } /* شرح */
            .items-table th:nth-child(4),
            .items-table td:nth-child(4) { width: 15mm; } /* واحد */
            .items-table th:nth-child(5),
            .items-table td:nth-child(5) { width: 15mm; } /* مقدار */
            .items-table th:nth-child(6),
            .items-table td:nth-child(6) { width: 20mm; } /* قیمت واحد */
            .items-table th:nth-child(7),
            .items-table td:nth-child(7) { width: 20mm; } /* قیمت کل */

            /* جمع کل - چپ چین شدن مقادیر */
            .totals {
              margin: 5px 10px;
              padding-top: 3px;
              border-top: 1px solid #000;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 1px 0;
              font-size: 9pt;
              min-height: 18px;
            }

            .total-label {
              font-weight: bold;
              text-align: right;
              padding-left: 10px;
            }

            .total-value {
              font-family: 'Courier New', monospace;
              direction: ltr;
              text-align: left;
              min-width: 110px;
              padding-right: 5px;
              overflow: hidden;
            }

            /* اطلاعات پرداخت */
            .payment-section {
              margin: 5px 10px;
              padding: 5px;
              border: 1px solid #ccc;
              border-radius: 2px;
              background: #f8f9fa;
              font-size: 8pt;
            }

            .balance-info {
              margin: 3px 0;
              padding: 4px;
              border: 1px solid #d6d8db;
              border-radius: 2px;
              background: #fff3cd;
              text-align: center;
              font-size: 8pt;
            }

            .balance-amount {
              color: #856404;
              font-weight: bold;
              margin: 0 2px;
              font-family: 'Courier New', monospace;
            }

            /* اطلاعات بانکی */
            .bank-info {
              margin: 5px 10px;
              padding: 5px;
              border: 1px solid #b8daff;
              border-radius: 2px;
              background: #d1ecf1;
              font-size: 7pt;
            }

            .bank-row {
              display: flex;
              margin: 1px 0;
            }

            .bank-label {
              font-weight: bold;
              min-width: 70px;
            }

            .bank-value {
              font-family: 'Courier New', monospace;
              direction: ltr;
            }

            /* هشدار */
            .warning-note {
              margin: 5px 10px;
              padding: 4px;
              border: 1px solid #f5c6cb;
              border-radius: 2px;
              background: #f8d7da;
              color: #721c24;
              font-size: 7pt;
              text-align: center;
            }

            /* امضاها */
            .signatures {
              display: flex;
              justify-content: space-between;
              margin: 8px 10px 5px 10px;
              padding-top: 8px;
              border-top: 1px solid #000;
            }

            .signature-box {
              text-align: center;
              width: 45%;
            }

            .signature-line {
              border-top: 1px solid #000;
              margin: 20px auto 3px;
              width: 80%;
            }

            .signature-text {
              font-size: 8pt;
              font-weight: bold;
            }

            /* پانویس */
            .footer {
              margin: 3px 10px 8px 10px;
              padding-top: 3px;
              border-top: 1px solid #ccc;
              font-size: 6pt;
              color: #666;
              text-align: center;
            }

            /* اعداد انگلیسی */
            .ltr {
              direction: ltr;
              font-family: 'Courier New', monospace;
              text-align: right;
            }

            /* جلوگیری از شکستن صفحه */
            .page-break {
              page-break-inside: avoid;
            }

            /* برای چاپ بهتر */
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="page-break">
        {/* هدر فاکتور */}
        <div className="invoice-header">
          <div className="header-left">
            <div className="invoice-title">فاکتور فروش</div>
          </div>
          <div className="header-center">
            <div className="company-info">
              <div className="company-name">پولکی و نبات نگین آرا</div>
              <div className="company-address">
                آدرس: تهران، خیابان نمونه، پلاک ۱۲۳
              </div>
              <div className="company-address">
                تلفن: ۰۲۱-۱۲۳۴۵۶۷۸ | موبایل: ۰۹۱۲۳۴۵۶۷۸۹
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="invoice-meta">
              شماره:{" "}
              {document?.referenceNumber || document?.documentNumber || "---"}
            </div>
            <div className="invoice-meta">
              تاریخ: {formatDate(document?.documentDate)}
            </div>
            <div className="invoice-meta">
              ساعت:{" "}
              {new Date().toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* اطلاعات مشتری */}
        <div className="customer-info">
          <div className="customer-row">
            <span className="customer-label">خریدار:</span>
            <span>{document?.person?.name || "جناب آقای/خانم ..."}</span>
          </div>
          <div className="customer-row">
            <span className="customer-label">آدرس:</span>
            <span>{document?.person?.address || "---"}</span>
          </div>
          <div className="customer-row">
            <span className="customer-label">تلفن:</span>
            <span>{document?.person?.phone || "---"}</span>
          </div>
        </div>

        {/* جدول اقلام */}
        <div className="items-table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>کد کالا</th>
                <th>شرح کالا یا خدمات</th>
                <th>واحد</th>
                <th>مقدار</th>
                <th>قیمت واحد</th>
                <th>قیمت کل</th>
              </tr>
            </thead>
            <tbody>
              {document?.ledgerEntries?.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.product?.code || "---"}</td>
                  <td className="description">
                    {item.product?.name || "کالا"}
                  </td>
                  <td>{item.product?.unit?.name || "عدد"}</td>
                  <td className="numbers">
                    {item.quantityOut?.toLocaleString("fa-IR") || 0}
                  </td>
                  <td className="numbers">
                    {formatCurrency(item.unitPrice || 0)}
                  </td>
                  <td className="numbers">
                    <strong>{formatCurrency(item.totalPrice || 0)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* جمع تعداد */}
        <div
          className="total-row"
          style={{
            justifyContent: "flex-end",
            margin: "0 10px",
            marginTop: "-2px",
          }}
        >
          <span className="total-label">جمع تعداد:</span>
          <span className="total-value" style={{ minWidth: "80px" }}>
            {calculateTotalQuantity().toLocaleString("fa-IR")}
          </span>
        </div>

        {/* جمع کل - چپ چین شده */}
        <div className="totals">
          <div className="total-row">
            <span className="total-label">جمع کل به ریال:</span>
            <span className="total-value" style={{ textAlign: "left" }}>
              {formatCurrency(totals?.amount || 0)}
            </span>
          </div>
          <div className="total-row">
            <span className="total-label">خالص فاکتور:</span>
            <span className="total-value" style={{ textAlign: "left" }}>
              {formatCurrency(totals?.amount || 0)}
            </span>
          </div>
        </div>

        {/* اطلاعات پرداخت */}
        <div className="payment-section">
          {/* مانده حساب */}
          <div className="balance-info">
            مانده حساب شما در تاریخ {formatDate(new Date())}
            <div style={{ marginTop: "2px" }}>
              ساعت{" "}
              {new Date().toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}{" "}
              صبح مبلغ
              <span className="balance-amount">
                {" "}
                {formatCurrency(getCurrentBalance())}{" "}
              </span>
              ریال می‌باشد
            </div>
          </div>

          {/* جزئیات پرداخت */}
          <div style={{ marginTop: "5px" }}>
            <div className="total-row">
              <span>پرداخت نقد به مبلغ:</span>
              <span className="ltr" style={{ textAlign: "right", minWidth: "100px" }}>
                {formatCurrency(getTotalPaid())}
              </span>
            </div>
            {payment?.method === "combined" && payment?.summary && (
              <>
                {payment.summary.cheque > 0 && (
                  <div className="total-row">
                    <span>پرداخت چکی:</span>
                    <span className="ltr" style={{ textAlign: "right", minWidth: "100px" }}>
                      {formatCurrency(payment.summary.cheque)}
                    </span>
                  </div>
                )}
                {payment.summary.transfer > 0 && (
                  <div className="total-row">
                    <span>پرداخت حواله:</span>
                    <span className="ltr" style={{ textAlign: "right", minWidth: "100px" }}>
                      {formatCurrency(payment.summary.transfer)}
                    </span>
                  </div>
                )}
                {payment.summary.credit > 0 && (
                  <div className="total-row">
                    <span>مانده بدهی (نسیه):</span>
                    <span className="ltr" style={{ textAlign: "right", minWidth: "100px", color: "#dc3545" }}>
                      {formatCurrency(payment.summary.credit)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* اطلاعات بانکی */}
        <div className="bank-info">
          <div className="bank-row">
            <span className="bank-label">شماره شبا:</span>
            <span className="bank-value">IR100600241670013564097001</span>
          </div>
          <div className="bank-row">
            <span className="bank-label">شماره کارت:</span>
            <span className="bank-value">6063731157628646</span>
          </div>
          <div className="bank-row">
            <span className="bank-label">به نام:</span>
            <span>خانم شیوا ذوالفقاری - بانک مهر ایران</span>
          </div>
        </div>

        {/* هشدار */}
        <div className="warning-note">
          اجناس فوق تا تسویه حساب کامل، نزد خریدار به صورت امانت می‌ماند
        </div>

        {/* امضاها */}
        <div className="signatures">
          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-text">مهر و امضاء فروشنده</div>
            <div style={{ fontSize: "7pt", marginTop: "1px" }}>کاربر ارشد</div>
          </div>

          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-text">امضاء خریدار</div>
          </div>
        </div>

        {/* پانویس */}
        <div className="footer">
          لطفاً وجه مانده حساب را به شماره شبا یا شماره کارت فوق واریز نمایید
          <div style={{ marginTop: "2px" }}>
            نرم افزار پارسیان | www.parsian-accounting.ir
          </div>
        </div>
      </div>
    </div>
  );
}