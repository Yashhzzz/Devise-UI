import { Link } from "react-router-dom";
import { HelpCircle, CheckCircle, BarChart2, Users, TrendingUp } from "lucide-react";
import { Layout } from "../components/landing/Layout";
import pulseDashboard from "@/assets/pulse-dashboard.png";

export const PulsePage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6 bg-purple-50 text-brand-purple">
            Devise Pulse
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-brand-dark leading-tight">
            AI Adoption & Usage Analytics
          </h1>
          <p className="text-xl text-brand-gray mt-4 max-w-2xl mx-auto">
            Replace stale surveys with real behavioral adoption data.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button className="bg-brand-purple text-white rounded-full px-6 py-2.5 font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-brand-purple/20">
              Book a Demo
            </button>
            <Link to="/login" className="border border-brand-dark text-brand-dark rounded-full px-6 py-2.5 font-medium hover:bg-brand-dark hover:text-white transition-colors">
              Get Started
            </Link>
          </div>
        </div>

        <div className="mt-16 max-w-5xl mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <img src={pulseDashboard} alt="Devise Pulse Dashboard" className="w-full" />
          </div>
        </div>
      </section>

      {/* Question Cards */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            "Are we actually adopting AI or just talking about it?",
            "Which teams are leading vs lagging?",
            "Which tools are becoming the company default?",
            "Where should we invest in training?",
            "Who are our internal AI champions?",
          ].map((q, i) => (
            <div key={i} className="bg-white rounded-xl shadow-soft p-6">
              <HelpCircle className="text-brand-purple mb-3" size={20} />
              <p className="text-brand-dark font-medium text-sm">{q}</p>
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
                "Adoption rate by tool, team, and department",
                "Trend tracking over time",
                "Team leaderboard",
                "Power user identification",
                "Training gap surfacing",
                "Weekly executive reports",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-brand-dark font-medium">
                  <CheckCircle className="text-brand-purple shrink-0" size={18} /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-brand-dark mb-8">Who uses Pulse</h2>
            <div className="flex flex-wrap gap-3">
              {["CHRO", "AI Transformation Lead", "L&D Team", "Department Heads", "CEO"].map((role) => (
                <span key={role} className="bg-white rounded-full px-5 py-2 text-sm shadow-soft text-brand-dark font-medium">{role}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className="mx-6 md:mx-auto max-w-5xl rounded-2xl bg-brand-navy text-white py-16 px-8 mb-24 text-center">
        <h2 className="text-3xl font-bold mb-4">See real adoption data, not survey estimates.</h2>
        <p className="text-gray-400 mb-8">Book a demo to see Devise Pulse in action.</p>
        <button className="bg-brand-purple text-white rounded-full px-8 py-3 font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-brand-purple/20">
          Book a Demo
        </button>
      </section>
    </Layout>
  );
};
