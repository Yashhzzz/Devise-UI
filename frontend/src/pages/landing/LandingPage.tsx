import { Link } from "react-router-dom";
import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Shield, BarChart2, DollarSign, Layers, ShieldOff,
  AlertOctagon, Rocket, Search, Brain, Zap, CheckCircle,
  ArrowRight, Plus, Minus, Star, Cpu, Eye, Settings,
  FileText, Map, Server, Globe, Lock, Clock, Key, X
} from "lucide-react";
import { Layout } from "../../components/landing/Layout";
import { OrangeWaveBackground } from "../../components/landing/OrangeWaveBackground";
import { HeroDashboard, OversightMockup, PulseMockup, SpendMockup } from "../../components/landing/DashboardMockups";
import heroDashboard from "@/assets/hero-dashboard.png";

export const LandingPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 bg-transparent">
        <OrangeWaveBackground />

        <div className="max-w-4xl mx-auto text-center relative" style={{ zIndex: 1 }}>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-brand-dark leading-tight mt-6">
            The System of Record for Enterprise AI
          </h1>

          <p className="text-xl md:text-2xl text-brand-gray font-medium mt-4">
            See Every Tool. Govern Every Risk. Control Every Rupee.
          </p>

          <p className="text-base md:text-lg text-brand-gray max-w-2xl mx-auto mt-4 leading-relaxed">
            Devise installs a lightweight agent on employee devices to surface every AI tool
            in use — and turns that invisible usage into security, compliance, adoption, and
            cost intelligence that leaders can act on.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/login" className="border-2 border-brand-dark text-brand-dark rounded-full px-6 py-2.5 font-medium hover:bg-brand-dark hover:text-white transition-colors">
              Get Started
            </Link>
            <Link to="/demo" className="bg-brand-orange text-white rounded-full px-6 py-2.5 font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-brand-orange/20 flex items-center gap-2">
              Book a Demo <ArrowRight size={16} />
            </Link>
          </div>

        </div>

        {/* Hero Image */}
        <div className="mt-16 max-w-5xl mx-auto relative z-10 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-orange to-brand-purple rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <img src={heroDashboard} alt="Devise AI Tool Activity Dashboard" className="w-full" />
          </div>
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-700 rounded-xl shadow-heavy flex items-center justify-center text-white font-bold text-sm">XLS</div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-700 rounded-xl shadow-heavy flex items-center justify-center text-white font-bold text-sm">SAP</div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-red-600 rounded-xl shadow-heavy flex items-center justify-center text-white font-bold text-sm">INF</div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-500 rounded-xl shadow-heavy flex items-center justify-center text-white font-bold text-sm">OK</div>
        </div>
      </section>


      {/* Problem Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange mb-6">The Challenge</div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <h2 className="text-4xl md:text-[3.2rem] font-bold text-brand-dark leading-[1.15] max-w-xl">
            Enterprise AI is now three problems at once
          </h2>
          <p className="text-brand-gray text-lg max-w-xs leading-relaxed">
            Most companies can&apos;t answer basic questions about any of them. Can you?
          </p>
        </div>

        {/* Spreadsheet mockup */}
        <div className="bg-white shadow-xl rounded-2xl p-6 max-w-3xl mx-auto relative border border-gray-100">
          <div className="bg-gray-50 rounded-xl p-5 space-y-2.5">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex gap-2.5">
                {[1, 2, 3, 4].map((col) => (
                  <div key={col} className="flex-1 h-9 bg-gray-200/80 rounded-md" />
                ))}
              </div>
            ))}
            <div className="flex gap-2.5 pt-1">
              {[1, 2].map((col) => (
                <div key={col} className="flex-1 h-7 bg-gray-300/70 rounded-md" />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-red-400 text-[120px] font-black opacity-60 select-none" style={{ lineHeight: 1 }}>✕</span>
          </div>
        </div>
        <p className="text-center text-brand-gray text-sm mt-4">
          Organisations tried. Emails, surveys, and spreadsheets can&apos;t track this for you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20">
          {[
            { icon: <Layers className="w-7 h-7" />, title: "Fragmented Systems", desc: "Your AI tools are scattered across departments with no central view." },
            { icon: <ShieldOff className="w-7 h-7" />, title: "No Policy Enforcement", desc: "Violations go undetected until something goes wrong — no audit trail." },
            { icon: <BarChart2 className="w-7 h-7" />, title: "Zero Adoption Clarity", desc: "2,000 employees using AI, 4 separate trackers, no single source of truth." },
            { icon: <AlertOctagon className="w-7 h-7" />, title: "Reactive, Not Proactive", desc: "Your team discovers shadow AI incidents after the fact, not before." },
          ].map((item, i) => (
            <div key={i} className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft hover:shadow-heavy transition-all duration-300 group">
              <div className="text-brand-orange mb-5 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="text-base font-bold text-brand-dark mb-2">{item.title}</h4>
              <p className="text-brand-gray text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Missing Link */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange bg-brand-orange/10 px-4 py-1.5 rounded-full mb-6">The Missing Link in Your Stack</div>
            <h2 className="text-4xl md:text-5xl font-bold text-brand-dark max-w-3xl mx-auto leading-tight">
              We automate the high-friction work of AI governance, adoption, and spend.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Large feature card */}
            <div className="md:col-span-7 bg-brand-navy rounded-3xl p-8 md:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-brand-orange" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Oversight</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Integrated AI Visibility & Policy Enforcement</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md">Detect every AI tool in real time, across browsers and desktop apps. Policy violations surface instantly.</p>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden h-52">
                  <OversightMockup />
                </div>
              </div>
            </div>

            {/* Stacked right cards */}
            <div className="md:col-span-5 flex flex-col gap-5">
              <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-8 shadow-soft group hover:shadow-heavy transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-5 h-5 text-brand-purple" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-purple">Pulse</span>
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-2">Real-time AI Adoption Management</h3>
                <p className="text-brand-gray text-sm leading-relaxed">Track which teams are adopting AI, which tools are winning, and where your program needs attention.</p>
              </div>
              <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-8 shadow-soft group hover:shadow-heavy transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-brand-green" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-green">Spend</span>
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-2">AI Cost & Subscription Intelligence</h3>
                <p className="text-brand-gray text-sm leading-relaxed">Map AI usage to subscriptions. Detect zombie licenses. Report ROI with real numbers.</p>
              </div>
            </div>

            {/* Full-width audit trail */}
            <div className="md:col-span-12 bg-brand-dark rounded-3xl p-8 md:p-10 text-white">
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="md:w-1/3">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-brand-orange" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Audit Trail</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Live AI Monitoring</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Every AI interaction logged, timestamped, and mapped. Regulatory-ready from day one.</p>
                </div>
                <div className="md:w-2/3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
                  {[
                    { name: "Priya M.", tool: "ChatGPT", dept: "Engineering", time: "10:32 AM", badge: "ALERT" },
                    { name: "David R.", tool: "Copilot", dept: "Product", time: "10:28 AM", badge: "OK" },
                    { name: "Lin W.", tool: "Midjourney", dept: "Design", time: "10:15 AM", badge: "ALERT" },
                    { name: "Sam K.", tool: "Claude", dept: "Legal", time: "10:02 AM", badge: "OK" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-[10px] font-bold">{item.name.charAt(0)}</div>
                        <div>
                          <span className="font-semibold block">{item.name}</span>
                          <span className="text-gray-500 text-[10px]">{item.dept}</span>
                        </div>
                      </div>
                      <span className="text-gray-400 hidden md:block">{item.tool}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">{item.time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.badge === "ALERT" ? "bg-brand-orange/20 text-brand-orange" : "bg-green-500/15 text-green-400"}`}>{item.badge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4">How It Works</div>
        <h2 className="text-4xl font-bold text-brand-dark mb-2">See. Understand. Act.</h2>
        <p className="text-brand-gray max-w-2xl">
          Devise turns invisible AI usage into visible intelligence — without changing how your teams work.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
          {[
            { num: "01", icon: <Rocket className="w-6 h-6" />, title: "Deploy", desc: "IT deploys the Devise agent via Jamf, Intune, Kandji, or SCCM. No network changes. No employee action. Under 30 minutes." },
            { num: "02", icon: <Search className="w-6 h-6" />, title: "Detect", desc: "Every AI tool — browser or desktop — identified against our registry of 3,500+ tools and logged in real time." },
            { num: "03", icon: <Brain className="w-6 h-6" />, title: "Analyze", desc: "The risk engine, adoption engine, and cost engine process events and surface intelligence for each stakeholder." },
            { num: "04", icon: <Zap className="w-6 h-6" />, title: "Act", desc: "Role-specific dashboards give your CISO, CFO, and AI Lead exactly what they need to make confident decisions." },
          ].map((step) => (
            <div key={step.num} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-brand-orange mb-4">{step.icon}</div>
              <div className="text-[10px] font-bold text-brand-gray mb-1">{step.num}</div>
              <h4 className="text-lg font-bold text-brand-dark mb-2">{step.title}</h4>
              <p className="text-brand-gray text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

      </section>

      {/* Stats */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { num: "80%", label: "of employees use unapproved AI tools" },
            { num: "86%", label: "of orgs are blind to AI data flows" },
            { num: "30%+", label: "of AI budget wasted on unused licenses" },
            { num: "3,500+", label: "AI tools detected automatically" },
          ].map((stat) => (
            <div key={stat.num} className="bg-white rounded-2xl shadow-md p-6 lg:p-8 text-center border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-orange tracking-tight whitespace-nowrap">{stat.num}</div>
              <p className="text-sm text-brand-gray mt-3 max-w-[140px] mx-auto leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Modules */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4">The Solution</div>
        <h2 className="text-4xl font-bold text-brand-dark">One deployment. Complete visibility.</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <ModuleCard
            tag="Devise Oversight"
            title="AI Governance & Risk Intelligence"
            desc="Surface policy exposure and compliance gaps using real behavioral data — not questionnaires."
            borderColor="border-l-brand-orange"
            tagBg="bg-orange-50"
            tagText="text-brand-orange"
            accentColor="text-brand-orange"
            items={["Complete visibility into AI data flows", "OWASP / NIST / RMF framework mapping", "Shadow AI detection", "Defensible audit trail", "Real-time Slack & email alerts"]}
            ctaText="Get a Demo →"
            ctaLink="/demo"
          />
          <ModuleCard
            tag="Devise Pulse"
            title="AI Adoption Intelligence"
            desc="Replace stale surveys with real behavioral data about how AI is actually being adopted across your organization."
            borderColor="border-l-brand-purple"
            tagBg="bg-purple-50"
            tagText="text-brand-purple"
            accentColor="text-brand-purple"
            items={["Adoption rate by team and department", "Power user identification", "Tool preference tracking", "Training gap surfacing", "Weekly executive reports"]}
            ctaText="Learn more →"
            ctaLink="/product/pulse"
          />
          <ModuleCard
            tag="Devise Spend"
            title="AI Cost Intelligence"
            desc="Connect actual usage to subscription costs. Eliminate zombie licenses and duplicate spend. Justify AI ROI."
            borderColor="border-l-brand-green"
            tagBg="bg-green-50"
            tagText="text-brand-green"
            accentColor="text-brand-green"
            items={["Centralized subscription view", "Zombie license detection", "Duplicate subscription flagging", "Cost attribution by team", "Budget forecasting"]}
            ctaText="Learn more →"
            ctaLink="/product/spend"
          />
        </div>
      </section>

      {/* Why Devise Comparison */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4">Why Devise</div>
          <h2 className="text-4xl font-bold text-brand-dark mb-4">Everything in one deployment</h2>
          <p className="text-brand-gray text-lg max-w-2xl mx-auto mb-12">
            Competitors address one problem. Devise addresses all three simultaneously from a single lightweight agent.
          </p>

          <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-100">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-brand-orange text-white">
                  <th className="py-6 px-6 font-semibold text-sm uppercase tracking-wide border-b border-orange-600">Feature</th>
                  <th className="py-6 px-6 font-semibold text-sm uppercase tracking-wide border-b border-orange-600 bg-orange-600/80 text-center relative w-1/4">
                    Devise
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-brand-orange text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Recommended
                    </div>
                  </th>
                  <th className="py-6 px-6 font-semibold text-sm uppercase tracking-wide border-b border-orange-600 text-center w-48">SaaS Mgmt</th>
                  <th className="py-6 px-6 font-semibold text-sm uppercase tracking-wide border-b border-orange-600 text-center w-48">Manual Audits</th>
                  <th className="py-6 px-6 font-semibold text-sm uppercase tracking-wide border-b border-orange-600 text-center w-48">Point Solutions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  { feature: "Real-time AI detection", devise: "yes", saas: "no", manual: "no", point: "partial" },
                  { feature: "No vendor integrations needed", devise: "yes", saas: "no", manual: "yes", point: "no" },
                  { feature: "Governance + Adoption + Cost in one", devise: "yes", saas: "partial", manual: "no", point: "no" },
                  { feature: "Detects shadow AI", devise: "yes", saas: "no", manual: "no", point: "partial" },
                  { feature: "Zero user workflow change", devise: "yes", saas: "no", manual: "no", point: "no" },
                  { feature: "Desktop app coverage", devise: "yes", saas: "no", manual: "no", point: "no" },
                  { feature: "NIST / OWASP framework mapping", devise: "yes", saas: "no", manual: "no", point: "partial" },
                  { feature: "On-premise deployment option", devise: "yes", saas: "partial", manual: "yes", point: "partial" },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50 border-y border-gray-100"}>
                    <td className="py-5 px-6 font-medium text-brand-dark text-sm border-r border-gray-100">{row.feature}</td>
                    <td className="py-5 px-6 text-center border-r border-gray-100 bg-orange-50/50">
                      <CheckCircle className="text-green-600 w-5 h-5 mx-auto" />
                    </td>
                    <td className="py-5 px-6 text-center border-r border-gray-100">
                      {row.saas === "no" ? <X className="text-red-400 w-5 h-5 mx-auto" /> : row.saas === "yes" ? <CheckCircle className="text-green-600 w-5 h-5 mx-auto" /> : <Minus className="text-gray-300 w-5 h-5 mx-auto" />}
                    </td>
                    <td className="py-5 px-6 text-center border-r border-gray-100">
                      {row.manual === "no" ? <X className="text-red-400 w-5 h-5 mx-auto" /> : row.manual === "yes" ? <CheckCircle className="text-green-600 w-5 h-5 mx-auto" /> : <Minus className="text-gray-300 w-5 h-5 mx-auto" />}
                    </td>
                    <td className="py-5 px-6 text-center">
                      {row.point === "no" ? <X className="text-red-400 w-5 h-5 mx-auto" /> : row.point === "yes" ? <CheckCircle className="text-green-600 w-5 h-5 mx-auto" /> : <Minus className="text-gray-300 w-5 h-5 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Role Tabs */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4 text-center">Built for Your Role</div>
        <h2 className="text-4xl font-bold text-brand-dark text-center">Built for how enterprise teams work</h2>

        <Tabs.Root defaultValue="ciso" className="w-full mt-12">
          <Tabs.List className="flex justify-center gap-8 border-b border-gray-200 mb-12">
            {[
              { value: "ciso", label: "CISO / Security" },
              { value: "cfo", label: "CFO / Finance" },
              { value: "ai", label: "Head of AI" },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="pb-4 text-sm font-bold text-brand-gray hover:text-brand-dark data-[state=active]:text-brand-orange data-[state=active]:border-b-2 data-[state=active]:border-brand-orange transition-all outline-none"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="ciso" className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-in fade-in duration-500">
            <div>
              <h3 className="text-3xl font-bold text-brand-dark mb-6">You can&apos;t manage AI risk without real visibility.</h3>
              <p className="text-brand-gray text-lg mb-8">Devise gives security teams a real-time audit trail, policy enforcement engine, and defensible compliance story — without requiring any integrations with AI vendors.</p>
              <div className="text-xs font-semibold uppercase tracking-widest text-brand-gray mb-4">Questions you can answer:</div>
              <div className="space-y-4">
                {["Is sensitive data leaving our network via AI tools?", "Which employees are using unauthorized tools today?", "Can we demonstrate compliance to regulators?"].map((q) => (
                  <div key={q} className="flex items-center gap-3 font-bold text-brand-dark">
                    <ArrowRight className="text-brand-orange shrink-0" size={18} /> {q}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-heavy overflow-hidden border border-gray-100">
              <OversightMockup />
            </div>
          </Tabs.Content>

          <Tabs.Content value="cfo" className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-in fade-in duration-500">
            <div>
              <h3 className="text-3xl font-bold text-brand-dark mb-6">Stop paying for AI nobody uses.</h3>
              <p className="text-brand-gray text-lg mb-8">Devise connects actual AI usage to your subscriptions so finance can eliminate waste, justify spend, and forecast accurately.</p>
              <div className="text-xs font-semibold uppercase tracking-widest text-brand-gray mb-4">Questions you can answer:</div>
              <div className="space-y-4">
                {["Which tools are we paying for that nobody uses?", "What's our actual ROI on AI investment?", "How do I attribute AI costs by team?"].map((q) => (
                  <div key={q} className="flex items-center gap-3 font-bold text-brand-dark">
                    <ArrowRight className="text-brand-orange shrink-0" size={18} /> {q}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-heavy overflow-hidden border border-gray-100">
              <SpendMockup />
            </div>
          </Tabs.Content>

          <Tabs.Content value="ai" className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-in fade-in duration-500">
            <div>
              <h3 className="text-3xl font-bold text-brand-dark mb-6">Run your AI program with real data, not surveys.</h3>
              <p className="text-brand-gray text-lg mb-8">Devise replaces stale survey data with behavioral adoption metrics — so you can show the board that your AI transformation program is actually working.</p>
              <div className="text-xs font-semibold uppercase tracking-widest text-brand-gray mb-4">Questions you can answer:</div>
              <div className="space-y-4">
                {["Are we actually adopting AI or just talking about it?", "Which teams are leading vs lagging?", "Where should I invest training budget?"].map((q) => (
                  <div key={q} className="flex items-center gap-3 font-bold text-brand-dark">
                    <ArrowRight className="text-brand-orange shrink-0" size={18} /> {q}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-heavy overflow-hidden border border-gray-100">
              <PulseMockup />
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </section>

      {/* Enterprise Ready */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4 text-center">Enterprise Ready</div>
          <h2 className="text-4xl font-bold text-brand-dark text-center mb-12">Built for enterprise requirements</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Shield />, title: "SOC 2 Type I Certified", desc: "Independently audited security controls." },
              { icon: <Key />, title: "SSO & SCIM Integration", desc: "Okta, Azure AD, OneLogin, Google Workspace." },
              { icon: <Server />, title: "On-Premises Option", desc: "All data within your own infrastructure." },
              { icon: <Globe />, title: "GDPR Compliant", desc: "Full European data protection compliance." },
              { icon: <Lock />, title: "End-to-End Encryption", desc: "AES-256 in transit and at rest." },
              { icon: <Clock />, title: "Configurable Retention", desc: "Set retention policies to match compliance needs." },
            ].map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-6 shadow-soft">
                <div className="text-brand-orange mb-3">{item.icon}</div>
                <h4 className="font-bold text-brand-dark mb-1">{item.title}</h4>
                <p className="text-brand-gray text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 justify-center mt-10">
            {["SOC 2 Type II", "GDPR Compliant", "Open Source Core", "Self-Host Option"].map((badge) => (
              <span key={badge} className="bg-brand-cream rounded-full px-4 py-1.5 text-sm font-medium text-brand-dark">{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-brand-dark text-center mb-16">Frequently Asked Questions</h2>
        <Accordion.Root type="single" collapsible defaultValue="q1">
          {[
            { value: "q1", q: "What is Devise?", a: "Devise is an enterprise AI governance platform that installs a lightweight agent on employee devices to detect every AI tool in use — and turns that usage into security, compliance, adoption, and cost intelligence." },
            { value: "q2", q: "How does it work?", a: "A browser extension and desktop agent monitor AI tool usage at the network and navigation layer. No conversation content is ever captured — only which tool was used, by whom, and when. Events flow into the Devise dashboard in real time." },
            { value: "q3", q: "What data does it collect?", a: "Tool name, domain, user identity, department, timestamp, and source (browser or desktop). We deliberately never capture conversation content, keystrokes, clipboard data, or any user-generated input." },
            { value: "q4", q: "Is it legal?", a: "Yes. Monitoring company-owned devices with employee disclosure is lawful under GDPR and applicable labour law. Devise is SOC 2 Type I certified and architected for GDPR compliance." },
            { value: "q5", q: "How do I get support?", a: "Email us at support@devise.ai or book a demo to speak directly with our team." },
          ].map((faq) => (
            <Accordion.Item key={faq.value} value={faq.value} className="border-b border-gray-200 last:border-b-0 group">
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center justify-between py-5 px-0 text-left font-medium text-brand-dark text-base hover:text-brand-orange transition-colors outline-none cursor-pointer">
                  {faq.q}
                  <Plus className="text-brand-orange w-5 h-5 flex-shrink-0 group-data-[state=open]:hidden" />
                  <Minus className="text-brand-orange w-5 h-5 flex-shrink-0 group-data-[state=closed]:hidden" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="text-brand-gray text-sm leading-relaxed pb-5 overflow-hidden transition-all duration-200 ease-in-out data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                {faq.a}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-brand-navy rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-orange/20 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-brand-purple/20 transition-colors duration-700" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to govern your <span className="text-brand-orange">AI landscape?</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Join 200+ enterprise teams using Devise to surface every AI tool and 
              turn invisible usage into intelligence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login" className="bg-brand-orange text-white rounded-full px-10 py-4 font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-brand-orange/20 hover:scale-105 active:scale-95">
                Get Started Free
              </Link>
              <Link to="/demo" className="bg-white/10 text-white backdrop-blur-md border border-white/20 rounded-full px-10 py-4 font-bold text-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95">
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  );
};

const ModuleCard = ({ tag, title, desc, borderColor, tagBg, tagText, accentColor, items, ctaText, ctaLink }: {
  tag: string; title: string; desc: string; borderColor: string; tagBg: string; tagText: string; accentColor: string; items: string[]; ctaText: string; ctaLink?: string;
}) => (
  <div className={`bg-white p-8 rounded-2xl shadow-lg border-l-4 ${borderColor} hover:shadow-heavy transition-all`}>
    <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${tagBg} ${tagText}`}>
      {tag}
    </div>
    <h3 className="text-2xl font-bold text-brand-dark mb-4">{title}</h3>
    <p className="text-brand-gray text-sm mb-8 leading-relaxed">{desc}</p>
    <ul className="space-y-4 mb-8">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm font-medium text-brand-dark">
          <CheckCircle className={`${accentColor} shrink-0`} size={18} />
          {item}
        </li>
      ))}
    </ul>
    {ctaLink ? (
      <Link to={ctaLink} className={`font-bold ${accentColor} flex items-center gap-2 hover:translate-x-1 transition-transform`}>
        {ctaText}
      </Link>
    ) : (
      <button className={`font-bold ${accentColor} flex items-center gap-2 hover:translate-x-1 transition-transform`}>
        {ctaText}
      </button>
    )}
  </div>
);
