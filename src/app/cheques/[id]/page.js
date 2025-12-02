// src/app/cheques/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Card,
  Button,
  Row,
  Col,
  Badge,
  Table,
  Alert,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import Link from "next/link";
import { PersianDate } from "@lib/persianDate";
import PersianDatePicker from "@components/ui/PersianDatePicker";

export default function ChequeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [cheque, setCheque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: "",
    description: "",
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // دریافت اطلاعات چک
  useEffect(() => {
    if (id) {
      fetchCheque();
    }
  }, [id]);

  const fetchCheque = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cheques/${id}`);
      
      if (!response.ok) {
        throw new Error("چک مورد نظر یافت نشد");
      }
      
      const data = await response.json();
      setCheque(data);
      
      // تنظیم وضعیت فرم بر اساس وضعیت فعلی چک
      setStatusForm({
        status: data.status,
        description: data.description || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("آیا از حذف این چک اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) {
      try {
        const response = await fetch(`/api/cheques/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("چک با موفقیت حذف شد");
          router.push("/cheques");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "خطا در حذف چک");
        }
      } catch (err) {
        alert(`خطا در حذف چک: ${err.message}`);
      }
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setUpdatingStatus(true);
      
      const response = await fetch(`/api/cheques/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در به‌روزرسانی وضعیت");
      }

      const updatedCheque = await response.json();
      setCheque(updatedCheque);
      setShowStatusModal(false);
      alert("✅ وضعیت چک با موفقیت به‌روزرسانی شد");
    } catch (err) {
      alert(`❌ خطا در به‌روزرسانی وضعیت: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getTypeColor = (type) => {
    return type === "receivable" ? "success" : "warning";
  };

  const getTypeLabel = (type) => {
    return type === "receivable" ? "دریافتنی" : "پرداختنی";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      collected: "success",
      deposited: "info",
      returned: "danger",
      canceled: "secondary",
    };
    return colors[status] || "secondary";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "در انتظار",
      collected: "وصول شده",
      deposited: "در جریان وصول",
      returned: "برگشت خورده",
      canceled: "باطل شده",
    };
    return labels[status] || status;
  };

  const getIssueReasonLabel = (reason) => {
    return reason === "settlement" ? "تسویه بدهی" : "هزینه/خرید";
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount))
      return "۰ ریال";
    return Math.abs(amount).toLocaleString("fa-IR") + " ریال";
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری اطلاعات چک...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          <h5>❌ خطا</h5>
          <p>{error}</p>
          <div className="d-flex gap-2 mt-3">
            <Button variant="outline-danger" onClick={fetchCheque}>
              تلاش مجدد
            </Button>
            <Link href="/cheques">
              <Button variant="outline-secondary">بازگشت به لیست چک‌ها</Button>
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!cheque) {
    return (
      <Container>
        <Alert variant="warning">
          <h5>⚠️ چک یافت نشد</h5>
          <p>چک با شناسه {id} وجود ندارد.</p>
          <Link href="/cheques">
            <Button variant="outline-warning">بازگشت به لیست چک‌ها</Button>
          </Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-2">جزئیات چک</h1>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg={getTypeColor(cheque.type)} className="fs-6">
              {getTypeLabel(cheque.type)}
            </Badge>
            <Badge bg={getStatusColor(cheque.status)} className="fs-6">
              {getStatusLabel(cheque.status)}
            </Badge>
            {cheque.type === "payable" && (
              <Badge bg="info" className="fs-6">
                {getIssueReasonLabel(cheque.issueReason)}
              </Badge>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/cheques">
            <Button variant="outline-secondary">بازگشت</Button>
          </Link>
          <Link href={`/cheques/create?edit=${cheque.id}`}>
            <Button variant="outline-primary">ویرایش</Button>
          </Link>
          <Button variant="outline-danger" onClick={handleDelete}>
            حذف
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowStatusModal(true)}
          >
            تغییر وضعیت
          </Button>
        </div>
      </div>

      <Row>
        {/* اطلاعات اصلی چک */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📋 اطلاعات چک</h5>
              <small className="text-muted">
                شناسه: #{cheque.id} | ایجاد: {PersianDate.toPersian(cheque.createdAt)}
              </small>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">شماره چک</small>
                    <strong className="fs-5">{cheque.chequeNumber}</strong>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">مبلغ</small>
                    <strong className="fs-5 text-primary">
                      {formatCurrency(cheque.amount)}
                    </strong>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">نام بانک</small>
                    <strong>{cheque.bankName}</strong>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">شعبه</small>
                    <strong>{cheque.branchName || "نامشخص"}</strong>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">صادرکننده</small>
                    <strong>{cheque.drawer}</strong>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">گیرنده</small>
                    <strong>{cheque.payee || "نامشخص"}</strong>
                  </div>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">تاریخ صدور</small>
                    <strong>{PersianDate.toPersian(cheque.issueDate)}</strong>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">تاریخ سررسید</small>
                    <strong>{PersianDate.toPersian(cheque.dueDate)}</strong>
                  </div>
                </Col>
              </Row>

              {cheque.description && (
                <div className="mb-3">
                  <small className="text-muted d-block">شرح</small>
                  <p className="mb-0">{cheque.description}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* اطلاعات حسابداری */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">📊 اطلاعات حسابداری</h5>
            </Card.Header>
            <Card.Body>
              {cheque.voucher ? (
                <>
                  <div className="mb-3">
                    <small className="text-muted d-block">سند حسابداری</small>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="info">{cheque.voucher.voucherNumber}</Badge>
                      <span>{PersianDate.toPersian(cheque.voucher.voucherDate)}</span>
                      {cheque.voucher.description && (
                        <small className="text-muted">
                          - {cheque.voucher.description}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>حساب</th>
                          <th>نوع</th>
                          <th>بدهکار</th>
                          <th>بستانکار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* اینجا می‌توانید ردیف‌های سند را از API جداگانه دریافت کنید */}
                        <tr>
                          <td colSpan="5" className="text-center text-muted">
                            <small>
                              برای مشاهده جزئیات سند،{" "}
                              <Link href={`/vouchers/${cheque.voucher?.id}`}>
                                اینجا کلیک کنید
                              </Link>
                            </small>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </>
              ) : (
                <Alert variant="warning">
                  <span>⏳ سند حسابداری برای این چک ایجاد نشده است</span>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* سایدبار - اطلاعات مرتبط */}
        <Col lg={4}>
          {/* اطلاعات حساب تفصیلی */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">🏦 حساب‌های مرتبط</h6>
            </Card.Header>
            <Card.Body>
              {/* حساب بانک */}
              {cheque.bankDetailAccount && (
                <div className="mb-3">
                  <small className="text-muted d-block">حساب بانک</small>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="primary">{cheque.bankDetailAccount.code}</Badge>
                    <span>{cheque.bankDetailAccount.name}</span>
                  </div>
                </div>
              )}

              {/* حساب صادرکننده (برای دریافتنی) */}
              {cheque.type === "receivable" && cheque.drawerDetailAccount && (
                <div className="mb-3">
                  <small className="text-muted d-block">حساب صادرکننده</small>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="success">{cheque.drawerDetailAccount.code}</Badge>
                    <span>{cheque.drawerDetailAccount.name}</span>
                    {cheque.drawerDetailAccount.person && (
                      <Badge bg="info" className="ms-auto">
                        {cheque.drawerDetailAccount.person.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* حساب گیرنده (برای پرداختنی) */}
              {cheque.type === "payable" && cheque.payeeDetailAccount && (
                <div className="mb-3">
                  <small className="text-muted d-block">حساب گیرنده</small>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="warning">{cheque.payeeDetailAccount.code}</Badge>
                    <span>{cheque.payeeDetailAccount.name}</span>
                    {cheque.payeeDetailAccount.person && (
                      <Badge bg="info" className="ms-auto">
                        {cheque.payeeDetailAccount.person.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* حساب هزینه (برای پرداختنی بابت هزینه) */}
              {cheque.type === "payable" && 
               cheque.issueReason === "expense" && 
               cheque.expenseDetailAccount && (
                <div className="mb-3">
                  <small className="text-muted d-block">حساب هزینه/خرید</small>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="danger">{cheque.expenseDetailAccount.code}</Badge>
                    <span>{cheque.expenseDetailAccount.name}</span>
                  </div>
                </div>
              )}

              {/* شخص مرتبط */}
              {cheque.person && (
                <div className="mb-3">
                  <small className="text-muted d-block">شخص مرتبط</small>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="secondary">
                      {cheque.person.type === "customer" ? "مشتری" : 
                       cheque.person.type === "supplier" ? "تامین‌کننده" : "کارمند"}
                    </Badge>
                    <span>{cheque.person.name}</span>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* تاریخچه وضعیت */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">📅 تاریخچه</h6>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="timeline-item">
                  <small className="text-muted">ایجاد شده در</small>
                  <div>{PersianDate.toPersian(cheque.createdAt)}</div>
                </div>
                {cheque.updatedAt && cheque.updatedAt !== cheque.createdAt && (
                  <div className="timeline-item">
                    <small className="text-muted">آخرین ویرایش</small>
                    <div>{PersianDate.toPersian(cheque.updatedAt)}</div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* اقدامات سریع */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">⚡ اقدامات سریع</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={() => window.print()}
                >
                  🖨️ چاپ اطلاعات
                </Button>
                
                {cheque.voucher && (
                  <Link href={`/vouchers/${cheque.voucher.id}`}>
                    <Button variant="outline-info">
                      📄 مشاهده سند حسابداری
                    </Button>
                  </Link>
                )}
                
                <Link href={`/cheques/create?copy=${cheque.id}`}>
                  <Button variant="outline-success">
                    📋 ایجاد کپی از چک
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* مودال تغییر وضعیت */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تغییر وضعیت چک</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>وضعیت جدید</Form.Label>
              <Form.Select
                value={statusForm.status}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, status: e.target.value })
                }
              >
                <option value="pending">⏳ در انتظار</option>
                <option value="collected">✅ وصول شده</option>
                <option value="deposited">🏦 در جریان وصول</option>
                <option value="returned">↩️ برگشت خورده</option>
                <option value="canceled">❌ باطل شده</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>شرح وضعیت (اختیاری)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={statusForm.description}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, description: e.target.value })
                }
                placeholder="شرح مختصر درباره تغییر وضعیت..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowStatusModal(false)}
          >
            انصراف
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusUpdate}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                در حال ذخیره...
              </>
            ) : (
              "ذخیره تغییرات"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 20px;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #e9ecef;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 15px;
        }
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -20px;
          top: 5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #6c757d;
        }
        .timeline-item:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </Container>
  );
}