// src/app/inventory/page.js
'use client'
import { Container, Row, Col, Card, Button, Table, Badge, Alert } from 'react-bootstrap'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    warehousesCount: 0
  })
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      // در آینده این API‌ها را ایجاد می‌کنیم
      const [productsRes, warehousesRes] = await Promise.all([
        fetch('/api/inventory/products'),
        fetch('/api/inventory/warehouses')
      ])

      if (productsRes.ok && warehousesRes.ok) {
        const products = await productsRes.json()
        const warehouses = await warehousesRes.json()

        // محاسبه آمار
        const totalValue = products.reduce((sum, product) => sum + product.stockValue, 0)
        const lowStock = products.filter(p => p.minStock && p.stockQuantity <= p.minStock)

        setStats({
          totalProducts: products.length,
          totalValue,
          lowStockCount: lowStock.length,
          warehousesCount: warehouses.length
        })
        setLowStockProducts(lowStock.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount))
      return '۰ ریال'
    return Math.abs(amount).toLocaleString('fa-IR') + ' ریال'
  }

  return (
    <Container>
      {/* هدر صفحه */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">🚚 مدیریت انبار</h1>
          <p className="text-muted mb-0">مدیریت موجودی کالاها، ورود و خروج و گزارش‌های انبار</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/inventory/transactions/create">
            <Button variant="primary">📝 ثبت تراکنش انبار</Button>
          </Link>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-light">
            <Card.Body>
              <div className="fs-4 mb-2">📦</div>
              <Card.Title className="h6">تعداد کالاها</Card.Title>
              <Card.Text className="h3 text-primary">
                {stats.totalProducts}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <div className="fs-4 mb-2">💰</div>
              <Card.Title className="h6">ارزش کل موجودی</Card.Title>
              <Card.Text className="h3">
                {formatCurrency(stats.totalValue)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning text-dark">
            <Card.Body>
              <div className="fs-4 mb-2">⚠️</div>
              <Card.Title className="h6">کالاهای کم‌موجود</Card.Title>
              <Card.Text className="h3">
                {stats.lowStockCount}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-info text-white">
            <Card.Body>
              <div className="fs-4 mb-2">🏭</div>
              <Card.Title className="h6">تعداد انبارها</Card.Title>
              <Card.Text className="h3">
                {stats.warehousesCount}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* لینک‌های سریع */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">⚡ دسترسی سریع</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link href="/inventory/products">
                  <Button variant="outline-primary" className="text-start">
                    📦 مدیریت کالاها
                  </Button>
                </Link>
                <Link href="/inventory/warehouses">
                  <Button variant="outline-secondary" className="text-start">
                    🏭 مدیریت انبارها
                  </Button>
                </Link>
                <Link href="/inventory/transactions">
                  <Button variant="outline-success" className="text-start">
                    📝 تراکنش‌های انبار
                  </Button>
                </Link>
                <Link href="/inventory/reports">
                  <Button variant="outline-info" className="text-start">
                    📊 گزارش‌های انبار
                  </Button>
                </Link>
                <Link href="/inventory/products/create">
                  <Button variant="outline-warning" className="text-start">
                    ➕ ثبت کالای جدید
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* هشدار کمبود موجودی */}
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">⚠️ کالاهای کم‌موجود</h5>
              <Badge bg="warning">{stats.lowStockCount}</Badge>
            </Card.Header>
            <Card.Body>
              {stats.lowStockCount > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>کد کالا</th>
                      <th>نام کالا</th>
                      <th>موجودی</th>
                      <th>حداقل</th>
                      <th>تفاوت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(product => (
                      <tr key={product.id}>
                        <td className="font-monospace">{product.code}</td>
                        <td>{product.name}</td>
                        <td className="text-danger fw-bold">
                          {product.stockQuantity} {product.unit?.symbol}
                        </td>
                        <td className="text-muted">
                          {product.minStock || 0} {product.unit?.symbol}
                        </td>
                        <td>
                          <Badge bg="danger">
                            {product.minStock - product.stockQuantity} {product.unit?.symbol}
                          </Badge>
                        </td>
                        <td>
                          <Link href={`/inventory/products/${product.id}`}>
                            <Button variant="outline-primary" size="sm">
                              مشاهده
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="success">
                  ✅ تمام کالاها موجودی کافی دارند
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* آخرین تراکنش‌ها */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">🕒 آخرین تراکنش‌ها</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <p className="mb-0">
              این بخش پس از ایجاد سیستم تراکنش‌ها کامل خواهد شد.
              <Link href="/inventory/transactions/create" className="ms-2">
                <Button variant="outline-primary" size="sm">
                  ایجاد اولین تراکنش
                </Button>
              </Link>
            </p>
          </Alert>
        </Card.Body>
      </Card>

      {/* توضیحات سیستم */}
      <Alert variant="info" className="mt-4">
        <h5>📋 ویژگی‌های سیستم انبارداری</h5>
        <ul className="mb-0 mt-2">
          <li><strong>مدیریت چند انباره:</strong> امکان تعریف چند انبار و انتقال بین آن‌ها</li>
          <li><strong>پیگیری موجودی:</strong> ردیابی دقیق موجودی هر کالا در هر انبار</li>
          <li><strong>هشدار کمبود:</strong> اطلاع‌رسانی خودکار هنگام کمبود موجودی</li>
          <li><strong>ارتباط با حسابداری:</strong> ایجاد خودکار سند حسابداری برای تراکنش‌های انبار</li>
          <li><strong>گزارش‌های پیشرفته:</strong> گردش کالا، ارزش موجودی، سود و زیان</li>
          <li><strong>روش‌های محاسبه بهای تمام شده:</strong> FIFO، LIFO، میانگین موزون</li>
        </ul>
      </Alert>
    </Container>
  )
}