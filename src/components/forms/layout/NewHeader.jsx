"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountBalanceWallet,
  Inventory,
  ReceiptLong,
  AccountBalance,
  People,
  BarChart,
  ExpandMore,
  ExpandLess,
  Dashboard,
  AddCircle,
  Search,
  ChevronRight,
} from "@mui/icons-material";

// منوی اصلی با ساختار سلسله‌مراتبی
const menuSections = [
  {
    title: "داشبورد",
    path: "/dashboard",
    icon: <Dashboard fontSize="small" />,
    color: "#2E7D32",
  },
  {
    title: "حسابداری",
    icon: <AccountBalanceWallet fontSize="small" />,
    color: "#1565C0",
    children: [
      { title: "اسناد حسابداری", path: "/vouchers", icon: <ChevronRight fontSize="small" /> },
      { title: "ثبت سند جدید", path: "/vouchers/create", icon: <AddCircle fontSize="small" /> },
      { title: "حساب‌های معین", path: "/accounts", icon: <ChevronRight fontSize="small" /> },
      { title: "حساب‌های تفصیلی", path: "/detail-accounts", icon: <ChevronRight fontSize="small" /> },
      { title: "ساختار حساب‌ها", path: "/categories", icon: <ChevronRight fontSize="small" /> },
    ],
  },
  {
    title: "انبارداری",
    icon: <Inventory fontSize="small" />,
    color: "#D84315",
    children: [
      { title: "کالاها", path: "/inventory/products", icon: <ChevronRight fontSize="small" /> },
      { title: "اسناد انبار", path: "/inventory/documents", icon: <ChevronRight fontSize="small" /> },
      { title: "انبارها", path: "/inventory/warehouses", icon: <ChevronRight fontSize="small" /> },
      { title: "گروه کالا", path: "/inventory/product-categories", icon: <ChevronRight fontSize="small" /> },
      { title: "واحدها", path: "/inventory/units", icon: <ChevronRight fontSize="small" /> },
      { title: "انواع اسناد", path: "/inventory/transaction-types", icon: <ChevronRight fontSize="small" /> },
    ],
  },
  {
    title: "فروش و فاکتور",
    icon: <ReceiptLong fontSize="small" />,
    color: "#9C27B0",
    children: [
      { title: "صدور فاکتور", path: "/inventory/documents/sales-invoice", icon: <AddCircle fontSize="small" /> },
      { title: "لیست فاکتورها", path: "/inventory/documents/sales-list", icon: <ChevronRight fontSize="small" /> },
      { title: "خرید مواد", path: "/inventory/documents/purchase-materials", icon: <ChevronRight fontSize="small" /> },
      { title: "ثبت تولید", path: "/inventory/documents/production-output", icon: <ChevronRight fontSize="small" /> },
      { title: "مصرف مواد", path: "/inventory/documents/production-consumption", icon: <ChevronRight fontSize="small" /> },
    ],
  },
  {
    title: "بانکی",
    icon: <AccountBalance fontSize="small" />,
    color: "#00838F",
    children: [
      { title: "مدیریت چک‌ها", path: "/cheques", icon: <ChevronRight fontSize="small" /> },
      { title: "بانک‌ها و صندوق", path: "/banks", icon: <ChevronRight fontSize="small" /> },
      { title: "ثبت چک جدید", path: "/cheques/create", icon: <AddCircle fontSize="small" /> },
    ],
  },
  {
    title: "اشخاص",
    icon: <People fontSize="small" />,
    color: "#C62828",
    children: [
      { title: "لیست اشخاص", path: "/persons", icon: <ChevronRight fontSize="small" /> },
      { title: "افزودن شخص", path: "/persons/create", icon: <AddCircle fontSize="small" /> },
    ],
  },
  {
    title: "گزارش‌ها",
    icon: <BarChart fontSize="small" />,
    color: "#5D4037",
    children: [
      { title: "ترازنامه", path: "/reports/balance-sheet", icon: <ChevronRight fontSize="small" /> },
      { title: "سود و زیان", path: "/reports/profit-loss", icon: <ChevronRight fontSize="small" /> },
      { title: "دفتر کل", path: "/reports/general-ledger", icon: <ChevronRight fontSize="small" /> },
      { title: "گردش حساب‌ها", path: "/reports/account-turnover", icon: <ChevronRight fontSize="small" /> },
      { title: "وضعیت موجودی", path: "/inventory/reports/stock-status", icon: <ChevronRight fontSize="small" /> },
      { title: "حرکت کالا", path: "/inventory/reports/stock-movement", icon: <ChevronRight fontSize="small" /> },
      { title: "گردش انبار", path: "/inventory/reports/inventory-turnover", icon: <ChevronRight fontSize="small" /> },
    ],
  },
];

// عملیات سریع
const quickActions = [
  { title: "سند جدید", path: "/vouchers/create", color: "#4CAF50" },
  { title: "فاکتور جدید", path: "/inventory/documents/sales-invoice", color: "#2196F3" },
  { title: "کالای جدید", path: "/inventory/products/create", color: "#9C27B0" },
  { title: "شخص جدید", path: "/persons/create", color: "#FF9800" },
];

export default function NewHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpenMenu, setMobileOpenMenu] = useState(null);

  // ref برای detection کلیک بیرون منوها
  const menuContainerRef = useRef(null);

  // مدیریت باز/بسته کردن منوها
  const handleMenuOpen = (sectionTitle) => (event) => {
    if (isMobile) {
      setMobileOpenMenu((prev) => (prev === sectionTitle ? null : sectionTitle));
    } else {
      // تنها یک منو در یک زمان باز باشد:
      setOpenMenus((prev) => {
        const wasOpen = !!prev[sectionTitle];
        if (wasOpen) {
          // اگر روی همان منو کلیک شد: ببند
          setAnchorEl(null);
          return {};
        } else {
          // باز کردن منوی جدید و بستن بقیه
          setAnchorEl(event.currentTarget);
          return { [sectionTitle]: true };
        }
      });
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOpenMenus({});
    setMobileOpenMenu(null);
  };

  const handleNavigate = (path) => {
    router.push(path);
    handleMenuClose();
    setDrawerOpen(false);
  };

  // بسته شدن منوها هنگام کلیک بیرون (desktop)
  useEffect(() => {
    function onDocClick(e) {
      // اگر menuContainerRef تعریف نشده، کاری نکن
      if (!menuContainerRef.current) return;
      // اگر کلیک خارج از کانتینر هدر/منو بود => ببند
      if (!menuContainerRef.current.contains(e.target)) {
        handleMenuClose();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // بستن منو با Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleMenuClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // کامپوننت منو برای دسکتاپ
  const DesktopMenu = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
      {menuSections.map((section) => (
        <Box key={section.title} sx={{ position: "relative" }}>
          <Button
            onClick={handleMenuOpen(section.title)}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: `${section.color}20`,
              },
            }}
            startIcon={section.icon}
            endIcon={section.children ? (openMenus[section.title] ? <ExpandLess /> : <ExpandMore />) : null}
          >
            {section.title}
          </Button>

          {section.children && openMenus[section.title] && (
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                backgroundColor: "#1a1a2e",
                border: `1px solid ${section.color}40`,
                borderRadius: 1,
                minWidth: 220,
                zIndex: 1000,
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {section.children.map((item) => (
                <Box
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    color: pathname === item.path ? section.color : "white",
                    "&:hover": {
                      backgroundColor: `${section.color}15`,
                    },
                  }}
                >
                  <Box sx={{ color: section.color }}>{item.icon}</Box>
                  <Typography variant="body2">{item.title}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}

      {/* عملیات سریع */}
      <Box sx={{ display: "flex", gap: 1, marginLeft: "auto" }}>
        {quickActions.map((action) => (
          <Button
            key={action.title}
            variant="contained"
            size="small"
            onClick={() => handleNavigate(action.path)}
            sx={{
              backgroundColor: action.color,
              color: "white",
              "&:hover": {
                backgroundColor: `${action.color}dd`,
              },
            }}
          >
            {action.title}
          </Button>
        ))}
      </Box>
    </Box>
  );

  // کامپوننت منو برای موبایل (در Drawer)
  const MobileMenu = () => (
    <List sx={{ width: 280 }}>
      <ListItem>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2E7D32" }}>
          🧮 سیستم حسابداری
        </Typography>
      </ListItem>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {menuSections.map((section) => (
        <React.Fragment key={section.title}>
          <ListItem
            button
            onClick={() =>
              section.children
                ? setMobileOpenMenu(mobileOpenMenu === section.title ? null : section.title)
                : handleNavigate(section.path || "#")
            }
          >
            <ListItemIcon sx={{ color: section.color }}>{section.icon}</ListItemIcon>
            <ListItemText
              primary={section.title}
              primaryTypographyProps={{ sx: { color: "white" } }}
            />
            {section.children && (
              <Box sx={{ color: "white" }}>
                {mobileOpenMenu === section.title ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItem>

          {section.children && (
            <Collapse in={mobileOpenMenu === section.title} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.children.map((item) => (
                  <ListItem
                    key={item.path}
                    button
                    sx={{ pl: 4 }}
                    onClick={() => handleNavigate(item.path)}
                  >
                    <ListItemIcon sx={{ color: section.color, minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        sx: {
                          color: pathname === item.path ? section.color : "rgba(255,255,255,0.8)",
                          fontSize: "14px",
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      ))}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />

      <ListItem>
        <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.6)", width: "100%" }}>
          عملیات سریع
        </Typography>
      </ListItem>
      <Box sx={{ px: 2, pb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {quickActions.map((action) => (
          <Button
            key={action.title}
            variant="contained"
            size="small"
            onClick={() => handleNavigate(action.path)}
            sx={{
              backgroundColor: action.color,
              color: "white",
              flex: "1 1 calc(50% - 8px)",
              minWidth: 120,
            }}
          >
            {action.title}
          </Button>
        ))}
      </Box>
    </List>
  );

  return (
    <>
      <AppBar
        ref={menuContainerRef}
        position="fixed"
        sx={{
          backgroundColor: "#1a1a2e",
          backgroundImage: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          zIndex: 1300,
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  flexGrow: 1,
                  fontWeight: "bold",
                  background: "linear-gradient(90deg, #ffffff, #e0e0e0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                🧮 حسابداری
              </Typography>
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mr: 3,
                  cursor: "pointer",
                }}
                onClick={() => router.push("/dashboard")}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    background: "linear-gradient(90deg, #ffffff, #e0e0e0)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  🧮 سیستم حسابداری
                </Typography>
              </Box>
              <DesktopMenu />
            </>
          )}

          {/* دکمه جستجو (اختیاری) */}
          {!isMobile && (
            <IconButton color="inherit">
              <Search />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer برای موبایل */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a2e",
            color: "white",
            width: 280,
          },
        }}
      >
        <MobileMenu />
      </Drawer>

      {/* Space for fixed AppBar */}
      <Toolbar />
    </>
  );
}