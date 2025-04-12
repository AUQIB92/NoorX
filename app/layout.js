import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import Script from "next/script";

export const metadata = {
  title: "NoorX - Bringing comfort closer.",
  description:
    "NoorX is a healthcare appointment booking system designed to bring light, ease, and intelligence to medical access.",
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
