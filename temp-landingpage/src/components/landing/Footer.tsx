import { Link } from "react-router-dom";
import { Grid2x2 } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-brand-navy text-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
                <Grid2x2 className="text-white w-5 h-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-white">Devise</span>
            </div>
            <p className="text-gray-400 max-w-xs text-balance">
              See, understand, and govern enterprise AI. The system of record for the AI-first organization.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-brand-orange">Product</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/product/oversight" className="hover:text-white transition-colors">Oversight</Link></li>
              <li><Link to="/product/pulse" className="hover:text-white transition-colors">Pulse</Link></li>
              <li><Link to="/product/spend" className="hover:text-white transition-colors">Spend</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-brand-orange">Use Cases</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/use-cases" className="hover:text-white transition-colors">Adoption Scoreboard</Link></li>
              <li><Link to="/use-cases" className="hover:text-white transition-colors">Confidential Data Risks</Link></li>
              <li><Link to="/use-cases" className="hover:text-white transition-colors">Did Your Deployment Work?</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-brand-orange">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Security</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Careers</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Contact</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>© 2025 Devise, Inc. · SOC 2 · GDPR</div>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
