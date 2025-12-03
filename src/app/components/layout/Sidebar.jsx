'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Navbar, 
  Nav, 
  Container, 
  NavDropdown,
  Offcanvas
} from 'react-bootstrap'

export default function Sidebar() {
  const pathname = usePathname()
  const [showOffcanvas, setShowOffcanvas] = useState(false)

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // بستن offcanvas وقتی route تغییر می‌کند
  useEffect(() => {
    setShowOffcanvas(false)
  }, [pathname])

  return (
    <>
      {/* Navbar برای موبایل */}
      <Navbar expand="lg" className="d-lg-none bg-dark text-white fixed-top" style={{ zIndex: 1040 }}>
        <Container fluid>
          <Navbar.Brand className="text-white">
            <span className="me-2">🧮</span>
            سیستم حسابداری
          </Navbar.Brand>
          <Navbar.Toggle 
            aria-controls="offcanvasNavbar"
            onClick={() => setShowOffcanvas(true)}
            className="border-0"
          />
        </Container>
      </Navbar>

      {/* Offcanvas برای موبایل */}
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="end"
        className="bg-dark text-white"
        style={{ width: '280px' }}
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>
            <span className="me-2">🧮</span>
            سیستم حسابداری
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarContent isMobile={true} isActive={isActive} />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Sidebar برای دسکتاپ */}
      <div className="d-none d-lg-block" style={{ width: '280px' }}>
        <div className="sidebar-desktop bg-dark text-white vh-100 position-fixed start-0 top-0 overflow-y-auto" style={{ width: '280px', zIndex: 1030 }}>
          <div className="p-3 border-bottom border-secondary">
            <h5 className="mb-0 text-center">
              <span className="me-2">🧮</span>
              سیستم حسابداری
            </h5>
          </div>
          <SidebarContent isMobile={false} isActive={isActive} />
        </div>
      </div>
    </>
  )
}

// کامپوننت محتوای سایدبار
function SidebarContent({ isMobile, isActive }) {
  return (
    <Nav className="flex-column p-3">
      {/* داشبورد */}
      <Nav.Item>
        <Nav.Link 
          as={Link} 
          href="/dashboard" 
          className={`text-white py-3 ${isActive('/dashboard') ? 'bg-primary' : 'hover-bg-secondary'}`}
        >
          <span className="me-2">📊</span>
          داشبورد
        </Nav.Link>
      </Nav.Item>

      {/* سیستم انبارداری */}
      <NavDropdown
        title={
          <span>
            <span className="me-2">📦</span>
            سیستم انبارداری
          </span>
        }
        id="inventory-dropdown"
        className="text-white py-3"
        menuVariant="dark"
        show={isActive('/inventory') ? true : undefined}
      >
        <NavDropdown.Item 
          as={Link} 
          href="/inventory"
          className={isActive('/inventory') ? 'active' : ''}
        >
          <span className="me-2">🏠</span>
          داشبورد انبار
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/inventory/products"
          className={isActive('/inventory/products') ? 'active' : ''}
        >
          <span className="me-2">📦</span>
          کالاها
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/inventory/warehouses"
          className={isActive('/inventory/warehouses') ? 'active' : ''}
        >
          <span className="me-2">🏪</span>
          انبارها
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/inventory/product-categories"
          className={isActive('/inventory/product-categories') ? 'active' : ''}
        >
          <span className="me-2">🏷️</span>
          گروه کالا
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/inventory/units"
          className={isActive('/inventory/units') ? 'active' : ''}
        >
          <span className="me-2">📏</span>
          واحدها
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item 
          as={Link} 
          href="/inventory/documents"
          className={isActive('/inventory/documents') ? 'active' : ''}
        >
          <span className="me-2">📋</span>
          اسناد انبار
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/inventory/transaction-types"
          className={isActive('/inventory/transaction-types') ? 'active' : ''}
        >
          <span className="me-2">🔧</span>
          انواع اسناد
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/inventory/reports"
          className={isActive('/inventory/reports') ? 'active' : ''}
        >
          <span className="me-2">📊</span>
          گزارشات انبار
        </NavDropdown.Item>
      </NavDropdown>

      {/* اسناد حسابداری */}
      <NavDropdown
        title={
          <span>
            <span className="me-2">📝</span>
            اسناد حسابداری
          </span>
        }
        id="vouchers-dropdown"
        className="text-white py-3"
        menuVariant="dark"
      >
        <NavDropdown.Item 
          as={Link} 
          href="/vouchers"
          className={isActive('/vouchers') ? 'active' : ''}
        >
          لیست اسناد
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/vouchers/create"
          className={isActive('/vouchers/create') ? 'active' : ''}
        >
          ثبت سند جدید
        </NavDropdown.Item>
      </NavDropdown>

      {/* مدیریت حساب‌ها */}
      <NavDropdown
        title={
          <span>
            <span className="me-2">🏦</span>
            مدیریت حساب‌ها
          </span>
        }
        id="accounts-dropdown"
        className="text-white py-3"
        menuVariant="dark"
      >
        <NavDropdown.Header>حساب‌های معین</NavDropdown.Header>
        <NavDropdown.Item 
          as={Link} 
          href="/accounts"
          className={isActive('/accounts') ? 'active' : ''}
        >
          <span className="me-2">📋</span>
          لیست حساب‌های معین
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/accounts/create"
          className={isActive('/accounts/create') ? 'active' : ''}
        >
          <span className="me-2">➕</span>
          ایجاد حساب معین
        </NavDropdown.Item>
        
        <NavDropdown.Divider />
        
        <NavDropdown.Header>حساب‌های تفصیلی</NavDropdown.Header>
        <NavDropdown.Item 
          as={Link} 
          href="/detail-accounts"
          className={isActive('/detail-accounts') ? 'active' : ''}
        >
          <span className="me-2">📋</span>
          لیست حساب‌های تفصیلی
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/detail-accounts/create"
          className={isActive('/detail-accounts/create') ? 'active' : ''}
        >
          <span className="me-2">➕</span>
          ایجاد حساب تفصیلی
        </NavDropdown.Item>

        <NavDropdown.Divider />
        
        <NavDropdown.Header>حساب‌های کل</NavDropdown.Header>
        <NavDropdown.Item 
          as={Link} 
          href="/categories"
          className={isActive('/categories') ? 'active' : ''}
        >
          <span className="me-2">📊</span>
          مشاهده ساختار حساب‌ها
        </NavDropdown.Item>
      </NavDropdown>

      {/* مدیریت اشخاص */}
      <NavDropdown
        title={
          <span>
            <span className="me-2">👥</span>
            مدیریت اشخاص
          </span>
        }
        id="persons-dropdown"
        className="text-white py-3"
        menuVariant="dark"
      >
        <NavDropdown.Item 
          as={Link} 
          href="/persons"
          className={isActive('/persons') ? 'active' : ''}
        >
          <span className="me-2">📋</span>
          لیست اشخاص
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/persons/create"
          className={isActive('/persons/create') ? 'active' : ''}
        >
          <span className="me-2">➕</span>
          افزودن شخص جدید
        </NavDropdown.Item>
      </NavDropdown>

      {/* مدیریت چک‌ها */}
      <Nav.Item>
        <Nav.Link 
          as={Link} 
          href="/cheques" 
          className={`text-white py-3 ${isActive('/cheques') ? 'bg-primary' : 'hover-bg-secondary'}`}
        >
          <span className="me-2">💳</span>
          مدیریت چک‌ها
        </Nav.Link>
      </Nav.Item>

      {/* بانک‌ها و صندوق */}
      <Nav.Item>
        <Nav.Link 
          as={Link} 
          href="/banks" 
          className={`text-white py-3 ${isActive('/banks') ? 'bg-primary' : 'hover-bg-secondary'}`}
        >
          <span className="me-2">💰</span>
          بانک‌ها و صندوق
        </Nav.Link>
      </Nav.Item>

      {/* گزارش‌های مالی */}
      <NavDropdown
        title={
          <span>
            <span className="me-2">📈</span>
            گزارش‌های مالی
          </span>
        }
        id="reports-dropdown"
        className="text-white py-3"
        menuVariant="dark"
      >
        <NavDropdown.Header>گزارش‌های اصلی</NavDropdown.Header>
        <NavDropdown.Item 
          as={Link} 
          href="/reports"
          className={isActive('/reports') ? 'active' : ''}
        >
          <span className="me-2">📊</span>
          خلاصه گزارش‌ها
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/reports/balance-sheet"
          className={isActive('/reports/balance-sheet') ? 'active' : ''}
        >
          <span className="me-2">⚖️</span>
          ترازنامه
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/reports/profit-loss"
          className={isActive('/reports/profit-loss') ? 'active' : ''}
        >
          <span className="me-2">📉</span>
          سود و زیان
        </NavDropdown.Item>
        
        <NavDropdown.Divider />
        
        <NavDropdown.Header>گزارش‌های تفصیلی</NavDropdown.Header>
        <NavDropdown.Item 
          as={Link} 
          href="/reports/account-turnover"
          className={isActive('/reports/account-turnover') ? 'active' : ''}
        >
          <span className="me-2">🔄</span>
          گردش حساب‌ها
        </NavDropdown.Item>
        <NavDropdown.Item 
          as={Link} 
          href="/reports/general-ledger"
          className={isActive('/reports/general-ledger') ? 'active' : ''}
        >
          <span className="me-2">📖</span>
          دفتر کل
        </NavDropdown.Item>
      </NavDropdown>
    </Nav>
  )
}