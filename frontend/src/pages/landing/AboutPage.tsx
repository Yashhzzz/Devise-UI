import { Eye, Shield, Building, Globe } from "lucide-react";
import { Layout } from "../../components/landing/Layout";

export const AboutPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-brand-dark leading-tight">
          The Future of AI Is Governed. Or It Isn&apos;t.
        </h1>
        <p className="text-xl text-brand-gray mt-6 max-w-2xl mx-auto">
          Every enterprise will need a system of record for AI — just like they have one for finance, HR, and security. Devise is that system.
        </p>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 border-l-4 border-brand-orange max-w-2xl mx-auto text-left">
          <p className="text-brand-dark text-lg font-medium italic">
            &ldquo;You can&apos;t govern what you can&apos;t see. We make it visible.&rdquo;
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-brand-dark mb-6">Our Mission</h2>
        <p className="text-brand-gray text-lg leading-relaxed">
          Devise was built because enterprise AI adoption has outpaced every governance framework that exists. We exist to close that gap — giving security, finance, and AI leaders the real-time visibility they need to operate confidently in an AI-first world.
        </p>
      </section>

      {/* Values */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: <Eye />, title: "Transparency", desc: "We believe enterprises deserve full visibility into their AI usage — no blind spots." },
            { icon: <Shield />, title: "Security-First", desc: "Every design decision starts with the question: how does this protect our customers?" },
            { icon: <Building />, title: "Enterprise-Grade", desc: "Built for the compliance, scale, and reliability demands of large organizations." },
            { icon: <Globe />, title: "India-Built", desc: "Proudly built in India, for global enterprises navigating the AI era." },
          ].map((v, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-brand-orange mb-4">{v.icon}</div>
              <h4 className="text-lg font-bold text-brand-dark mb-3">{v.title}</h4>
              <p className="text-brand-gray text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dark CTA */}
      <section className="mx-6 md:mx-auto max-w-5xl rounded-2xl bg-brand-navy text-white py-16 px-8 mb-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Join us in building the future of AI governance.</h2>
        <p className="text-gray-400 mb-8">We&apos;re hiring across engineering, design, and go-to-market.</p>
        <button className="bg-brand-orange text-white rounded-full px-8 py-3 font-semibold hover:bg-orange-600 transition-colors">
          View Careers
        </button>
      </section>
    </Layout>
  );
};
