import { Link } from "react-router-dom";
import {
  Eye, AlertTriangle, Settings, Map, Shield, FileText,
  ChevronRight, ArrowRight, CheckCircle
} from "lucide-react";
import { Layout } from "../../components/landing/Layout";
import oversightDashboard from "@/assets/oversight-dashboard.png";

export const OversightPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,_#F04E23_0%,_transparent_70%)] opacity-[0.4] blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle,_#F04E23_0%,_transparent_70%)] opacity-[0.3] blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-6 bg-orange-50 text-brand-orange">
            Devise Oversight
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-brand-dark leading-tight">
            AI Governance & Risk Intelligence
          </h1>
          <p className="text-xl text-brand-gray mt-4 max-w-2xl mx-auto">
            Surface policy exposure and compliance gaps using real usage data.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/demo" className="bg-brand-orange text-white rounded-full px-6 py-2.5 font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-brand-orange/20">
              Book a Demo
            </Link>
            <button className="border border-brand-dark text-brand-dark rounded-full px-6 py-2.5 font-medium hover:bg-brand-dark hover:text-white transition-colors">
              See all features
            </button>
          </div>
        </div>

        <div className="mt-16 max-w-5xl mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <img src={oversightDashboard} alt="Devise Oversight Dashboard" className="w-full" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4 text-center">Features</div>
        <h2 className="text-4xl font-bold text-brand-dark text-center mb-12">Complete governance toolkit</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Eye />, title: "Real-time AI Visibility", desc: "See every AI tool used across your entire organization in real time." },
            { icon: <AlertTriangle />, title: "Shadow AI Detection", desc: "Automatically detect unauthorized AI tools before they cause incidents." },
            { icon: <Settings />, title: "Policy Rule Engine", desc: "Create and enforce granular AI usage policies by team, tool, or data type." },
            { icon: <Map />, title: "Framework Mapping", desc: "Map findings to OWASP LLM Top 10, NIST AI RMF, ISO 42001, and EU AI Act." },
            { icon: <Shield />, title: "Data Sensitivity Flagging", desc: "Detect when sensitive data is shared with AI tools and alert instantly." },
            { icon: <FileText />, title: "Defensible Audit Trail", desc: "Complete, tamper-proof logs for regulatory review and compliance audits." },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-brand-orange mb-4">{f.icon}</div>
              <h4 className="font-bold text-brand-dark mb-2">{f.title}</h4>
              <p className="text-brand-gray text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Flow */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
          {["Detect", "Classify", "Alert"].map((step, i) => (
            <div key={step} className="flex items-center gap-4">
              <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">
                <div className="text-brand-orange font-bold text-lg">{step}</div>
              </div>
              {i < 2 && <ChevronRight className="text-brand-gray hidden md:block" size={24} />}
            </div>
          ))}
        </div>
      </section>

      {/* Compliance Frameworks */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-brand-dark text-center mb-12">Compliance Frameworks Supported</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["OWASP LLM Top 10", "NIST AI RMF", "ISO 42001", "EU AI Act"].map((fw) => (
            <div key={fw} className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <Shield className="text-brand-orange mx-auto mb-3" size={24} />
              <div className="font-bold text-brand-dark text-sm">{fw}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Who Uses It */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-brand-dark text-center mb-8">Who uses Oversight</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {["CISO", "Compliance Officer", "Legal", "Security Team", "Internal Audit"].map((role) => (
            <span key={role} className="bg-white rounded-full px-5 py-2 text-sm shadow-soft text-brand-dark font-medium">{role}</span>
          ))}
        </div>
      </section>

      {/* Dark CTA */}
      <section className="mx-6 md:mx-auto max-w-5xl rounded-2xl bg-brand-navy text-white py-16 px-8 mb-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to govern your AI landscape?</h2>
        <p className="text-gray-400 mb-8">See Devise Oversight in action with a personalized demo.</p>
        <Link to="/demo" className="bg-brand-orange text-white rounded-full px-8 py-3 font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-brand-orange/20 inline-block">
          Book a Demo
        </Link>
      </section>
    </Layout>
  );
};
