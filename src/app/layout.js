import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import "bootstrap/dist/css/bootstrap.rtl.min.css";
import "./globals.css";
import "@styles/persian-datepicker.css";
import BootstrapClient from "@/components/BootstrapClient";

export const metadata = {
  title: "سیستم حسابداری نگین آرا",
  description: "سیستم جامع حسابداری و انبارداری ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <div className="app-container d-flex">
          {/* <Sidebar /> */}
          <div className="main-content">
            <Header />
            <main className="content">{children}</main>
          </div>
        </div>
        <BootstrapClient />
      </body>
    </html>
  );
}
