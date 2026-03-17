import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-brand-cream font-sans selection:bg-brand-orange/20 selection:text-brand-orange">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
