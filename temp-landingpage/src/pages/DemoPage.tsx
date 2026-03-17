import { useState } from "react";
import { CheckCircle, Shield } from "lucide-react";
import { Layout } from "../components/landing/Layout";

export const DemoPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,_#F04E23_0%,_transparent_70%)] opacity-[0.6] blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,_#F04E23_0%,_transparent_70%)] opacity-[0.6] blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 mb-16">
          <h1 className="text-5xl font-bold text-brand-dark">Book a 30-Minute Demo</h1>
          <p className="text-xl text-brand-gray mt-4">See Devise reveal your organization&apos;s complete AI landscape.</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {submitted ? (
              <div className="text-center py-16">
                <CheckCircle className="text-brand-green mx-auto mb-4" size={48} />
                <h3 className="text-2xl font-bold text-brand-dark mb-2">Demo Booked!</h3>
                <p className="text-brand-gray">We&apos;ll be in touch within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="First Name" required className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-brand-orange text-sm" />
                  <input type="text" placeholder="Last Name" required className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-brand-orange text-sm" />
                </div>
                <input type="email" placeholder="Work Email" required className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-brand-orange text-sm" />
                <input type="text" placeholder="Company Name" required className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-brand-orange text-sm" />
                <select required className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-brand-orange text-sm text-brand-gray">
                  <option value="">Company Size</option>
                  <option>&lt;50</option>
                  <option>50-200</option>
                  <option>200-500</option>
                  <option>500-2000</option>
                  <option>2000+</option>
                </select>
                <select required className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-brand-orange text-sm text-brand-gray">
                  <option value="">Your Role</option>
                  <option>CISO</option>
                  <option>CFO</option>
                  <option>Head of AI</option>
                  <option>IT Admin</option>
                  <option>Other</option>
                </select>
                <textarea placeholder="Message (optional)" rows={3} className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-brand-orange text-sm" />
                <button type="submit" className="w-full bg-brand-orange text-white rounded-full py-3 font-semibold hover:bg-orange-600 transition-colors">
                  Book Demo →
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-brand-dark mb-6">What you&apos;ll see in the demo</h3>
            <div className="space-y-4 mb-8">
              {[
                "Live AI tool detection across a simulated org (browser + desktop)",
                "Real-time Oversight violations feed and policy alerts",
                "Pulse adoption heatmap and Spend zombie license detection",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-brand-dark font-medium">
                  <CheckCircle className="text-brand-orange shrink-0 mt-0.5" size={18} /> {item}
                </div>
              ))}
            </div>
            <div className="h-px bg-gray-200 mb-6" />
            <p className="text-brand-gray text-sm mb-6">No credit card required. No installation before the call.</p>
            <div className="flex flex-wrap gap-3">
              {["SOC 2", "GDPR", "30 min"].map((badge) => (
                <span key={badge} className="bg-brand-cream rounded-full px-4 py-1.5 text-xs font-medium text-brand-dark flex items-center gap-1.5">
                  <Shield size={12} className="text-brand-orange" /> {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
