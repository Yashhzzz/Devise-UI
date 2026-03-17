import { useState, useEffect, useRef } from "react";
import { Search, Activity } from "lucide-react";

type Tab = "overview" | "live-feed" | "analytics" | "devices" | "alerts" | "subscriptions" | "settings" | "team" | "firewall" | "data-risk";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: Tab) => void;
}

const recentEvents = [
  { id: "e1", text: "OpenAI API detected — yashm", time: "2 min ago" },
  { id: "e2", text: "GitHub Copilot active — alex", time: "15 min ago" },
  { id: "e3", text: "Midjourney usage spike — design", time: "1 hr ago" },
  { id: "e4", text: "Cursor Pro detected — sarah", time: "2 hr ago" },
  { id: "e5", text: "Notion AI disabled — system", time: "4 hr ago" },
];

const tools = [
  { id: "t1", name: "ChatGPT Enterprise", category: "LLM", color: "#10A37F" },
  { id: "t2", name: "GitHub Copilot", category: "Coding", color: "#181717" },
  { id: "t3", name: "Midjourney", category: "Image", color: "#FF5C1A" },
];

const users = [
  { id: "u1", name: "Yash M", email: "yash@devise.ai", dept: "Engineering", initial: "YM", color: "#FF5C1A" },
  { id: "u2", name: "Alex J", email: "alex@devise.ai", dept: "Product", initial: "AJ", color: "#3B82F6" },
  { id: "u3", name: "Sarah K", email: "sarah@devise.ai", dept: "Design", initial: "SK", color: "#8B5CF6" },
];

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("devise-recent-searches");
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Derived state
  const lowerQ = query.toLowerCase();
  const isQueryEmpty = lowerQ.trim() === "";
  
  const filteredEvents = isQueryEmpty ? [] : recentEvents.filter(e => e.text.toLowerCase().includes(lowerQ));
  const filteredTools = isQueryEmpty ? [] : tools.filter(t => t.name.toLowerCase().includes(lowerQ));
  const filteredUsers = isQueryEmpty ? [] : users.filter(u => u.name.toLowerCase().includes(lowerQ) || u.email.toLowerCase().includes(lowerQ));

  const totalResults = filteredEvents.length + filteredTools.length + filteredUsers.length;

  const flatItems: { type: string; item: any; }[] = [
    ...filteredEvents.map(item => ({ type: "event", item })),
    ...filteredTools.map(item => ({ type: "tool", item })),
    ...filteredUsers.map(item => ({ type: "user", item }))
  ];

  const handleSelect = (itemInfo: { type: string; item: any }) => {
    if (!isQueryEmpty) {
      const newRecents = [query.trim(), ...recentSearches.filter(q => q !== query.trim())].slice(0, 5);
      localStorage.setItem("devise-recent-searches", JSON.stringify(newRecents));
      setRecentSearches(newRecents);
    }

    if (onNavigate) {
      if (itemInfo.type === "event") onNavigate("live-feed");
      else if (itemInfo.type === "tool") onNavigate("subscriptions");
      else if (itemInfo.type === "user") onNavigate("devices");
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatItems.length > 0 ? flatItems.length - 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems.length > 0 && selectedIndex >= 0 && selectedIndex < flatItems.length) {
          handleSelect(flatItems[selectedIndex]);
        } else if (isQueryEmpty && recentSearches.length > 0) {
          // If they hit enter on empty, maybe do nothing.
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatItems, onClose, isQueryEmpty, query, recentSearches, onNavigate]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (scrollRef.current) {
      const activeItem = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div 
        className="flex flex-col overflow-hidden bg-white relative"
        style={{ width: 600, maxHeight: 500, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 shrink-0" style={{ borderBottom: "1px solid #F0F2F5", height: 56 }}>
          <Search size={20} color="#94A3B8" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools, users, events, devices..."
            className="flex-1 bg-transparent outline-none px-3"
            style={{ fontSize: 16, fontFamily: "Inter, sans-serif", color: "#1A1A2E" }}
          />
          <div 
            className="flex items-center justify-center rounded"
            style={{ padding: "2px 6px", border: "1px solid #E2E8F0", fontSize: 11, fontWeight: 600, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
          >
            ESC
          </div>
        </div>

        {/* Results */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
          {isQueryEmpty ? (
            recentSearches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Search size={32} color="#E2E8F0" />
                <span style={{ color: "#94A3B8", fontSize: 14, fontFamily: "Inter, sans-serif" }}>
                  Search for tools, users, and events
                </span>
              </div>
            ) : (
              <div className="mb-2">
                <div className="flex justify-between items-center px-4 py-2">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", fontFamily: "Inter, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Recent Searches
                  </span>
                  <button 
                    onClick={() => { localStorage.removeItem("devise-recent-searches"); setRecentSearches([]); }}
                    style={{ fontSize: 11, fontWeight: 500, color: "#FF5C1A", fontFamily: "Inter, sans-serif", border: "none", background: "none", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    Clear history
                  </button>
                </div>
                {recentSearches.map((rs, idx) => (
                  <div
                    key={idx}
                    className="flex items-center px-4 transition-colors duration-150 cursor-pointer"
                    style={{ height: 44 }}
                    onClick={() => setQuery(rs)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Search size={16} color="#94A3B8" className="mr-3" />
                    <span style={{ fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>{rs}</span>
                  </div>
                ))}
              </div>
            )
          ) : totalResults === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Search size={32} color="#E2E8F0" />
              <span style={{ color: "#94A3B8", fontSize: 14, fontFamily: "Inter, sans-serif" }}>
                No results for '{query}'
              </span>
            </div>
          ) : (
            <>
              {filteredEvents.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2" style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", fontFamily: "Inter, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Recent Events
                  </div>
                  {filteredEvents.map(e => {
                    const globalIndex = flatItems.findIndex(i => i.item.id === e.id);
                    const isActive = selectedIndex === globalIndex;
                    return (
                      <div
                        key={e.id}
                        data-active={isActive}
                        className="flex items-center justify-between px-4 transition-colors duration-150 cursor-pointer"
                        style={{ height: 44, backgroundColor: isActive ? "#FFF3EE" : "transparent" }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        onClick={() => handleSelect({ type: "event", item: e })}
                      >
                        <div className="flex items-center gap-3">
                          <Activity size={16} color="#94A3B8" strokeWidth={2} />
                          <span style={{ fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>{e.text}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>{e.time}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredTools.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2" style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", fontFamily: "Inter, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Tools
                  </div>
                  {filteredTools.map(t => {
                    const globalIndex = flatItems.findIndex(i => i.item.id === t.id);
                    const isActive = selectedIndex === globalIndex;
                    return (
                      <div
                        key={t.id}
                        data-active={isActive}
                        className="flex items-center justify-between px-4 transition-colors duration-150 cursor-pointer"
                        style={{ height: 44, backgroundColor: isActive ? "#FFF3EE" : "transparent" }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        onClick={() => handleSelect({ type: "tool", item: t })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: t.color }} />
                          <span style={{ fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>{t.name}</span>
                        </div>
                        <div 
                          className="flex items-center justify-center rounded-full"
                          style={{ padding: "2px 8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 11, fontWeight: 500, color: "#64748B", fontFamily: "Inter, sans-serif" }}
                        >
                          {t.category}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredUsers.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2" style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", fontFamily: "Inter, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Users
                  </div>
                  {filteredUsers.map(u => {
                    const globalIndex = flatItems.findIndex(i => i.item.id === u.id);
                    const isActive = selectedIndex === globalIndex;
                    return (
                      <div
                        key={u.id}
                        data-active={isActive}
                        className="flex items-center justify-between px-4 transition-colors duration-150 cursor-pointer"
                        style={{ height: 44, backgroundColor: isActive ? "#FFF3EE" : "transparent" }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        onClick={() => handleSelect({ type: "user", item: u })}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ width: 24, height: 24, backgroundColor: u.color, color: "white", fontSize: 10, fontWeight: 600, fontFamily: "Inter, sans-serif" }}
                          >
                            {u.initial}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>{u.name}</span>
                            <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>{u.email}</span>
                          </div>
                        </div>
                        <div 
                          className="flex items-center justify-center rounded-full"
                          style={{ padding: "2px 8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 11, fontWeight: 500, color: "#64748B", fontFamily: "Inter, sans-serif" }}
                        >
                          {u.dept}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
