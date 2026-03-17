import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid, TrendingUp, AlertTriangle, DollarSign, Users, Shield,
  ArrowRight, Briefcase, Eye, Lock, Settings
} from "lucide-react";
import { Layout } from "../components/landing/Layout";

const useCases = [
  { tag: "C-Suite", color: "bg-orange-50 text-brand-orange", icon: <LayoutGrid size={20} />, title: "Org-wide AI adoption scoreboard", desc: "The board wants to know 'where are we on AI?' You need a real answer — not a survey estimate or gut feeling." },
  { tag: "C-Suite", color: "bg-orange-50 text-brand-orange", icon: <TrendingUp size={20} />, title: "Did your AI deployment actually work?", desc: "You approved a major AI tool rollout. Six weeks later, someone asks if it's working. You don't have an answer." },
  { tag: "Security", color: "bg-red-50 text-red-500", icon: <AlertTriangle size={20} />, title: "Confidential data sent to ChatGPT", desc: "A senior analyst pastes a confidential client email thread into ChatGPT. The data left your network instantly." },
  { tag: "Finance", color: "bg-green-50 text-brand-green", icon: <DollarSign size={20} />, title: "Zombie licenses draining budget", desc: "Paying for 200 Copilot seats. Only 67 engineers use it. That's ₹1.2L wasted every month." },
  { tag: "AI Leaders", color: "bg-purple-50 text-brand-purple", icon: <Users size={20} />, title: "Finding your internal AI champions", desc: "Which employees are power users who can drive adoption? You have no way to know." },
  { tag: "IT Admin", color: "bg-gray-100 text-brand-gray", icon: <Shield size={20} />, title: "Shadow AI spreading across the org", desc: "Every month, new AI tools appear in your network. You find out about them when something goes wrong." },
];

const filters = ["All", "C-Suite", "Security", "Finance", "AI Leaders", "IT Admin"];

const audiences = [
  { icon: <Eye />, title: "CEO / Head of AI", desc: "Need real adoption data to report to the board." },
  { icon: <DollarSign />, title: "CFO / Finance", desc: "Need to eliminate AI subscription waste." },
  { icon: <Shield />, title: "CISO / Security", desc: "Need visibility into shadow AI and data risks." },
  { icon: <Settings />, title: "IT Admin", desc: "Need control over tool sprawl and access." },
  { icon: <Lock />, title: "Compliance", desc: "Need defensible audit trails for regulators." },
];

export const UseCasesPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All" ? useCases : useCases.filter((uc) => uc.tag === activeFilter);

  return (
    <Layout>
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4">Use Cases</div>
        <h1 className="text-5xl font-bold text-brand-dark mb-4">Real situations. Real answers.</h1>
        <p className="text-brand-gray text-lg max-w-2xl">
          Every use case maps to a question a leader is actually asking right now.
        </p>

        <div className="flex flex-wrap gap-3 mt-10">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === f
                  ? "bg-brand-orange text-white"
                  : "bg-white text-brand-dark shadow-soft hover:shadow-heavy"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {filtered.map((uc, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${uc.color}`}>{uc.tag}</span>
                <span className="text-brand-orange">{uc.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-3">{uc.title}</h3>
              <p className="text-brand-gray text-sm mb-4 leading-relaxed">{uc.desc}</p>
              <button className="text-brand-orange font-medium text-sm flex items-center gap-1 hover:translate-x-1 transition-transform">
                See how it works <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* By Audience */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-brand-dark text-center mb-12">By Audience</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {audiences.map((a, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-brand-orange mx-auto mb-3 flex justify-center">{a.icon}</div>
              <h4 className="font-bold text-brand-dark text-sm mb-2">{a.title}</h4>
              <p className="text-brand-gray text-xs">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dark CTA */}
      <section className="mx-6 md:mx-auto max-w-5xl rounded-2xl bg-brand-navy text-white py-16 px-8 mb-24 text-center">
        <h2 className="text-3xl font-bold mb-4">See how Devise solves your challenge.</h2>
        <p className="text-gray-400 mb-8">Book a 30-minute demo tailored to your role.</p>
        <button className="bg-brand-orange text-white rounded-full px-8 py-3 font-semibold hover:bg-orange-600 transition-colors">
          Book a Demo
        </button>
      </section>
    </Layout>
  );
};
