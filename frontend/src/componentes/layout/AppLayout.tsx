import type { ReactNode } from "react";
import { LayoutDashboard, Users, FileText, Settings, Bell, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
    // Configuração rápida de links da barra lateral
    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", active: false },
        { icon: Users, label: "Clientes", active: true },
        { icon: FileText, label: "Contratos", active: false },
        { icon: CircleDollarSign, label: "Financeiro", active: false },
        { icon: Settings, label: "Configurações", active: false },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 flex overflow-hidden selection:bg-indigo-500/30">

            {/* Sidebar - Fixa na Esquerda */}
            <aside className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col hidden md:flex h-screen relative z-20">
                <div className="h-16 flex items-center px-6 border-b border-white/10 shadow-sm relative overflow-hidden">
                    {/* Subtle gradient pra dar feeling premium no logo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                        DukesFreela
                    </h1>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/10">ERP</span>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                        Menu Principal
                    </p>
                    {navItems.map((item, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                item.active
                                    ? "bg-indigo-500/10 text-indigo-400"
                                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", item.active ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                            {item.label}

                            {item.active && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Footer no Sidebar */}
                <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-sm font-bold shadow-soft">
                            DF
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-medium text-zinc-200">Admin Dukes</span>
                            <span className="text-xs text-zinc-500 truncate max-w-[120px]">admin@dukes.com</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950/50 relative">
                {/* Top Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-zinc-100">Gestão de Clientes</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-50 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-900" />
                        </button>
                        <div className="h-8 w-[1px] bg-white/10" />
                        <span className="text-sm text-zinc-400 font-medium">Ambiente de Testes (MVP)</span>
                    </div>
                </header>

                {/* Scrollable Page Wrapper */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {/* Efeito Glow no Fundo Geração de Profundidade */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
