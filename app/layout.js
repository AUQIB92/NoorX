import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import Script from "next/script";

export const metadata = {
  title: "Dr. Imran's Healthcare and Diagnostic Centre",
  description:
    "Book appointments with top healthcare professionals at Dr. Imran's Healthcare and Diagnostic Centre",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-primary-50">
        <main className="min-h-screen">{children}</main>
        <ToastContainer position="top-right" autoClose={5000} />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
