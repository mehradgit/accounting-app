"use client";
import { useState, useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Alert,
  Card,
  Badge,
  Spinner,
} from "react-bootstrap";
import PersianDatePicker from "../ui/PersianDatePicker";

// --- توابع کمکی برای اعداد و فرمت دهی ---
const toEnglishDigits = (str) => {
  if (!str) return "";
  return str.toString()
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
};

const formatNumber = (num) => {
  if (num === "" || num === null || num === undefined) return "";
  const parsedNum = parseFloat(num);
  if (isNaN(parsedNum)) return "";
  return new Intl.NumberFormat("fa-IR").format(parsedNum);
};

export default function ChequeForm({ initialData = {}, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // داده‌های اولیه سرور
  const [persons, setPersons] = useState([]);
  const [detailAccounts, setDetailAccounts] = useState([]); // حساب‌های تفصیلی
  const [bankDetailAccounts, setBankDetailAccounts] = useState([]); // تفصیلی‌های بانکی
  const [expenseDetailAccounts, setExpenseDetailAccounts] = useState([]); // تفصیلی‌های هزینه
  const [inventoryDetailAccounts, setInventoryDetailAccounts] = useState([]); // موجودی کالا

  // استیت برای نمایش مبلغ با فرمت جداکننده
  const [displayAmount, setDisplayAmount] = useState(initialData.amount ? formatNumber(initialData.amount) : "");

  // استیت برای ذخیره اطلاعات بانک و صادرکننده از حساب تفصیلی انتخاب شده
  const [selectedBankInfo, setSelectedBankInfo] = useState(null);
  const [selectedDrawerInfo, setSelectedDrawerInfo] = useState(null);

  // حفظ ساختار داده‌های فرم
  const [formData, setFormData] = useState({
    chequeNumber: initialData.chequeNumber || "",
    amount: initialData.amount || "",
    issueDate: initialData.issueDate || new Date().toISOString().split("T")[0],
    dueDate: initialData.dueDate || "",
    type: initialData.type || "payable",
    description: initialData.description || "",
    personId: initialData.personId || "",
    
    // حساب‌های تفصیلی - اجباری
    drawerDetailAccountId: initialData.drawerDetailAccountId || "", // صادرکننده (برای دریافتنی)
    payeeDetailAccountId: initialData.payeeDetailAccountId || "", // گیرنده (برای پرداختنی)
    bankDetailAccountId: initialData.bankDetailAccountId || "", // حساب بانک
    
    // حساب هزینه (فقط برای پرداختنی بابت هزینه)
    expenseDetailAccountId: initialData.expenseDetailAccountId || "",
    
    issueReason: initialData.issueReason || "settlement",
  });

  // تجمیع توابع fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // وقتی حساب بانک انتخاب شد، اطلاعات بانک را استخراج کن
    if (formData.bankDetailAccountId) {
      const selectedBank = bankDetailAccounts.find(
        acc => acc.id === parseInt(formData.bankDetailAccountId)
      );
      if (selectedBank) {
        // استخراج نام بانک از نام حساب تفصیلی (مثلاً "بانک ملی - شعبه مرکزی")
        setSelectedBankInfo({
          name: selectedBank.name,
          // می‌توانید منطق پیچیده‌تری برای استخراج شعبه اضافه کنید
          branch: selectedBank.name.includes('-') 
            ? selectedBank.name.split('-')[1]?.trim() 
            : 'مرکزی'
        });
      } else {
        setSelectedBankInfo(null);
      }
    } else {
      setSelectedBankInfo(null);
    }
  }, [formData.bankDetailAccountId, bankDetailAccounts]);

  useEffect(() => {
    // وقتی حساب صادرکننده انتخاب شد، اطلاعات صادرکننده را استخراج کن
    if (formData.type === "receivable" && formData.drawerDetailAccountId) {
      const selectedDrawer = detailAccounts.find(
        acc => acc.id === parseInt(formData.drawerDetailAccountId)
      );
      if (selectedDrawer) {
        setSelectedDrawerInfo({
          name: selectedDrawer.person?.name || selectedDrawer.name,
          personId: selectedDrawer.person?.id || null
        });
        
        // اگر حساب تفصیلی مربوط به یک شخص است، personId را هم ست کن
        if (selectedDrawer.person?.id) {
          setFormData(prev => ({ ...prev, personId: selectedDrawer.person.id }));
        }
      } else {
        setSelectedDrawerInfo(null);
      }
    } else {
      setSelectedDrawerInfo(null);
    }
  }, [formData.drawerDetailAccountId, formData.type, detailAccounts]);

  const fetchInitialData = async () => {
    try {
      const [personsRes, detailAccountsRes] = await Promise.all([
        fetch("/api/persons"),
        fetch("/api/detail-accounts?include=person"),
      ]);

      if (personsRes.ok) setPersons(await personsRes.json());
      if (detailAccountsRes.ok) {
        const allDetailAccounts = await detailAccountsRes.json();
        setDetailAccounts(allDetailAccounts);
        
        // فیلتر کردن حساب‌های تفصیلی بانکی (زیرمجموعه 1-01-0001)
        const bankDetailAccounts = allDetailAccounts.filter(acc => 
          acc.subAccount && acc.subAccount.code === '1-01-0001'
        );
        setBankDetailAccounts(bankDetailAccounts);
        
        // فیلتر کردن حساب‌های تفصیلی هزینه (کدهای شروع شده با 6)
        const expenseDetailAccounts = allDetailAccounts.filter(acc => 
          acc.code && acc.code.startsWith('6')
        );
        setExpenseDetailAccounts(expenseDetailAccounts);
        
        // فیلتر کردن حساب‌های تفصیلی موجودی کالا (کدهای شروع شده با 1-04)
        const inventoryDetailAccounts = allDetailAccounts.filter(acc => 
          acc.code && acc.code.startsWith('1-04')
        );
        setInventoryDetailAccounts(inventoryDetailAccounts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // --- هندلر ویژه برای مبلغ ---
  const handleAmountChange = (e) => {
    const value = e.target.value;
    
    const englishValue = toEnglishDigits(value);
    const rawValue = englishValue.replace(/[^\d]/g, "");

    if (rawValue) {
      const num = parseInt(rawValue, 10);
      setDisplayAmount(formatNumber(num));
      setFormData((prev) => ({ ...prev, amount: num }));
    } else {
      setDisplayAmount("");
      setFormData((prev) => ({ ...prev, amount: "" }));
    }
    
    if (error) setError("");
  };

  // هندلر عمومی برای سایر فیلدها
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (error) setError("");
  };

  // هندلر تغییر علت صدور
  const handleIssueReasonChange = (value) => {
    setFormData(prev => ({
      ...prev,
      issueReason: value,
      // پاک کردن حساب هزینه هنگام تغییر علت، مگر اینکه دلیل expense باشد
      expenseDetailAccountId: value === 'expense' ? prev.expenseDetailAccountId : ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // اعتبارسنجی داده‌های اجباری پایه
      if (!formData.chequeNumber?.trim() || 
          !formData.amount || 
          parseFloat(formData.amount) <= 0 || 
          !formData.issueDate || 
          !formData.dueDate) {
        throw new Error("پر کردن فیلدهای ستاره‌دار الزامی است و مبلغ باید بزرگتر از صفر باشد.");
      }

      // اعتبارسنجی تاریخ‌ها
      const issueDate = new Date(formData.issueDate);
      const dueDate = new Date(formData.dueDate);
      if (dueDate < issueDate) {
        throw new Error("تاریخ سررسید نمی‌تواند قبل از تاریخ صدور باشد.");
      }

      // اعتبارسنجی نوع چک و حساب‌های مرتبط
      if (formData.type === "receivable") {
        // چک دریافتنی
        if (!formData.drawerDetailAccountId) {
          throw new Error("برای چک دریافتنی، انتخاب حساب تفصیلی صادرکننده الزامی است");
        }
      } else if (formData.type === "payable") {
        // چک پرداختنی
        if (!formData.payeeDetailAccountId) {
          throw new Error("برای چک پرداختنی، انتخاب حساب تفصیلی گیرنده الزامی است");
        }
        if (!formData.bankDetailAccountId) {
          throw new Error("انتخاب حساب بانک برای وصول الزامی است");
        }
        // اعتبارسنجی حساب هزینه برای حالت هزینه/خرید
        if (formData.issueReason === "expense" && !formData.expenseDetailAccountId) {
          throw new Error("برای صدور چک بابت هزینه/خرید، انتخاب حساب هزینه الزامی است");
        }
      }

      // ساخت داده‌های ارسالی
      const submitData = {
        // اطلاعات پایه چک
        chequeNumber: formData.chequeNumber.trim(),
        amount: parseFloat(formData.amount),
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        type: formData.type,
        description: formData.description?.trim() || null,
        issueReason: formData.issueReason,
        status: 'pending'
      };

      // استخراج نام بانک و صادرکننده از حساب‌های تفصیلی
      if (formData.bankDetailAccountId) {
        const selectedBank = bankDetailAccounts.find(
          acc => acc.id === parseInt(formData.bankDetailAccountId)
        );
        if (selectedBank) {
          // نام بانک را از نام حساب تفصیلی استخراج کن
          const bankName = selectedBank.name.split('-')[0]?.trim() || selectedBank.name;
          submitData.bankName = bankName;
          submitData.branchName = selectedBank.name.includes('-') 
            ? selectedBank.name.split('-')[1]?.trim() 
            : 'مرکزی';
        }
      }

      if (formData.type === "receivable" && formData.drawerDetailAccountId) {
        const selectedDrawer = detailAccounts.find(
          acc => acc.id === parseInt(formData.drawerDetailAccountId)
        );
        if (selectedDrawer) {
          submitData.drawer = selectedDrawer.person?.name || selectedDrawer.name;
        }
      }

      if (formData.type === "payable" && formData.payeeDetailAccountId) {
        const selectedPayee = detailAccounts.find(
          acc => acc.id === parseInt(formData.payeeDetailAccountId)
        );
        if (selectedPayee) {
          submitData.payee = selectedPayee.person?.name || selectedPayee.name;
        }
      }

      // اضافه کردن ارتباط‌های حساب تفصیلی
      if (formData.drawerDetailAccountId) {
        submitData.drawerDetailAccountId = parseInt(formData.drawerDetailAccountId);
      }
      if (formData.payeeDetailAccountId) {
        submitData.payeeDetailAccountId = parseInt(formData.payeeDetailAccountId);
      }
      if (formData.bankDetailAccountId) {
        submitData.bankDetailAccountId = parseInt(formData.bankDetailAccountId);
      }
      if (formData.expenseDetailAccountId) {
        submitData.expenseDetailAccountId = parseInt(formData.expenseDetailAccountId);
      }

      // اضافه کردن شخص مرتبط اگر وجود دارد
      if (formData.personId && formData.personId !== "") {
        submitData.personId = parseInt(formData.personId);
      }

      // لاگ داده‌های ارسالی برای دیباگ
      console.log("📤 ارسال داده‌های چک:", JSON.stringify(submitData, null, 2));

      // ارسال درخواست
      const url = initialData.id ? `/api/cheques/${initialData.id}` : "/api/cheques";
      const method = initialData.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("❌ خطای سرور:", responseData);
        throw new Error(responseData.error || `خطای سرور: ${response.status} ${response.statusText}`);
      }

      // موفقیت آمیز
      console.log("✅ چک با موفقیت ثبت شد:", responseData);

      let successMessage = "";
      if (initialData.id) {
        successMessage = "چک با موفقیت ویرایش شد";
      } else {
        if (formData.type === "receivable") {
          successMessage = "چک دریافتنی ثبت شد و سند حسابداری ایجاد گردید";
        } else {
          const reasonText = formData.issueReason === "expense" ? "بابت هزینه/خرید" : "برای تسویه بدهی";
          successMessage = `چک پرداختنی ${reasonText} ثبت شد و سند حسابداری ایجاد گردید`;
        }
      }

      alert(`✅ ${successMessage}`);
      
      if (onSuccess) {
        onSuccess(responseData);
      }

      if (!initialData.id) {
        resetForm();
      }

    } catch (err) {
      console.error("❌ خطا در ثبت چک:", err);
      
      // نمایش خطای کاربرپسند
      let errorMessage = err.message || "خطای ناشناخته در ارتباط با سرور";
      
      if (errorMessage.includes("required but not found")) {
        errorMessage = "یکی از حساب‌های انتخاب شده معتبر نیست. لطفاً حساب‌ها را دوباره انتخاب کنید.";
      } else if (errorMessage.includes("unique constraint")) {
        errorMessage = "شماره چک تکراری است. لطفاً شماره چک دیگری وارد کنید.";
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        errorMessage = "خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // تابع ریست فرم
  const resetForm = () => {
    setFormData({
      chequeNumber: "", amount: "",
      issueDate: new Date().toISOString().split("T")[0], dueDate: "",
      type: "payable", description: "",
      personId: "", 
      drawerDetailAccountId: "", payeeDetailAccountId: "",
      bankDetailAccountId: "", expenseDetailAccountId: "",
      issueReason: "settlement"
    });
    setDisplayAmount(""); 
    setError("");
    setSelectedBankInfo(null);
    setSelectedDrawerInfo(null);
  };

  // توابع کمکی نمایش
  const getTypeColor = (type) => (type === "receivable" ? "success" : "warning");
  const getTypeLabel = (type) => (type === "receivable" ? "دریافتنی" : "پرداختنی");
  const getIssueReasonLabel = (reason) => (reason === "settlement" ? "تسویه بدهی" : "هزینه/خرید");

  // شامل حساب‌های موجودی کالا (کدهای 1-04) و هزینه (کدهای 6)
  const allExpenseAndInventoryAccounts = [...expenseDetailAccounts, ...inventoryDetailAccounts];

  const selectedExpenseAccount = allExpenseAndInventoryAccounts?.find(acc => acc.id === parseInt(formData.expenseDetailAccountId));
  const selectedBankAccount = bankDetailAccounts?.find(acc => acc.id === parseInt(formData.bankDetailAccountId));
  const selectedDrawerAccount = detailAccounts?.find(acc => acc.id === parseInt(formData.drawerDetailAccountId));
  const selectedPayeeAccount = detailAccounts?.find(acc => acc.id === parseInt(formData.payeeDetailAccountId));
  
  // تابع انصراف
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      if (window.confirm("آیا از انصراف اطمینان دارید؟ تغییرات ذخیره نخواهند شد.")) {
        resetForm();
      }
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="rtl">
      {error && (
        <Alert variant="danger" className="mb-3">
          <strong>خطا:</strong> {error}
        </Alert>
      )}
      
      {/* اطلاعات اصلی چک */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">📋 اطلاعات چک</h6>
          <div>
            <Badge bg={getTypeColor(formData.type)} className="me-2">
              {getTypeLabel(formData.type)}
            </Badge>
            {formData.type === 'payable' && (
              <Badge bg="info">
                {getIssueReasonLabel(formData.issueReason)}
              </Badge>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>نوع چک *</Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="payable">📋 چک پرداختنی (ما صادر می‌کنیم)</option>
                  <option value="receivable">💰 چک دریافتنی (ما دریافت می‌کنیم)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>شماره چک *</Form.Label>
                <Form.Control
                  type="text"
                  name="chequeNumber"
                  value={formData.chequeNumber}
                  onChange={handleChange}
                  required
                  placeholder="مثال: 123456"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>مبلغ چک (ریال) *</Form.Label>
                <Form.Control
                  type="text"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  required
                  dir="ltr"
                  className="text-left"
                  inputMode="numeric"
                  placeholder="0"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* برای چک پرداختنی: علت صدور */}
          {formData.type === "payable" && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>علت صدور *</Form.Label>
                  <Form.Select
                    name="issueReason"
                    value={formData.issueReason}
                    onChange={(e) => handleIssueReasonChange(e.target.value)}
                    required
                  >
                    <option value="settlement">تسویه بدهی موجود</option>
                    <option value="expense">هزینه/خرید جدید</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {formData.issueReason === 'settlement' 
                      ? 'برای پرداخت بدهی قبلی به طرف مقابل'
                      : 'برای پرداخت هزینه یا خرید جدید'
                    }
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}

          {/* حساب هزینه/موجودی کالا برای حالت هزینه/خرید */}
          {formData.type === "payable" && formData.issueReason === "expense" && (
            <Form.Group className="mb-3">
              <Form.Label>حساب هزینه/خرید *</Form.Label>
              <Form.Select
                name="expenseDetailAccountId"
                value={formData.expenseDetailAccountId}
                onChange={handleChange}
                required
              >
                <option value="">انتخاب حساب هزینه/خرید (تفصیلی)</option>
                {allExpenseAndInventoryAccounts && allExpenseAndInventoryAccounts.length > 0 ? (
                  allExpenseAndInventoryAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                      {account.subAccount && ` (${account.subAccount.name})`}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    ⚠️ هیچ حساب تفصیلی هزینه/موجودی کالا یافت نشد
                  </option>
                )}
              </Form.Select>
              {selectedExpenseAccount && (
                <Form.Text className="text-success">
                  ✅ حساب انتخاب شده: {selectedExpenseAccount.code} - {selectedExpenseAccount.name}
                  {selectedExpenseAccount.subAccount && ` (معین: ${selectedExpenseAccount.subAccount.code})`}
                </Form.Text>
              )}
              <Form.Text className="text-muted">
                حساب‌های تفصیلی هزینه (شروع با 6) یا موجودی کالا (شروع با 1-04)
              </Form.Text>
            </Form.Group>
          )}

          {/* انتخاب حساب صادرکننده برای چک دریافتنی */}
          {formData.type === "receivable" && (
            <Form.Group className="mb-3">
              <Form.Label>
                حساب صادرکننده *<small className="text-muted me-2">(تفصیلی)</small>
              </Form.Label>
              <Form.Select
                name="drawerDetailAccountId"
                value={formData.drawerDetailAccountId}
                onChange={handleChange}
                required
              >
                <option value="">انتخاب حساب تفصیلی صادرکننده</option>
                {detailAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                    {account.person && ` (${account.person.name})`}
                  </option>
                ))}
              </Form.Select>
              {selectedDrawerAccount && (
                <Form.Text className="text-success">
                  ✅ حساب انتخاب شده: {selectedDrawerAccount.code} - {selectedDrawerAccount.name}
                  {selectedDrawerInfo && ` (نام صادرکننده: ${selectedDrawerInfo.name})`}
                </Form.Text>
              )}
            </Form.Group>
          )}

          {/* انتخاب حساب گیرنده برای چک پرداختنی */}
          {formData.type === "payable" && (
            <Form.Group className="mb-3">
              <Form.Label>
                حساب گیرنده *<small className="text-muted me-2">(تفصیلی)</small>
              </Form.Label>
              <Form.Select
                name="payeeDetailAccountId"
                value={formData.payeeDetailAccountId}
                onChange={handleChange}
                required
              >
                <option value="">انتخاب حساب تفصیلی گیرنده</option>
                {detailAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                    {account.person && ` (${account.person.name})`}
                  </option>
                ))}
              </Form.Select>
              {selectedPayeeAccount && (
                <Form.Text className="text-success">
                  ✅ حساب انتخاب شده: {selectedPayeeAccount.code} - {selectedPayeeAccount.name}
                </Form.Text>
              )}
            </Form.Group>
          )}

          {/* حساب بانک برای وصول (فقط برای چک پرداختنی) */}
          {formData.type === "payable" && (
            <Form.Group className="mb-3">
              <Form.Label>حساب بانک برای وصول *</Form.Label>
              <Form.Select
                name="bankDetailAccountId"
                value={formData.bankDetailAccountId}
                onChange={handleChange}
                required
              >
                <option value="">انتخاب حساب بانک (تفصیلی)</option>
                {bankDetailAccounts && bankDetailAccounts.length > 0 ? (
                  bankDetailAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                      {account.person && ` (${account.person.name})`}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    ⚠️ هیچ حساب تفصیلی بانکی یافت نشد
                  </option>
                )}
              </Form.Select>
              {selectedBankAccount && (
                <Form.Text className="text-success">
                  ✅ حساب بانک انتخاب شده: {selectedBankAccount.code} - {selectedBankAccount.name}
                  {selectedBankInfo && ` (نام بانک: ${selectedBankInfo.name} - شعبه: ${selectedBankInfo.branch})`}
                </Form.Text>
              )}
              <Form.Text className="text-muted">
                حساب‌های تفصیلی زیرمجموعه حساب معین بانک‌ها (1-01-0001)
              </Form.Text>
            </Form.Group>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>تاریخ صدور *</Form.Label>
                <PersianDatePicker
                  selected={formData.issueDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, issueDate: date }))
                  }
                  placeholder="تاریخ صدور چک"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>تاریخ سررسید *</Form.Label>
                <PersianDatePicker
                  selected={formData.dueDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, dueDate: date }))
                  }
                  placeholder="تاریخ سررسید چک"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>شرح</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="شرح مختصر درباره چک"
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* پیش‌نمایش سند حسابداری */}
      {(formData.amount && formData.type === "receivable" && selectedDrawerAccount) && (
        <ChequeVoucherPreview 
          type="receivable"
          amount={displayAmount}
          drawerAccount={selectedDrawerAccount}
        />
      )}

      {(formData.amount && formData.type === "payable" && selectedPayeeAccount) && (
        <ChequeVoucherPreview 
          type="payable"
          amount={displayAmount}
          payeeAccount={selectedPayeeAccount}
          expenseAccount={selectedExpenseAccount}
          issueReason={formData.issueReason}
        />
      )}

      {/* دکمه‌های اقدام */}
      <div className="d-flex gap-2 justify-content-end">
        <Button
          type="button"
          variant="outline-secondary"
          onClick={handleCancel}
          disabled={loading}
        >
          انصراف
        </Button>

        <Button type="submit" variant="primary" disabled={loading} size="lg">
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              در حال ثبت...
            </>
          ) : initialData.id ? (
            "💾 ذخیره تغییرات"
          ) : formData.type === "receivable" ? (
            "💳 ثبت چک دریافتنی"
          ) : (
            `💳 ثبت چک پرداختنی (${getIssueReasonLabel(formData.issueReason)})`
          )}
        </Button>
      </div>

      {/* راهنما */}
      <Alert variant="info" className="mt-4">
        <strong>راهنما:</strong>
        <ul className="mb-0 mt-2">
          <li>فیلدهای ستاره‌دار (*) اجباری هستند</li>
          <li>چک دریافتنی: چکی که از دیگران دریافت می‌کنید</li>
          <li>چک پرداختنی: چکی که به دیگران می‌دهید</li>
          <li><strong>تسویه بدهی:</strong> وقتی قبلاً به طرف مقابل بدهکار بودید</li>
          <li><strong>هزینه/خرید:</strong> وقتی همزمان با صدور چک، هزینه یا خرید جدید (مانند موجودی کالا) ایجاد می‌شود. در این حالت، **سند حسابداری ۴ ردیفی** ایجاد می‌شود.</li>
          <li>حساب بانک برای وصول چک پرداختنی الزامی است</li>
          <li>نام بانک و صادرکننده/گیرنده به صورت خودکار از حساب‌های تفصیلی استخراج می‌شود</li>
        </ul>
      </Alert>
    </Form>
  );
}

// کامپوننت پیش‌نمایش سند حسابداری (با منطق ۴ ردیفی برای هزینه/خرید)
function ChequeVoucherPreview({ type, amount, drawerAccount, payeeAccount, expenseAccount, issueReason }) {
  // چک دریافتنی (۲ ردیف)
  if (type === "receivable") {
    return (
      <Card className="mb-4 border-success">
        <Card.Header className="bg-success text-white">
          <h6 className="mb-0">📝 سند حسابداری خودکار (دریافتنی)</h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>ردیف</th>
                  <th>حساب بدهکار (افزایش)</th>
                  <th>حساب بستانکار (کاهش)</th>
                  <th>مبلغ (ریال)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>۱</td>
                  <td>
                    <Badge bg="success" className="me-2">1-02-0001</Badge> 
                    چک‌های دریافتنی (جریان دارایی)
                  </td>
                  <td>
                    <Badge bg="info" className="me-2">
                      {drawerAccount.code}
                    </Badge>
                    {drawerAccount.name}
                  </td>
                  <td className="text-success fw-bold">{amount}</td>
                </tr>
                <tr>
                  <td>۲</td>
                  <td></td>
                  <td></td>
                  <td className="text-danger fw-bold">{amount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // چک پرداختنی (۲ یا ۴ ردیف)
  if (type === "payable") {
    return (
      <Card className="mb-4 border-warning">
        <Card.Header className="bg-warning text-dark">
          <h6 className="mb-0">📝 سند حسابداری خودکار (پرداختنی - {issueReason === 'expense' ? 'هزینه/خرید جدید' : 'تسویه بدهی موجود'})</h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>ردیف</th>
                  <th>حساب بدهکار</th>
                  <th>حساب بستانکار</th>
                  <th>مبلغ (ریال)</th>
                </tr>
              </thead>
              <tbody>
                {issueReason === "expense" ? (
                  <>
                    {/* مرحله ۱: ثبت هزینه/خرید (بدهکار: هزینه، بستانکار: شخص) - ایجاد بدهی */}
                    <tr>
                      <td>۱</td>
                      <td>
                        <Badge bg="danger" className="me-2">
                          {expenseAccount?.code}
                        </Badge>
                        {expenseAccount?.name} (هزینه/خرید)
                      </td>
                      <td>
                        <Badge bg="info" className="me-2">
                          {payeeAccount.code}
                        </Badge>
                        {payeeAccount.name} (بستانکاران تجاری)
                      </td>
                      <td className="text-success fw-bold">{amount}</td>
                    </tr>
                    {/* مرحله ۲: صدور چک (بدهکار: شخص، بستانکار: چک‌های پرداختنی) - تسویه بدهی */}
                    <tr>
                      <td>۲</td>
                      <td>
                        <Badge bg="info" className="me-2">
                          {payeeAccount.code}
                        </Badge>
                        {payeeAccount.name} (بستانکاران تجاری)
                      </td>
                      <td>
                        <Badge bg="success" className="me-2">3-01-0001</Badge>
                        چک‌های پرداختنی
                      </td>
                      <td className="text-danger fw-bold">{amount}</td>
                    </tr>
                    <tr className="table-secondary">
                        <td colSpan="4" className="text-center text-muted small">
                            {payeeAccount.name} (حساب گیرنده) یکبار بستانکار (ردیف ۱) و یکبار بدهکار (ردیف ۲) شده است.
                        </td>
                    </tr>
                  </>
                ) : (
                  <>
                    {/* حالت تسویه بدهی موجود (۲ ردیف) */}
                    <tr>
                      <td>۱</td>
                      <td>
                        <Badge bg="info" className="me-2">
                          {payeeAccount.code}
                        </Badge>
                        {payeeAccount.name} (بستانکاران تجاری)
                      </td>
                      <td>
                        <Badge bg="success" className="me-2">3-01-0001</Badge>
                        چک‌های پرداختنی
                      </td>
                      <td className="text-success fw-bold">{amount}</td>
                    </tr>
                     <tr>
                      <td>۲</td>
                      <td></td>
                      <td></td>
                      <td className="text-danger fw-bold">{amount}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return null;
}