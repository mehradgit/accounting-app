// src/app/banks/page.js - نسخه اصلاح شده
'use client'
import { useState, useEffect } from 'react'
import { Container, Table, Button, Card, Row, Col, Badge, Alert } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BanksPage() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchBanks()
  }, [])

  const fetchBanks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/banks')
      if (response.ok) {
        const data = await response.json()
        setBanks(data)
      } else {
        console.error('Error fetching banks')
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
    } finally {
      setLoading(false)
    }
  }

  // محاسبه مجموع موجودی‌های واقعی
  const totalRealBalance = banks.reduce((sum, bank) => sum + (bank.realBalance || 0), 0)
  
  // محاسبه مجموع موجودی‌های ذخیره شده
  const totalStoredBalance = banks.reduce((sum, bank) => sum + (bank.storedBalance || 0), 0)

  const handleDelete = async (id, name) => {
    if (window.confirm(`آیا از حذف "${name}" اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/banks/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('حساب بانکی با موفقیت حذف شد')
          fetchBanks() // رفرش لیست
        } else {
          const error = await response.json()
          alert(`خطا: ${error.error}`)
        }
      } catch (error) {
        console.error('Error deleting bank:', error)
        alert('خطا در حذف حساب بانکی')
      }
    }
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount))
      return '۰ ریال'
    return Math.abs(amount).toLocaleString('fa-IR') + ' ریال'
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <p className="mt-3">در حال بارگذاری حساب‌های بانکی...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">مدیریت حساب‌های بانکی</h1>
          <p className="text-muted mb-0">لیست کامل حساب‌های بانکی و موجودی واقعی آن‌ها</p>
        </div>
        <Link href="/banks/create">
          <Button variant="primary">
            ➕ افزودن حساب بانکی
          </Button>
        </Link>
      </div>

      {/* آمار */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-2">🏦</div>
              <Card.Title className="h6">تعداد حساب‌ها</Card.Title>
              <Card.Text className="h4 text-primary">
                {banks.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <div className="fs-4 mb-2">💰</div>
              <Card.Title className="h6">موجودی واقعی</Card.Title>
              <Card.Text className="h4">
                {formatCurrency(totalRealBalance)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-info text-white">
            <Card.Body>
              <div className="fs-4 mb-2">💳</div>
              <Card.Title className="h6">موجودی اولیه</Card.Title>
              <Card.Text className="h4">
                {formatCurrency(totalStoredBalance)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning text-dark">
            <Card.Body>
              <div className="fs-4 mb-2">⚖️</div>
              <Card.Title className="h6">تفاوت موجودی</Card.Title>
              <Card.Text className="h4">
                {formatCurrency(totalRealBalance - totalStoredBalance)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* لیست حساب‌های بانکی */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            لیست حساب‌های بانکی
            <Badge bg="secondary" className="ms-2">
              {banks.length}
            </Badge>
          </h5>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={fetchBanks}
          >
            🔄 بروزرسانی
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {banks.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th width="250">نام حساب</th>
                    <th width="120">کد حسابداری</th>
                    <th width="150">شماره حساب</th>
                    <th width="150" className="text-center">موجودی اولیه</th>
                    <th width="150" className="text-center">موجودی واقعی</th>
                    <th width="150" className="text-center">تفاوت</th>
                    <th width="120" className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(bank => {
                    const difference = (bank.realBalance || 0) - (bank.storedBalance || 0)
                    const hasDifference = Math.abs(difference) > 0.01 // حداقل تفاوت
                    
                    return (
                      <tr key={bank.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-2">🏦</span>
                            <div>
                              <div className="fw-bold">{bank.name}</div>
                              {bank.detailAccount && (
                                <small className="text-muted">
                                  {bank.detailAccount.name}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="font-monospace">
                          {bank.detailAccount ? (
                            <Badge bg="primary">{bank.detailAccount.code}</Badge>
                          ) : (
                            <span className="text-muted">ندارد</span>
                          )}
                        </td>
                        <td>{bank.accountNumber || '-'}</td>
                        <td className="text-center text-muted">
                          {formatCurrency(bank.storedBalance || 0)}
                        </td>
                        <td 
                          className={`text-center fw-bold ${
                            (bank.realBalance || 0) >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {formatCurrency(bank.realBalance || 0)}
                        </td>
                        <td className="text-center">
                          {hasDifference ? (
                            <Badge bg={difference > 0 ? 'success' : 'danger'}>
                              {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                            </Badge>
                          ) : (
                            <Badge bg="secondary">همسان</Badge>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => router.push(`/banks/${bank.id}`)}
                            >
                              مشاهده
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(bank.id, bank.name)}
                            >
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="table-active">
                  <tr>
                    <td colSpan="3" className="text-end fw-bold">
                      جمع کل:
                    </td>
                    <td className="text-center fw-bold">
                      {formatCurrency(totalStoredBalance)}
                    </td>
                    <td className="text-center fw-bold">
                      {formatCurrency(totalRealBalance)}
                    </td>
                    <td className="text-center fw-bold">
                      <Badge bg={totalRealBalance >= totalStoredBalance ? 'success' : 'danger'}>
                        {formatCurrency(totalRealBalance - totalStoredBalance)}
                      </Badge>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="fs-1 mb-3">🏦</div>
              <h5 className="text-muted">هیچ حساب بانکی ثبت نشده است</h5>
              <p className="text-muted mb-3">
                برای شروع، اولین حساب بانکی خود را ایجاد کنید.
              </p>
              <Link href="/banks/create">
                <Button variant="primary">
                  افزودن اولین حساب بانکی
                </Button>
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* توضیحات */}
      <Alert variant="info" className="mt-4">
        <strong>💡 توضیحات:</strong>
        <ul className="mb-0 mt-2">
          <li><strong>موجودی اولیه:</strong> مبلغی که هنگام ایجاد حساب بانکی ثبت شده است</li>
          <li><strong>موجودی واقعی:</strong> مانده حساب بر اساس تمام تراکنش‌های ثبت شده</li>
          <li><strong>تفاوت:</strong> اختلاف بین موجودی واقعی و موجودی اولیه</li>
          <li>✅ موجودی واقعی و اولیه معمولاً باید همسان باشند، مگر اینکه تراکنش‌های دیگری ثبت شده باشد</li>
        </ul>
      </Alert>
    </Container>
  )
}