import { X, ExternalLink } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div 
        className="bg-white flex flex-col relative"
        style={{ width: "100%", maxWidth: 440, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#F0F2F5]">
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
            Help & Documentation
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full transition-colors hover:bg-[#F8FAFC]"
            style={{ color: "#94A3B8" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <a
            href="https://docs.devise.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-[#E2E8F0] hover:border-[#FF5C1A] hover:bg-[#FFF3EE] transition-all group cursor-pointer"
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }} className="group-hover:text-[#FF5C1A] transition-colors">
              Getting Started Guide
            </span>
            <ExternalLink size={18} className="text-[#94A3B8] group-hover:text-[#FF5C1A]" />
          </a>

          <a
            href="https://docs.devise.ai/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-[#E2E8F0] hover:border-[#FF5C1A] hover:bg-[#FFF3EE] transition-all group cursor-pointer"
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }} className="group-hover:text-[#FF5C1A] transition-colors">
              API Documentation
            </span>
            <ExternalLink size={18} className="text-[#94A3B8] group-hover:text-[#FF5C1A]" />
          </a>

          <a
            href="mailto:support@devise.ai"
            className="flex items-center justify-between p-4 rounded-xl border border-[#E2E8F0] hover:border-[#FF5C1A] hover:bg-[#FFF3EE] transition-all group cursor-pointer"
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }} className="group-hover:text-[#FF5C1A] transition-colors">
              Contact Support
            </span>
            <ExternalLink size={18} className="text-[#94A3B8] group-hover:text-[#FF5C1A]" />
          </a>
        </div>
      </div>
    </div>
  );
}
