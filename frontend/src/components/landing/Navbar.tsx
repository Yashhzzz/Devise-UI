import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Grid2x2, Shield, BarChart2, DollarSign, LayoutGrid,
  TrendingUp, AlertTriangle, Menu, X, ChevronDown, Mail,
  BookOpen, FileText, Calendar, GitCompare, HelpCircle,
  Building, Lock, Briefcase, Phone, Users
} from "lucide-react";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Only trigger scroll effect after 10px
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <nav 
        className={`transition-all duration-200 ${
          isScrolled ? "bg-white shadow-sm backdrop-blur-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <Grid2x2 className="text-white w-5 h-5" />
            </div>
            <span className="ml-2 text-xl font-bold text-brand-dark tracking-tight">Devise</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {/* Product Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-1 text-sm font-medium text-brand-dark hover:text-brand-orange outline-none cursor-pointer">
                Product <ChevronDown size={14} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white rounded-2xl shadow-heavy p-2 min-w-[320px] mt-2 z-[60] animate-in fade-in slide-in-from-top-2" sideOffset={8}>
                  <DropdownMenu.Item className="outline-none" asChild>
                    <Link to="/product/oversight" className="flex items-start gap-4 p-3 rounded-xl hover:bg-brand-cream transition-colors">
                      <Shield className="text-brand-orange mt-0.5" size={20} />
                      <div>
                        <div className="font-bold text-brand-dark text-sm">Devise Oversight</div>
                        <div className="text-xs text-brand-gray">AI Governance Intelligence</div>
                      </div>
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="outline-none" asChild>
                    <Link to="/product/pulse" className="flex items-start gap-4 p-3 rounded-xl hover:bg-brand-cream transition-colors">
                      <BarChart2 className="text-brand-purple mt-0.5" size={20} />
                      <div>
                        <div className="font-bold text-brand-dark text-sm">Devise Pulse</div>
                        <div className="text-xs text-brand-gray">AI Adoption Intelligence</div>
                      </div>
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="outline-none" asChild>
                    <Link to="/product/spend" className="flex items-start gap-4 p-3 rounded-xl hover:bg-brand-cream transition-colors">
                      <DollarSign className="text-brand-green mt-0.5" size={20} />
                      <div>
                        <div className="font-bold text-brand-dark text-sm">Devise Spend</div>
                        <div className="text-xs text-brand-gray">AI Cost Intelligence</div>
                      </div>
                    </Link>
                  </DropdownMenu.Item>
                  <div className="h-px bg-gray-100 my-2" />
                  <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-brand-gray">
                    Coverage: 3,500+ AI tools detected
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Use Cases Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-1 text-sm font-medium text-brand-dark hover:text-brand-orange outline-none cursor-pointer">
                Use Cases <ChevronDown size={14} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white rounded-2xl shadow-heavy p-6 min-w-[560px] mt-2 z-[60] animate-in fade-in slide-in-from-top-2" sideOffset={8}>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gray mb-4">Featured Use Cases</div>
                      <div className="space-y-1">
                        <DropdownMenu.Item className="outline-none" asChild>
                          <Link to="/use-cases" className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-cream transition-colors text-sm text-brand-dark">
                            <LayoutGrid size={16} className="text-brand-orange" /> Org-wide AI adoption scoreboard
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="outline-none" asChild>
                          <Link to="/use-cases" className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-cream transition-colors text-sm text-brand-dark">
                            <TrendingUp size={16} className="text-brand-orange" /> Did your AI deployment actually work?
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="outline-none" asChild>
                          <Link to="/use-cases" className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-cream transition-colors text-sm text-brand-dark">
                            <AlertTriangle size={16} className="text-brand-orange" /> Confidential data sent to ChatGPT
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="outline-none" asChild>
                          <Link to="/use-cases" className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-cream transition-colors text-sm text-brand-dark">
                            <Shield size={16} className="text-brand-orange" /> Shadow AI spreading unchecked
                          </Link>
                        </DropdownMenu.Item>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gray mb-4">Browse by Audience</div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {["C-Suite", "Security", "Finance", "AI Leaders", "IT Admin"].map((pill) => (
                          <Link key={pill} to="/use-cases" className="bg-brand-cream text-brand-dark text-xs font-medium px-3 py-1.5 rounded-full hover:bg-brand-orange hover:text-white transition-colors">
                            {pill}
                          </Link>
                        ))}
                      </div>
                      <Link to="/use-cases" className="text-brand-orange text-sm font-medium hover:underline">
                        Browse the full library →
                      </Link>
                    </div>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Resources Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-1 text-sm font-medium text-brand-dark hover:text-brand-orange outline-none cursor-pointer">
                Resources <ChevronDown size={14} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white rounded-2xl shadow-heavy p-6 min-w-[480px] mt-2 z-[60] animate-in fade-in slide-in-from-top-2" sideOffset={8}>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      {[
                        { icon: <BookOpen size={16} />, label: "Blog" },
                        { icon: <FileText size={16} />, label: "Guides" },
                        { icon: <FileText size={16} />, label: "White Papers" },
                        { icon: <Calendar size={16} />, label: "Events" },
                        { icon: <GitCompare size={16} />, label: "Compare" },
                      ].map((item) => (
                        <DropdownMenu.Item key={item.label} className="outline-none">
                          <span className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-cream transition-colors text-sm text-brand-dark cursor-pointer">
                            <span className="text-brand-gray">{item.icon}</span> {item.label}
                          </span>
                        </DropdownMenu.Item>
                      ))}
                    </div>
                    <div className="bg-brand-cream rounded-xl p-4">
                      <HelpCircle size={20} className="text-brand-orange mb-2" />
                      <div className="font-bold text-brand-dark text-sm mb-1">AI Glossary</div>
                      <div className="text-xs text-brand-gray">100+ terms explained for enterprise teams.</div>
                    </div>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Company Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-1 text-sm font-medium text-brand-dark hover:text-brand-orange outline-none cursor-pointer">
                Company <ChevronDown size={14} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white rounded-2xl shadow-heavy p-6 min-w-[420px] mt-2 z-[60] animate-in fade-in slide-in-from-top-2" sideOffset={8}>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <DropdownMenu.Item className="outline-none" asChild>
                        <Link to="/about" className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-cream transition-colors text-sm text-brand-dark">
                          <Building size={16} className="text-brand-gray" /> About
                        </Link>
                      </DropdownMenu.Item>
                      {[
                        { icon: <Lock size={16} />, label: "Security" },
                        { icon: <Briefcase size={16} />, label: "Careers" },
                        { icon: <Phone size={16} />, label: "Contact" },
                      ].map((item) => (
                        <DropdownMenu.Item key={item.label} className="outline-none">
                          <span className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-cream transition-colors text-sm text-brand-dark cursor-pointer">
                            <span className="text-brand-gray">{item.icon}</span> {item.label}
                          </span>
                        </DropdownMenu.Item>
                      ))}
                    </div>
                    <div className="bg-brand-cream rounded-xl p-4">
                      <Mail size={20} className="text-brand-orange mb-2" />
                      <div className="font-bold text-brand-dark text-sm mb-1">Talk to us</div>
                      <div className="text-xs text-brand-gray mb-3">Get in touch with our team.</div>
                      <span className="text-brand-orange text-sm font-medium cursor-pointer hover:underline">Contact sales →</span>
                    </div>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:inline-flex bg-brand-orange text-white rounded-full text-sm px-5 py-2.5 font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-brand-orange/20">
              Get Started
            </Link>

            {/* Mobile Nav Toggle */}
            <button 
              className="md:hidden p-2 text-brand-dark hover:text-brand-orange transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>

            {/* Mobile Overlay Menu */}
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] animate-in fade-in" />
                <Dialog.Content className="fixed inset-0 z-[101] p-6 flex flex-col bg-transparent overflow-y-auto w-full h-full max-h-screen">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
                        <Grid2x2 className="text-white w-5 h-5" />
                      </div>
                      <span className="ml-2 text-xl font-bold text-brand-dark">Devise</span>
                    </div>
                    <button 
                      onClick={() => setMobileOpen(false)}
                      className="p-2 text-brand-gray hover:text-brand-dark bg-gray-100 rounded-full transition-colors h-12 w-12 flex items-center justify-center"
                      aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-xl font-semibold text-brand-dark">
                    <Link to="/product/oversight" className="py-4 hover:text-brand-orange transition-colors" onClick={() => setMobileOpen(false)}>Oversight</Link>
                    <Link to="/product/pulse" className="py-4 hover:text-brand-orange transition-colors" onClick={() => setMobileOpen(false)}>Pulse</Link>
                    <Link to="/product/spend" className="py-4 hover:text-brand-orange transition-colors" onClick={() => setMobileOpen(false)}>Spend</Link>
                    <Link to="/use-cases" className="py-4 hover:text-brand-orange transition-colors" onClick={() => setMobileOpen(false)}>Use Cases</Link>
                    <Link to="/about" className="py-4 hover:text-brand-orange transition-colors" onClick={() => setMobileOpen(false)}>About</Link>
                    <Link to="/demo" className="py-4 hover:text-brand-orange transition-colors" onClick={() => setMobileOpen(false)}>Book a Demo</Link>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center w-full bg-brand-orange text-white rounded-full py-4 font-semibold text-lg hover:bg-orange-600 transition-colors">
                      Get Started
                    </Link>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </nav>
    </div>
  );

};
