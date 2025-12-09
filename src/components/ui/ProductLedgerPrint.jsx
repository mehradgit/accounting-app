import "@/styles/print.css";
export default function ProductLedgerPrint({ product, ledgers, stats }) {
  const formatCurrency = (amount) =>
    amount?.toLocaleString("fa-IR") + " ریال" || "-";
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("fa-IR") : "-";

  return (
    <div className="print-only" dir="rtl">
      {/* استایل داخلی مخصوص پرینت */}
      <style>
        {`
    @font-face {
      font-family: "Vazirmatn";
      src: url("/fonts/Vazir.eot");
      src: url("/fonts/Vazir.eot?#iefix") format("embedded-opentype"),
           url("/fonts/Vazir.woff2") format("woff2"),
           url("/fonts/Vazir.woff") format("woff"),
           url("/fonts/Vazir.ttf") format("truetype");
      font-weight: normal;
      font-style: normal;
    }

    .print-only { display: none; }

    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }

      body, .print-only {
        font-family: "Vazirmatn", Tahoma, sans-serif !important;
        font-size: 13px !important;
        line-height: 1.5;
        color: #000;
      }

      @page {
        size: A4 portrait;
        margin: 12mm;
      }

      table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed;
        word-wrap: break-word;
        font-size: 12px !important;
      }

      table th, table td {
        border: 1px solid #000 !important; /* حاشیه سلول واضح */
        padding: 6px !important;
        text-align: center;
        vertical-align: middle;
        overflow: hidden;
        white-space: normal;
      }

      table th {
        background-color: #333 !important; /* هدر تیره‌تر */
        color: #fff !important;
        font-weight: bold;
      }

      table tbody tr:nth-child(even) {
        background-color: #f3f3f3 !important;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: "Vazirmatn", Tahoma, sans-serif !important;
        color: #000 !important;
        margin: 8px 0 !important;
      }

      .stock-warehouse {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }

      .stock-warehouse div {
        border: 1px solid #333;
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: bold;
        background-color: #e8e8e8;
      }

      .signatures {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
      }

      .signature-box {
        width: 45%;
        text-align: center;
        border-top: 1px solid #333;
        padding-top: 6px;
        font-weight: bold;
      }

      html, body {
        overflow: visible !important;
      }
    }
  `}
      </style>

      <h2>📒 کاردکس کالا</h2>
      <p>
        نام کالا: {product.name} | کد: {product.code} | واحد:{" "}
        {product.unit?.name}
      </p>
      <p>تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}</p>

      <table>
        <thead>
          <tr>
            <th>تاریخ</th>
            <th>نوع</th>
            <th>انبار</th>
            <th>شماره سند</th>
            <th>توضیحات</th>
            <th>ورودی</th>
            <th>خروجی</th>
            <th>قیمت واحد</th>
            <th>مبلغ کل</th>
            <th>موجودی</th>
          </tr>
        </thead>
        <tbody>
          {ledgers.map((l) => (
            <tr key={l.id}>
              <td>{formatDate(l.transactionDate)}</td>
              <td>{l.document?.type?.name || "-"}</td>
              <td>{l.warehouse?.name || "-"}</td>
              <td>{l.document?.documentNumber || "-"}</td>
              <td>{l.description || "-"}</td>
              <td>{l.quantityIn || "-"}</td>
              <td>{l.quantityOut || "-"}</td>
              <td>{formatCurrency(l.unitPrice)}</td>
              <td>{formatCurrency(l.totalPrice)}</td>
              <td>{l.balanceQuantity?.toLocaleString("fa-IR") || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>📦 موجودی انبارها</h3>
      <div className="stock-warehouse">
        {stats.stockByWarehouse.map((s) => (
          <div key={s.warehouseId}>
            {s.warehouseName}: {s.quantity.toLocaleString("fa-IR")}{" "}
            {product.unit?.name}
          </div>
        ))}
      </div>

      <div className="signatures">
        <div className="signature-box">مسئول انبار</div>
        <div className="signature-box">رئیس حسابداری</div>
      </div>
    </div>
  );
}
