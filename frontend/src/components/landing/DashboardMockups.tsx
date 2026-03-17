import { Shield, BarChart2, DollarSign, LayoutGrid, Settings, Search, User } from "lucide-react";

export const HeroDashboard = () => (
  <div className="w-full h-full bg-white flex text-[10px] md:text-xs">
    <div className="w-1/4 border-r border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-brand-orange rounded flex items-center justify-center">
          <LayoutGrid size={12} className="text-white" />
        </div>
        <span className="font-bold text-brand-dark">Devise</span>
      </div>
      {[
        { icon: <LayoutGrid size={14} />, label: "Dashboard", active: true },
        { icon: <Shield size={14} />, label: "Oversight" },
        { icon: <BarChart2 size={14} />, label: "Pulse" },
        { icon: <DollarSign size={14} />, label: "Spend" },
        { icon: <Settings size={14} />, label: "Settings" },
      ].map((item) => (
        <div key={item.label} className={`flex items-center gap-2 p-2 rounded-lg ${item.active ? "bg-orange-50 text-brand-orange" : "text-brand-gray"}`}>
          {item.icon} <span className="font-medium">{item.label}</span>
        </div>
      ))}
    </div>
    <div className="flex-1 bg-gray-50 p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-brand-dark">AI Tool Activity</h3>
        <div className="hidden md:flex gap-2">
          <div className="bg-white border border-gray-200 rounded px-2 py-1 flex items-center gap-2 text-gray-400">
            <Search size={10} /> Search...
          </div>
          <div className="bg-white border border-gray-200 rounded px-2 py-1">Status: All</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-3 font-semibold text-brand-gray">Tool Name</th>
              <th className="p-3 font-semibold text-brand-gray hidden md:table-cell">Users</th>
              <th className="p-3 font-semibold text-brand-gray">Risk</th>
              <th className="p-3 font-semibold text-brand-gray">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { name: "ChatGPT", users: 47, risk: "HIGH", status: "Blocked", riskColor: "text-red-500 bg-red-50", statusColor: "text-red-500 bg-red-50" },
              { name: "Claude", users: 23, risk: "LOW", status: "Active", riskColor: "text-green-500 bg-green-50", statusColor: "text-green-500 bg-green-50" },
              { name: "Copilot", users: 89, risk: "LOW", status: "Active", riskColor: "text-green-500 bg-green-50", statusColor: "text-green-500 bg-green-50" },
              { name: "Cursor", users: 12, risk: "MED", status: "Monitor", riskColor: "text-orange-500 bg-orange-50", statusColor: "text-orange-500 bg-orange-50" },
              { name: "Midjourney", users: 8, risk: "MED", status: "Monitor", riskColor: "text-orange-500 bg-orange-50", statusColor: "text-orange-500 bg-orange-50" },
            ].map((row) => (
              <tr key={row.name}>
                <td className="p-3 font-bold text-brand-dark">{row.name}</td>
                <td className="p-3 text-brand-gray hidden md:table-cell">{row.users}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${row.riskColor}`}>{row.risk}</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${row.statusColor}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const OversightMockup = () => (
  <div className="p-6 bg-white h-full">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h4 className="text-xs font-bold text-brand-dark mb-1">Violations Feed</h4>
        <p className="text-[10px] text-brand-gray">Real-time policy enforcement</p>
      </div>
      <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-gray-200 flex items-center justify-center text-[10px] font-bold text-brand-dark">84%</div>
    </div>
    <div className="space-y-3">
      {[
        { user: "Ankit S.", tool: "ChatGPT", type: "SENSITIVE DATA", time: "2m ago" },
        { user: "Sarah L.", tool: "Midjourney", type: "UNAUTHORIZED", time: "14m ago" },
        { user: "James K.", tool: "DeepL", type: "DATA LEAK", time: "1h ago" },
      ].map((v, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={12} />
            </div>
            <div>
              <div className="font-bold text-[10px] text-brand-dark">{v.user}</div>
              <div className="text-[8px] text-brand-gray">{v.tool} · {v.time}</div>
            </div>
          </div>
          <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[8px] font-black">{v.type}</span>
        </div>
      ))}
    </div>
  </div>
);

export const PulseMockup = () => (
  <div className="p-6 bg-white h-full">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h4 className="text-xs font-bold text-brand-dark mb-1">AI Adoption</h4>
        <p className="text-[10px] text-brand-gray">Behavioral analytics</p>
      </div>
      <div className="w-12 h-12 rounded-full border-4 border-brand-purple border-t-gray-200 flex items-center justify-center text-[10px] font-bold text-brand-dark">73%</div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="text-[10px] font-bold text-brand-dark mb-2">Top Tools by Usage</div>
      {[
        { tool: "Code Assistant", pct: 43, color: "bg-brand-purple" },
        { tool: "Writing", pct: 31, color: "bg-pink-500" },
        { tool: "Image Gen", pct: 18, color: "bg-brand-orange" },
      ].map((t) => (
        <div key={t.tool} className="flex items-center gap-2">
          <span className="text-[9px] text-brand-gray w-20">{t.tool}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.pct}%` }} />
          </div>
          <span className="text-[9px] font-bold text-brand-dark">{t.pct}%</span>
        </div>
      ))}
    </div>
    <div className="text-[10px] font-bold text-brand-dark mb-2">Team Leaderboard</div>
    {[
      { team: "Engineering", rate: "89%" },
      { team: "Product", rate: "72%" },
      { team: "Marketing", rate: "45%" },
    ].map((t) => (
      <div key={t.team} className="flex justify-between py-1.5 border-b border-gray-50 text-[10px]">
        <span className="text-brand-dark font-medium">{t.team}</span>
        <span className="text-brand-purple font-bold">{t.rate}</span>
      </div>
    ))}
  </div>
);

export const SpendMockup = () => (
  <div className="p-6 bg-white h-full">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h4 className="text-xs font-bold text-brand-dark mb-1">Spend Overview</h4>
        <p className="text-[10px] text-brand-gray">Subscription intelligence</p>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-brand-dark">$2,182</div>
        <div className="text-[8px] text-brand-gray">Monthly Spend</div>
      </div>
    </div>
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full text-[9px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left p-2 text-brand-gray font-semibold">Tool</th>
            <th className="text-left p-2 text-brand-gray font-semibold">Used</th>
            <th className="text-left p-2 text-brand-gray font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {[
            { tool: "Copilot", used: "67/200", status: "Zombie", zombie: true },
            { tool: "ChatGPT", used: "45/50", status: "Active", zombie: false },
            { tool: "Jasper", used: "3/25", status: "Zombie", zombie: true },
            { tool: "Notion AI", used: "89/100", status: "Active", zombie: false },
          ].map((r) => (
            <tr key={r.tool} className="border-b border-gray-50">
              <td className="p-2 font-bold text-brand-dark">{r.tool}</td>
              <td className="p-2 text-brand-gray">{r.used}</td>
              <td className="p-2">
                <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold ${r.zombie ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"}`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
