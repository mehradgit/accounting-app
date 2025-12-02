// src/app/banks/[id]/page.js - نسخه کامل با گزارشات
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Container, Card, Table, Button, Row, Col, Badge, 
  Alert, Spinner, Modal, Form, Tabs, Tab, InputGroup, 
  FormControl, Dropdown, DropdownButton
} from 'react-bootstrap'
import { PersianDate } from '@lib/persianDate'
import PersianDatePicker from '@components/ui/PersianDatePicker'

export default function BankDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bank, setBank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchBank()
    }
  }, [params.id])

  const fetchBank = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/banks/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setBank(data)
        setFormData({
          name: data.name,
          accountNumber: data.accountNumber || '',
          balance: data.balance.toString()
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'بانک یافت نشد')
      }
    } catch (error) {
      console.error('Error fetching bank:', error)
      setError('خطا در دریافت اطلاعات بانک')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditMode(true)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setFormData({
      name: bank.name,
      accountNumber: bank.accountNumber || '',
      balance: bank.balance.toString()
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('نام حساب بانکی الزامی است')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/banks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedBank = await response.json()
        setBank(updatedBank)
        setEditMode(false)
        alert('اطلاعات حساب بانکی با موفقیت به‌روزرسانی شد')
        fetchBank() // رفرش اطلاعات
      } else {
        const error = await response.json()
        alert(`خطا: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating bank:', error)
      alert('خطا در به‌روزرسانی اطلاعات')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/banks/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('حساب بانکی با موفقیت حذف شد')
        router.push('/banks')
      } else {
        const error = await response.json()
        alert(`خطا: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting bank:', error)
      alert('خطا در حذف حساب بانکی')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount))
      return '۰ ریال'
    return Math.abs(amount).toLocaleString('fa-IR') + ' ریال'
  }

  const filterTransactions = () => {
    if (!bank || !bank.transactions) return []
    
    let filtered = bank.transactions
    
    // فیلتر بر اساس تاریخ
    if (filterStartDate) {
      const start = new Date(filterStartDate)
      filtered = filtered.filter(t => new Date(t.voucher.voucherDate) >= start)
    }
    
    if (filterEndDate) {
      const end = new Date(filterEndDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(t => new Date(t.voucher.voucherDate) <= end)
    }
    
    // فیلتر بر اساس جستجو
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.voucher.description?.toLowerCase().includes(term) ||
        t.voucher.voucherNumber?.toLowerCase().includes(term) ||
        t.subAccount?.name?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term)
      )
    }
    
    return filtered
  }

  const exportToExcel = () => {
    if (!bank || !bank.transactions || bank.transactions.length === 0) {
      alert('تراکنشی برای خروجی گرفتن وجود ندارد')
      return
    }
    
    const transactions = filterTransactions()
    const csvContent = [
      ['تاریخ', 'شماره سند', 'شرح', 'بدهکار', 'بستانکار', 'شماره چک', 'طرف حساب'],
      ...transactions.map(t => [
        PersianDate.toPersian(t.voucher.voucherDate),
        t.voucher.voucherNumber || '-',
        t.description || t.voucher.description || '-',
        t.debit || '0',
        t.credit || '0',
        t.cheque?.chequeNumber || '-',
        t.person?.name || t.subAccount?.name || '-'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `تراکنش‌های_${bank.name}_${PersianDate.today()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">در حال بارگذاری اطلاعات حساب بانکی...</p>
        </div>
      </Container>
    )
  }

  if (error || !bank) {
    return (
      <Container>
        <Alert variant="danger">
          <h5>خطا در دریافت اطلاعات</h5>
          <p>{error || 'حساب بانکی یافت نشد'}</p>
          <Button variant="outline-danger" onClick={() => router.push('/banks')}>
            بازگشت به لیست حساب‌های بانکی
          </Button>
        </Alert>
      </Container>
    )
  }

  const filteredTransactions = filterTransactions()

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">{bank.name}</h1>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="info">💳 حساب بانکی</Badge>
            {bank.detailAccount && (
              <Badge bg="primary" className="font-monospace">
                کد: {bank.detailAccount.code}
              </Badge>
            )}
            <span className="text-muted">| شناسه: {bank.id}</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            onClick={() => router.push('/banks')}
          >
            بازگشت به لیست
          </Button>
          {!editMode && (
            <>
              <Button variant="outline-primary" onClick={handleEdit}>
                ✏️ ویرایش
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ حذف
              </Button>
            </>
          )}
        </div>
      </div>

      {/* تب‌های اصلی */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        fill
      >
        <Tab eventKey="info" title="📋 اطلاعات حساب">
          <Row className="mt-3">
            {/* اطلاعات حساب بانکی */}
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">اطلاعات حساب بانکی</h5>
                </Card.Header>
                <Card.Body>
                  {editMode ? (
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>نام حساب *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          required
                          placeholder="مثال: بانک ملی - حساب جاری"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>شماره حساب</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => handleFormChange('accountNumber', e.target.value)}
                          placeholder="شماره حساب بانکی"
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>موجودی (ریال)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={formData.balance}
                          onChange={(e) => handleFormChange('balance', e.target.value)}
                          required
                        />
                      </Form.Group>

                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-secondary" 
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          انصراف
                        </Button>
                        <Button 
                          variant="primary" 
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              در حال ذخیره...
                            </>
                          ) : (
                            'ذخیره تغییرات'
                          )}
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <Table borderless>
                      <tbody>
                        <tr>
                          <td width="160" className="fw-bold text-muted">نام حساب:</td>
                          <td className="fw-bold h5">{bank.name}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">شماره حساب:</td>
                          <td>{bank.accountNumber || <span className="text-muted">ثبت نشده</span>}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">موجودی:</td>
                          <td className={`h5 ${bank.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(bank.balance)}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">تاریخ ایجاد:</td>
                          <td>{PersianDate.toPersian(bank.createdAt)}</td>
                        </tr>
                        {bank.detailAccount && (
                          <>
                            <tr>
                              <td className="fw-bold text-muted">کد حسابداری:</td>
                              <td className="font-monospace">{bank.detailAccount.code}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold text-muted">حساب تفصیلی:</td>
                              <td>{bank.detailAccount.name}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* خلاصه مالی */}
            <Col md={6}>
              <Card className="mb-4 bg-light">
                <Card.Body className="text-center">
                  <h6 className="text-muted mb-3">📊 آمار مالی</h6>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-white rounded shadow-sm">
                        <small className="text-muted d-block">تعداد تراکنش‌ها</small>
                        <h3 className="mb-0 text-primary">
                          {bank.financialStats?.transactionCount || 0}
                        </h3>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="p-3 bg-white rounded shadow-sm">
                        <small className="text-muted d-block">مجموع بدهکار</small>
                        <h3 className="mb-0 text-success">
                          {formatCurrency(bank.financialStats?.totalDebit || 0)}
                        </h3>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-white rounded shadow-sm">
                        <small className="text-muted d-block">مجموع بستانکار</small>
                        <h3 className="mb-0 text-danger">
                          {formatCurrency(bank.financialStats?.totalCredit || 0)}
                        </h3>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-white rounded shadow-sm">
                        <small className="text-muted d-block">آخرین تراکنش</small>
                        <h6 className="mb-0">
                          {bank.financialStats?.lastTransactionDate 
                            ? PersianDate.toPersian(bank.financialStats.lastTransactionDate)
                            : 'ندارد'}
                        </h6>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* عملیات سریع */}
              <Card>
                <Card.Header>
                  <h6 className="mb-0">⚡ عملیات سریع</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-success"
                      onClick={() => router.push('/vouchers/create')}
                    >
                      ➕ ثبت تراکنش جدید
                    </Button>
                    <Button 
                      variant="outline-primary"
                      onClick={() => setActiveTab('transactions')}
                    >
                      📋 مشاهده ریز تراکنش‌ها
                    </Button>
                    <Button 
                      variant="outline-info"
                      onClick={() => router.push('/reports')}
                    >
                      📊 گزارش‌های مالی
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="transactions" title="💰 ریز تراکنش‌ها">
          <div className="mt-3">
            {/* فیلترها */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">فیلترها و جستجو</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>از تاریخ</Form.Label>
                      <PersianDatePicker
                        selected={filterStartDate}
                        onChange={setFilterStartDate}
                        placeholder="از تاریخ"
                        className="w-100"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>تا تاریخ</Form.Label>
                      <PersianDatePicker
                        selected={filterEndDate}
                        onChange={setFilterEndDate}
                        placeholder="تا تاریخ"
                        minDate={filterStartDate}
                        className="w-100"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>جستجو</Form.Label>
                      <InputGroup>
                        <FormControl
                          placeholder="جستجو در شرح، شماره سند..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button 
                          variant="outline-secondary"
                          onClick={() => {
                            setSearchTerm('')
                            setFilterStartDate('')
                            setFilterEndDate('')
                          }}
                        >
                          پاک کردن
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button 
                      variant="outline-success" 
                      className="w-100"
                      onClick={exportToExcel}
                      disabled={!bank.transactions || bank.transactions.length === 0}
                    >
                      📥 خروجی Excel
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* جدول تراکنش‌ها */}
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  ریز تراکنش‌ها
                  <Badge bg="secondary" className="ms-2">
                    {filteredTransactions.length}
                  </Badge>
                </h5>
                <small className="text-muted">
                  {bank.detailAccount && `حساب تفصیلی: ${bank.detailAccount.code}`}
                </small>
              </Card.Header>
              <Card.Body className="p-0">
                {filteredTransactions.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped bordered hover className="mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th width="120">تاریخ</th>
                          <th width="120">شماره سند</th>
                          <th>شرح</th>
                          <th width="120">حساب مرتبط</th>
                          <th width="120" className="text-center">بدهکار</th>
                          <th width="120" className="text-center">بستانکار</th>
                          <th width="80" className="text-center">اقدامات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction, index) => (
                          <tr key={transaction.id}>
                            <td className="text-nowrap">
                              {PersianDate.toPersian(transaction.voucher.voucherDate)}
                            </td>
                            <td className="font-monospace">
                              {transaction.voucher.voucherNumber || '-'}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="me-2">
                                  {transaction.debit > 0 ? '📥' : '📤'}
                                </span>
                                {transaction.description || transaction.voucher.description || '-'}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column">
                                <small className="text-muted">
                                  {transaction.subAccount?.code || '-'}
                                </small>
                                <span>{transaction.person?.name || transaction.subAccount?.name || '-'}</span>
                              </div>
                            </td>
                            <td className="text-center text-success fw-bold">
                              {transaction.debit > 0 ? formatCurrency(transaction.debit) : '-'}
                            </td>
                            <td className="text-center text-danger fw-bold">
                              {transaction.credit > 0 ? formatCurrency(transaction.credit) : '-'}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => router.push(`/vouchers/${transaction.voucher.id}`)}
                                title="مشاهده سند"
                              >
                                👁️
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-active">
                        <tr>
                          <td colSpan="4" className="text-end fw-bold">
                            جمع کل:
                          </td>
                          <td className="text-center text-success fw-bold">
                            {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.debit || 0), 0))}
                          </td>
                          <td className="text-center text-danger fw-bold">
                            {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.credit || 0), 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="fs-1 mb-3">📊</div>
                    <h5 className="text-muted">تراکنشی یافت نشد</h5>
                    <p className="text-muted mb-3">
                      {bank.transactions?.length === 0 
                        ? 'هنوز هیچ تراکنشی برای این حساب بانکی ثبت نشده است.' 
                        : 'با فیلترهای فعلی هیچ تراکنشی یافت نشد.'
                      }
                    </p>
                    <Button 
                      variant="outline-primary"
                      onClick={() => router.push('/vouchers/create')}
                    >
                      ➕ ثبت اولین تراکنش
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* مودال حذف */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>حذف حساب بانکی</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <h6>⚠️ هشدار</h6>
            <p className="mb-0">
              آیا از حذف حساب بانکی <strong>"{bank.name}"</strong> اطمینان دارید؟
              <br />
              {bank.transactions?.length > 0 && (
                <span className="text-danger">
                  ⚠️ این حساب دارای {bank.transactions.length} تراکنش است.
                </span>
              )}
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            انصراف
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            حذف حساب بانکی
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}