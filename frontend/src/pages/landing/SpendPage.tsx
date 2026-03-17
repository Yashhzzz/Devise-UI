import { Link } from "react-router-dom";
import { CheckCircle, DollarSign } from "lucide-react";
import { Layout } from "../../components/landing/Layout";
import spendDashboard from "@/assets/spend-dashboard.png";

export const SpendPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6 bg-green-50 text-brand-green">
            Devise Spend
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-brand-dark leading-tight">
            AI Cost Intelligence & Optimization
          </h1>
          <p className="text-xl text-brand-gray mt-4 max-w-2xl mx-auto">
            Eliminate waste. Justify investment. Control every rupee.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/demo" className="bg-brand-orange text-white rounded-full px-6 py-2.5 font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-brand-orange/20">
              Book a Demo
            </Link>
            <Link to="/login" className="border border-brand-dark text-brand-dark rounded-full px-6 py-2.5 font-medium hover:bg-brand-dark hover:text-white transition-colors">
              Get Started
            </Link>
          </div>
        </div>

        <div className="mt-16 max-w-5xl mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <img src={spendDashboard} alt="Devise Spend Dashboard" className="w-full" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: "30%+", label: "AI budget wasted" },
            { num: "78%", label: "unexpected charges" },
            { num: "40+", label: "tools per org" },
            { num: "₹12Cr/yr", label: "annual potential savings" },
          ].map((s) => (
            <div key={s.num} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-3xl md:text-4xl font-bold text-brand-orange">{s.num}</div>
              <p className="text-sm text-brand-gray mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features + Who Uses */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold text-brand-dark mb-8">Features</h2>
            <ul className="space-y-4">
              {[
                "Centralized subscription view",
                "Zombie license detection",
                "Duplicate subscription flagging",
                "Cost attribution by team",
                "Budget forecasting",
                "ROI reports",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-brand-dark font-medium">
                  <CheckCircle className="text-brand-green shrink-0" size={18} /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-brand-dark mb-8">Who uses Spend</h2>
            <div className="flex flex-wrap gap-3">
              {["CFO", "IT Procurement", "Finance Team", "Department Budget Owners"].map((role) => (
                <span key={role} className="bg-white rounded-full px-5 py-2 text-sm shadow-soft text-brand-dark font-medium">{role}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className="mx-6 md:mx-auto max-w-5xl rounded-2xl bg-brand-navy text-white py-16 px-8 mb-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Stop wasting money on AI nobody uses.</h2>
        <p className="text-gray-400 mb-8">See Devise Spend eliminate waste in your first demo.</p>
        <Link to="/demo" className="bg-brand-orange text-white rounded-full px-8 py-3 font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-brand-orange/20 inline-block">
          Book a Demo
        </Link>
      </section>
    </Layout>
  );
};
