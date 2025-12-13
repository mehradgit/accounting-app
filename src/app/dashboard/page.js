'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Box, Grid, Typography, Paper, Button, Chip, Stack } from '@mui/material'

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard'
import InventoryIcon from '@mui/icons-material/Inventory'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CategoryIcon from '@mui/icons-material/Category'
import DescriptionIcon from '@mui/icons-material/Description'
import BuildIcon from '@mui/icons-material/Build'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import PeopleIcon from '@mui/icons-material/People'
import ReceiptIcon from '@mui/icons-material/Receipt'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import BalanceIcon from '@mui/icons-material/Balance'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BookIcon from '@mui/icons-material/Book'
import SearchIcon from '@mui/icons-material/Search'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import SettingsIcon from '@mui/icons-material/Settings'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import AddBoxIcon from '@mui/icons-material/AddBox'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import HistoryIcon from '@mui/icons-material/History'
import BarChartIcon from '@mui/icons-material/BarChart'

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({})
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats({}))
    
    // شبیه‌سازی فعالیت‌های اخیر
    setRecentActivities([
      { id: 1, title: 'فاکتور فروش جدید', description: 'فاکتور شماره FV-2401-001 صادر شد', time: '۵ دقیقه پیش', icon: '📋', color: '#4CAF50' },
      { id: 2, title: 'ثبت سند حسابداری', description: 'سند شماره ۱۴۰ ثبت شد', time: '۱۰ دقیقه پیش', icon: '📒', color: '#2196F3' },
      { id: 3, title: 'خرید مواد اولیه', description: 'سند خرید PO-2401-005 ثبت شد', time: '۱ ساعت پیش', icon: '📦', color: '#FF9800' },
      { id: 4, title: 'چک جدید', description: 'چک دریافتی به شماره ۱۲۳۴ ثبت شد', time: '۲ ساعت پیش', icon: '🏦', color: '#9C27B0' },
    ])
  }, [])

  // گروه‌بندی تایل‌های اصلی
  const mainSections = [
    {
      title: 'حسابداری',
      color: '#2E7D32', // سبز تیره
      icon: <AttachMoneyIcon />,
      items: [
        { title: 'اسناد حسابداری', icon: <AssignmentIcon />, path: '/vouchers' },
        { title: 'ثبت سند جدید', icon: <AddCircleIcon />, path: '/vouchers/create' },
        { title: 'حساب‌های معین', icon: <AccountBalanceWalletIcon />, path: '/accounts' },
        { title: 'حساب‌های تفصیلی', icon: <AccountTreeIcon />, path: '/detail-accounts' },
        { title: 'ساختار حساب‌ها', icon: <CategoryIcon />, path: '/categories' },
      ]
    },
    {
      title: 'انبارداری',
      color: '#1565C0', // آبی تیره
      icon: <InventoryIcon />,
      items: [
        { title: 'کالاها', icon: <ShoppingCartIcon />, path: '/inventory/products' },
        { title: 'اسناد انبار', icon: <DescriptionIcon />, path: '/inventory/documents' },
        { title: 'انبارها', icon: <WarehouseIcon />, path: '/inventory/warehouses' },
        { title: 'گروه کالا', icon: <CategoryIcon />, path: '/inventory/product-categories' },
        { title: 'واحدها', icon: <BuildIcon />, path: '/inventory/units' },
        { title: 'انواع اسناد', icon: <SettingsIcon />, path: '/inventory/transaction-types' },
      ]
    },
    {
      title: 'فروش و فاکتور',
      color: '#D84315', // نارنجی تیره
      icon: <ReceiptLongIcon />,
      items: [
        { title: 'صدور فاکتور', icon: <ReceiptLongIcon />, path: '/inventory/documents/sales-invoice' },
        { title: 'لیست فاکتورها', icon: <FactCheckIcon />, path: '/inventory/documents/sales-list' },
        { title: 'ثبت فروش', icon: <LocalShippingIcon />, path: '/inventory/documents/create-sales' },
        { title: 'خرید مواد', icon: <Inventory2Icon />, path: '/inventory/documents/purchase-materials' },
      ]
    },
    {
      title: 'مدیریت بانکی',
      color: '#6A1B9A', // بنفش تیره
      icon: <AccountBalanceIcon />,
      items: [
        { title: 'مدیریت چک‌ها', icon: <ReceiptIcon />, path: '/cheques' },
        { title: 'بانک‌ها و صندوق', icon: <AccountBalanceIcon />, path: '/banks' },
        { title: 'ثبت چک جدید', icon: <AddCircleIcon />, path: '/cheques/create' },
      ]
    },
    {
      title: 'اشخاص',
      color: '#C62828', // قرمز تیره
      icon: <PeopleIcon />,
      items: [
        { title: 'لیست اشخاص', icon: <PeopleIcon />, path: '/persons' },
        { title: 'افزودن شخص', icon: <PersonAddIcon />, path: '/persons/create' },
      ]
    },
    {
      title: 'گزارش‌های مالی',
      color: '#00838F', // فیروزه‌ای تیره
      icon: <BarChartIcon />,
      items: [
        { title: 'ترازنامه', icon: <BalanceIcon />, path: '/reports/balance-sheet' },
        { title: 'سود و زیان', icon: <ShowChartIcon />, path: '/reports/profit-loss' },
        { title: 'دفتر کل', icon: <BookIcon />, path: '/reports/general-ledger' },
        { title: 'گردش حساب‌ها', icon: <TrendingUpIcon />, path: '/reports/account-turnover' },
        { title: 'خلاصه گزارش‌ها', icon: <AssessmentIcon />, path: '/reports' },
      ]
    },
    {
      title: 'گزارش‌های انبار',
      color: '#5D4037', // قهوه‌ای تیره
      icon: <AssessmentIcon />,
      items: [
        { title: 'وضعیت موجودی', icon: <AssessmentIcon />, path: '/inventory/reports/stock-status' },
        { title: 'حرکت کالا', icon: <BuildIcon />, path: '/inventory/reports/stock-movement' },
        { title: 'گردش انبار', icon: <TrendingUpIcon />, path: '/inventory/reports/inventory-turnover' },
        { title: 'گزارشات انبار', icon: <DescriptionIcon />, path: '/inventory/reports' },
      ]
    }
  ]

  // آمار مهم
  const importantStats = [
    { 
      label: 'اسناد حسابداری', 
      value: stats.totalVouchers || 0, 
      color: '#2E7D32', 
      icon: <AssignmentIcon />,
      path: '/vouchers'
    },
    { 
      label: 'اشخاص', 
      value: stats.totalPersons || 0, 
      color: '#1565C0', 
      icon: <PeopleIcon />,
      path: '/persons'
    },
    { 
      label: 'کالاها', 
      value: stats.totalProducts || 0, 
      color: '#D84315', 
      icon: <ShoppingCartIcon />,
      path: '/inventory/products'
    },
    { 
      label: 'چک‌های فعال', 
      value: ((stats.receivableCheques || 0) + (stats.payableCheques || 0)), 
      color: '#6A1B9A', 
      icon: <ReceiptIcon />,
      path: '/cheques'
    },
    { 
      label: 'حساب‌های معین', 
      value: stats.totalAccounts || 0, 
      color: '#00838F', 
      icon: <AccountBalanceWalletIcon />,
      path: '/accounts'
    },
    { 
      label: 'انبارها', 
      value: stats.totalWarehouses || 0, 
      color: '#5D4037', 
      icon: <WarehouseIcon />,
      path: '/inventory/warehouses'
    },
  ]

  return (
    <Box
      sx={{
        // width: '100vw',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        p: { xs: 2, md: 4 },
        overflowX: 'hidden'
      }}
    >
      {/* هدر */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold',
            color: 'white',
            mb: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            background: 'linear-gradient(90deg, #ffffff, #e0e0e0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
        🧮  سیستم حسابداری یکپارچه نگین آرا
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 3
          }}
        >
          مدیریت کامل فرآیندهای حسابداری و انبارداری
        </Typography>
      </Box>

      {/* آمار مهم در یک خط */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {importantStats.map((stat, index) => (
          <Grid item xs={6} sm={4} md={2} key={index}>
            <Paper
              onClick={() => router.push(stat.path)}
              elevation={0}
              sx={{
                p: 2,
                height: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.08)',
                  transform: 'translateY(-2px)',
                  borderColor: stat.color + '40'
                }
              }}
            >
              <Box sx={{ 
                color: stat.color,
                mb: 1,
                '& svg': { fontSize: 28 }
              }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" sx={{ 
                color: 'white',
                fontWeight: 'bold',
                mb: 0.5
              }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px'
              }}>
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* عملیات سریع */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 4, 
          p: 3,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ 
          color: 'white',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AddCircleIcon sx={{ color: '#4CAF50' }} /> 
          <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>عملیات سریع</span>
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddCircleIcon />}
              onClick={() => router.push('/vouchers/create')}
              sx={{
                color: '#4CAF50',
                borderColor: 'rgba(76, 175, 80, 0.3)',
                py: 1.5,
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#4CAF50',
                  background: 'rgba(76, 175, 80, 0.1)'
                }
              }}
            >
              ثبت سند جدید
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ReceiptLongIcon />}
              onClick={() => router.push('/inventory/documents/sales-invoice')}
              sx={{
                color: '#2196F3',
                borderColor: 'rgba(33, 150, 243, 0.3)',
                py: 1.5,
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#2196F3',
                  background: 'rgba(33, 150, 243, 0.1)'
                }
              }}
            >
              صدور فاکتور
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddBoxIcon />}
              onClick={() => router.push('/inventory/products/create')}
              sx={{
                color: '#9C27B0',
                borderColor: 'rgba(156, 39, 176, 0.3)',
                py: 1.5,
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#9C27B0',
                  background: 'rgba(156, 39, 176, 0.1)'
                }
              }}
            >
              ایجاد کالا
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => router.push('/persons/create')}
              sx={{
                color: '#FF9800',
                borderColor: 'rgba(255, 152, 0, 0.3)',
                py: 1.5,
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#FF9800',
                  background: 'rgba(255, 152, 0, 0.1)'
                }
              }}
            >
              افزودن شخص
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* بخش‌های اصلی */}
      {mainSections.map((section, sectionIndex) => (
        <Box key={sectionIndex} sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ 
            color: 'white',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ color: section.color }}>
              {section.icon}
            </Box>
            <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{section.title}</span>
          </Typography>
          
          <Grid container spacing={2}>
            {section.items.map((item, itemIndex) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={itemIndex}>
                <Paper
                  onClick={() => router.push(item.path)}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                      transform: 'translateY(-2px)',
                      borderColor: section.color + '40',
                      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`
                    }
                  }}
                >
                  <Box sx={{ 
                    color: section.color,
                    mb: 1.5,
                    '& svg': { fontSize: 24 }
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ 
                    color: 'white',
                    mb: 0.5,
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '11px'
                  }}>
                    {item.path.replace(/\//g, ' › ').replace(/-/g, ' ')}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {/* فعالیت‌های اخیر و گزارش‌های اضافی */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* فعالیت‌های اخیر */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" sx={{ 
              color: 'white',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <HistoryIcon sx={{ color: '#2196F3' }} /> 
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>فعالیت‌های اخیر</span>
            </Typography>
            
            <Stack spacing={2}>
              {recentActivities.map((activity) => (
                <Paper
                  key={activity.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 1.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: activity.color + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activity.color,
                      fontSize: '20px'
                    }}>
                      {activity.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                          {activity.title}
                        </Typography>
                        <Chip 
                          label={activity.time}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '10px',
                            height: '20px'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        mt: 0.5,
                        fontSize: '12px'
                      }}>
                        {activity.description}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* گزارش‌های اضافی */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" sx={{ 
              color: 'white',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <BarChartIcon sx={{ color: '#4CAF50' }} /> 
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>گزارش‌های پرکاربرد</span>
            </Typography>
            
            <Grid container spacing={2}>
              {[
                { title: 'لیست فاکتورها', icon: '📋', path: '/inventory/documents/sales-list', color: '#4CAF50' },
                { title: 'وضعیت موجودی', icon: '📊', path: '/inventory/reports/stock-status', color: '#2196F3' },
                { title: 'حرکت کالا', icon: '🔄', path: '/inventory/reports/stock-movement', color: '#FF9800' },
                { title: 'گردش انبار', icon: '📦', path: '/inventory/reports/inventory-turnover', color: '#9C27B0' },
                { title: 'جستجوی چک', icon: '🔍', path: '/cheques', color: '#00BCD4' },
                { title: 'داشبورد انبار', icon: '📈', path: '/inventory', color: '#E91E63' },
              ].map((report, index) => (
                <Grid item xs={6} key={index}>
                  <Paper
                    onClick={() => router.push(report.path)}
                    elevation={0}
                    sx={{
                      p: 2,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${report.color}20`,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        transform: 'translateY(-2px)',
                        borderColor: report.color + '40',
                        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`
                      }
                    }}
                  >
                    <Box sx={{ 
                      fontSize: '24px',
                      mb: 1,
                      color: report.color
                    }}>
                      {report.icon}
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {report.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '10px',
                      display: 'block',
                      mt: 0.5
                    }}>
                      {report.path.split('/').pop().replace(/-/g, ' ')}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* فوتر */}
      <Box sx={{ 
        mt: 4, 
        pt: 3, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
        textAlign: 'center' 
      }}>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.5)',
          mb: 1
        }}>
          🚀 سیستم حسابداری پیشرفته • {mainSections.reduce((sum, section) => sum + section.items.length, 0)} بخش فعال
        </Typography>
        <Typography variant="caption" sx={{ 
          color: 'rgba(255, 255, 255, 0.4)',
          display: 'block'
        }}>
          نسخه ۳.۰ • طراحی تیره • بهینه‌سازی شده برای کار طولانی مدت
        </Typography>
      </Box>
    </Box>
  )
}