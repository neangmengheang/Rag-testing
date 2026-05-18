import { UploadDashboard } from './components/UploadDashboard';
import { Layout, Globe, Zap, Settings, Shield, Terminal, Database, Layers } from 'lucide-react';
import React, { ReactNode } from 'react';

export default function App() {
  // Demo values
  const demoRoomId = 'room_q4_fiscal_2024';
  const demoUserId = 'usr_2940';

  return (
    <div className="flex h-screen w-full font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 flex flex-col bg-brand-sidebar shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-serif italic text-lg text-white font-medium">Segmentum</span>
          </div>
          
          <nav className="space-y-1">
            <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-2 px-3">Collections</div>
            <NavItem icon={<Database size={14} />} label="Knowledge Base" active />
            <NavItem icon={<Globe size={14} />} label="Vector Stores" />
            <NavItem icon={<Terminal size={14} />} label="Edge Logs" />
            <NavItem icon={<Settings size={14} />} label="Settings" />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-500">
              SA
            </div>
            <div className="text-xs font-medium">
              <div className="text-white">Heang Admin</div>
              <div className="text-neutral-500">ID: {demoUserId}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-8 bg-brand-bg shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm text-neutral-400">Room Context:</h2>
            <span className="text-xs font-mono px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-emerald-400/80">
              {demoRoomId}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse"></span>
              Edge Function Online
            </span>
          </div>
        </header>

        <div className="flex-1 p-8 flex gap-8 overflow-y-auto">
          {/* Left Panel: Upload and Status */}
          <div className="flex-1 flex flex-col gap-8 min-w-[480px]">
            <section>
              <h1 className="text-2xl font-serif text-white mb-2 italic">Upload Documentation</h1>
              <p className="text-sm text-neutral-500 mb-6">
                Ingest PDF files directly into the <code className="text-emerald-500/80 font-mono">doc_segments</code> vector table using Gemini text-embedding-004.
              </p>
              
              <UploadDashboard room_id={demoRoomId} user_id={demoUserId} />
            </section>

            <section className="bg-neutral-900/30 border border-neutral-800/60 rounded-xl p-6">
              <h3 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-4 font-bold flex items-center gap-2">
                <Layers size={12} /> Processing Pipeline
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-800/50">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white font-medium">No active tasks</span>
                    <span className="text-neutral-500 italic uppercase text-[9px] tracking-tighter">Standby</span>
                  </div>
                  <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-emerald-500 rounded-full transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Panel: Data View */}
          <div className="w-80 flex flex-col gap-6 shrink-0">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 shadow-2xl">
              <h3 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-4 font-bold">Segment Metadata</h3>
              <div className="space-y-3">
                <MetadataRow label="Table" value="public.doc_segments" mono color="text-emerald-400" />
                <MetadataRow label="Vector Model" value="text-embedding-004" mono />
                <MetadataRow label="Dimensions" value="768" mono />
                <MetadataRow label="Chunking Policy" value="1500 chars" />
              </div>
            </div>

            <div className="flex-1 bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 overflow-hidden flex flex-col shadow-2xl">
              <h3 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-4 font-bold">Edge Function Preview</h3>
              <div className="flex-1 font-mono text-[10px] leading-relaxed overflow-y-auto text-neutral-400 custom-scrollbar">
                <p className="text-emerald-500/60 mb-2">// index.ts - Deno Runtime</p>
                <div className="space-y-1">
                  <p><span className="text-purple-400">import</span> {'{ serve }'} <span className="text-purple-400">from</span> <span className="text-neutral-500">"server.ts"</span></p>
                  <p><span className="text-purple-400">import</span> GenAI <span className="text-purple-400">from</span> <span className="text-neutral-500">"genai"</span></p>
                  <br />
                  <p><span className="text-blue-400">async function</span> handle(req) {'{'}</p>
                  <p className="pl-4">const config = <span className="text-purple-400">await</span> supabase</p>
                  <p className="pl-8">.from(<span className="text-neutral-500">'config'</span>)</p>
                  <p className="pl-8 text-neutral-500">// Fetch logic...</p>
                  <br />
                  <p className="pl-4 text-emerald-500/60">// GEMINI EMBEDDING LOGIC</p>
                  <p className="pl-4"><span className="text-purple-400">const</span> {'{ values }'} = <span className="text-purple-400">await</span> embed(text)</p>
                  <p className="pl-4">{'}'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a 
      href="#" 
      className={`flex items-center gap-3 px-3 py-2 text-sm transition-all rounded-md ${
        active 
          ? "text-white bg-neutral-800 border border-neutral-700" 
          : "text-neutral-400 hover:text-white hover:bg-neutral-800/30"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}

function MetadataRow({ label, value, mono = false, color = "text-white" }: { label: string, value: string, mono?: boolean, color?: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-800 pb-2">
      <span className="text-[10px] text-neutral-500 uppercase tracking-tighter self-center">{label}</span>
      <span className={`text-[11px] ${mono ? "font-mono" : ""} ${color} font-medium`}>{value}</span>
    </div>
  );
}

