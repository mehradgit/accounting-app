// src/app/banks/create/page.js - نسخه اصلاح شده
'use client'
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateBank() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createdDetailAccount, setCreatedDetailAccount] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    balance: '0'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')
    setCreatedDetailAccount(null)

    try {
      const response = await fetch('/api/banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('✅ حساب بانکی جدید با موفقیت ایجاد شد')
        
        // اگر API حساب تفصیلی هم برگرداند
        if (data.detailAccount) {
          setCreatedDetailAccount(data.detailAccount)
        }
        
        // چند ثانیه صبر کن و سپس به لیست بانک‌ها برو
        setTimeout(() => {
          router.push('/banks')
        }, 3000)
      } else {
        setError(data.error || 'خطا در ایجاد حساب بانکی')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // پاک کردن پیام‌ها هنگام تغییر فرم
    if (error) setError('')
    if (successMessage) setSuccessMessage('')
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>افزودن حساب بانکی جدید</h1>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <strong>خطا:</strong> {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-4">
          <strong>موفقیت:</strong> {successMessage}
          {createdDetailAccount && (
            <div className="mt-2">
              <small>
                حساب تفصیلی ایجاد شده: <strong>{createdDetailAccount.code}</strong> - {createdDetailAccount.name}
              </small>
            </div>
          )}
          <div className="mt-2">
            <small className="text-muted">
              در حال انتقال به صفحه لیست بانک‌ها...
            </small>
          </div>
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit} className="rtl">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>نام حساب بانک *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    placeholder="مثال: بانک ملی - شعبه مرکزی"
                  />
                  <Form.Text className="text-muted">
                    این نام به عنوان حساب تفصیلی بانک ثبت خواهد شد
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>شماره حساب</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    placeholder="مثال: 1234567890"
                  />
                  <Form.Text className="text-muted">
                    شماره حساب به نام حساب تفصیلی اضافه می‌شود
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>موجودی اولیه</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => handleChange('balance', e.target.value)}
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    موجودی اولیه حساب تفصیلی
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info" className="mb-4">
              <strong>💡 توجه:</strong>
              <ul className="mb-0 mt-2">
                <li>با ایجاد این حساب بانکی، یک حساب تفصیلی زیرمجموعه "بانک‌ها (1-01-0001)" نیز ایجاد خواهد شد</li>
                <li>این حساب تفصیلی در بخش "حساب‌های تفصیلی" و فرم‌های چک قابل انتخاب خواهد بود</li>
                <li>کد حساب تفصیلی به صورت خودکار ایجاد می‌شود (مثلاً 1-01-0001-001)</li>
              </ul>
            </Alert>

            <div className="d-flex gap-2">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading || successMessage}
              >
                {loading ? 'در حال ایجاد...' : 'ایجاد حساب بانکی'}
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => router.push('/banks')}
              >
                انصراف
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}