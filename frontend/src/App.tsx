import { useState } from "react";
import { useAuth } from "./contextos/AuthContext";
import { LoginPage } from "./componentes/auth/LoginPage";
import { ClientesList } from "./componentes/clientes/ClientesList";
import { ContratosList } from "./componentes/contratos/ContratosList";
import { FinanceiroDashboard } from "./componentes/financeiro/FinanceiroDashboard";
import { ProjetosKanban } from "./componentes/projetos/ProjetosKanban";
import { DashboardPrincipal } from "./componentes/dashboard/DashboardPrincipal";
import { ConfiguracoesPage } from "./componentes/configuracoes/ConfiguracoesPage";
import { RelatoriosPage } from "./componentes/relatorios/RelatoriosPage";
import { cn } from "@/lib/utils";

const MODULE_TITLES: Record<string, string> = {
  dashboard: "Visão Geral do Time",
  clientes: "Clientes",
  contratos: "Contratos",
  projetos: "Desenvolvimento - Projetos",
  financeiro: "Faturamento",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};

function App() {
  const { isAutenticado, usuario, logout } = useAuth();
  const [activeModule, setActiveModule] = useState("dashboard");

  if (!isAutenticado) return <LoginPage />;

  return (
    <div className="bg-dark-950 text-gray-200 font-sans h-screen flex overflow-hidden">
      {/* BEGIN: Main Sidebar Container */}
      <aside className="w-72 bg-dark-900 border-r border-dark-700/50 flex flex-col h-full" data-purpose="navigation-sidebar">
        {/* BEGIN: User Profile & Workspace Switcher */}
        <div className="p-5">
          <div className="flex items-center justify-between group cursor-pointer p-2.5 rounded-theme hover:bg-dark-800 transition-all duration-200 border border-transparent hover:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand/20">
                {usuario?.nome?.charAt(0).toUpperCase() || "DF"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight truncate w-32">Workspace de {usuario?.nome?.split(' ')[0] || "Admin"}</span>
                <span className="text-[11px] text-gray-500 font-medium truncate w-32">Plano Premium</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-500 text-lg">unfold_more</span>
          </div>
        </div>
        {/* END: User Profile & Workspace Switcher */}

        {/* BEGIN: Global Search & Notifications */}
        <div className="px-5 pb-4 space-y-1.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-theme hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700/50">
            <span className="material-symbols-outlined text-[20px]">search</span>
            <span className="font-medium">Buscar</span>
            <span className="ml-auto text-[10px] bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700 text-gray-500 font-mono">⌘K</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-theme hover:bg-dark-800 transition-all border border-transparent hover:border-dark-700/50">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="font-medium">Notificações</span>
            <span className="ml-auto w-2 h-2 bg-brand rounded-full ring-4 ring-brand/10"></span>
          </button>
        </div>
        {/* END: Global Search & Notifications */}

        {/* BEGIN: Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 space-y-8 custom-scrollbar">
          
          {/* BEGIN: Favorites Section */}
          <section data-purpose="favorites-nav">
            <header className="px-3 mb-3 flex justify-between items-center group">
              <span className="sidebar-section-title">Favoritos</span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-dark-800 rounded">
                <span className="material-symbols-outlined text-sm text-gray-500 hover:text-white">add</span>
              </button>
            </header>
            <div className="space-y-0.5">
              <button 
                onClick={() => setActiveModule("projetos")}
                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm rounded-theme transition-all font-medium text-left", activeModule === "projetos" ? "active-nav" : "nav-item-hover text-gray-400")}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span>Sprint Backlog</span>
              </button>
              <button 
                onClick={() => setActiveModule("dashboard")}
                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm rounded-theme transition-all font-medium text-left", activeModule === "dashboard" ? "active-nav" : "nav-item-hover text-gray-400")}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Visão Geral do Time</span>
              </button>
            </div>
          </section>
          {/* END: Favorites Section */}

          {/* BEGIN: Spaces Section */}
          <section data-purpose="spaces-nav">
            <header className="px-3 mb-3 flex justify-between items-center group">
              <span className="sidebar-section-title">Espaços</span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-dark-800 rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-gray-500 hover:text-white">add</span>
              </button>
            </header>
            <div className="space-y-1">
              {/* Space: Design (Dummy) */}
              <div className="space-y-0.5">
                <div className="nav-item-hover flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 rounded-theme cursor-pointer">
                  <span className="material-symbols-outlined text-gray-600 text-[18px]">chevron_right</span>
                  <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold border border-purple-500/30">D</div>
                  <span className="flex-1 font-medium">Design</span>
                </div>
              </div>

              {/* Space: Marketing (Dummy) */}
              <div className="space-y-0.5">
                  <div className="nav-item-hover flex items-center gap-3 px-3 py-2.5 text-sm text-white rounded-theme cursor-pointer bg-dark-800/30">
                  <span className="material-symbols-outlined text-gray-500 text-[18px] rotate-90">chevron_right</span>
                  <div className="w-6 h-6 rounded-md bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px] font-bold border border-pink-500/30">M</div>
                  <span className="flex-1 font-semibold">Marketing</span>
                  </div>
                  <div className="ml-7 mt-1 space-y-0.5 border-l border-dark-700/50 pl-3">
                  <div className="flex flex-col">
                      <div className="nav-item-hover flex items-center gap-2.5 px-3 py-2 text-xs text-gray-400 rounded-theme cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">folder</span>
                      <span className="font-medium">Campanhas 2024</span>
                      </div>
                      <div className="ml-4 space-y-0.5">
                      <div className="nav-item-hover flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-gray-500 rounded-theme cursor-pointer">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                          <span>Mídias Sociais</span>
                      </div>
                      <div className="nav-item-hover flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-brand font-semibold rounded-theme cursor-pointer bg-brand/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                          <span>E-mail Marketing</span>
                      </div>
                      </div>
                  </div>
                  </div>
              </div>

              {/* Space: Desenvolvimento -> Map to Projetos KanBan */}
              <div className="space-y-0.5">
                <button onClick={() => setActiveModule("projetos")} className={cn("w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm rounded-theme cursor-pointer transition-all", activeModule === "projetos" ? "bg-dark-800/30 text-white" : "text-gray-400 nav-item-hover relative")}>
                  {activeModule === "projetos" && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand rounded-r-full"></div>}
                  <span className={cn("material-symbols-outlined text-[18px]", activeModule === "projetos" ? "text-brand" : "text-gray-600")}>chevron_right</span>
                  <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-600/30">DV</div>
                  <span className={cn("flex-1", activeModule === "projetos" ? "font-semibold" : "font-medium")}>Desenvolvimento</span>
                </button>
              </div>
            </div>
          </section>
          {/* END: Spaces Section */}

          {/* BEGIN: Negócio Section */}
          <section data-purpose="business-nav">
            <header className="px-3 mb-3 flex justify-between items-center group">
              <span className="sidebar-section-title">Negócio</span>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-dark-800 rounded">
                <span className="material-symbols-outlined text-sm text-gray-500 hover:text-white">settings</span>
              </button>
            </header>
            <div className="space-y-1">
              <div className="space-y-0.5">
                <div className="nav-item-hover flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 rounded-theme cursor-pointer">
                  <span className="material-symbols-outlined text-gray-500 text-[18px] rotate-90">chevron_right</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30">N</div>
                  <span className="flex-1 font-medium text-white">Negócio</span>
                </div>
                <div className="ml-7 mt-1 space-y-0.5 border-l border-dark-700/50 pl-3">
                  <button 
                    onClick={() => setActiveModule("contratos")}
                    className={cn("w-full text-left flex items-center gap-3 px-3 py-2 text-xs rounded-theme transition-all font-medium", activeModule === "contratos" ? "active-nav" : "nav-item-hover text-gray-400")}
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    <span>Contratos</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule("clientes")}
                    className={cn("w-full text-left flex items-center gap-3 px-3 py-2 text-xs rounded-theme transition-all font-medium", activeModule === "clientes" ? "active-nav" : "nav-item-hover text-gray-400")}
                  >
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    <span>Clientes</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule("financeiro")}
                    className={cn("w-full text-left flex items-center gap-3 px-3 py-2 text-xs rounded-theme transition-all font-medium", activeModule === "financeiro" ? "active-nav" : "nav-item-hover text-gray-400")}
                  >
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    <span>Faturamento</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule("relatorios")}
                    className={cn("w-full text-left flex items-center gap-3 px-3 py-2 text-xs rounded-theme transition-all font-medium", activeModule === "relatorios" ? "active-nav" : "nav-item-hover text-gray-400")}
                  >
                    <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                    <span>Relatórios</span>
                  </button>
                  <button 
                    className="w-full text-left nav-item-hover flex items-center gap-3 px-3 py-2 text-xs text-gray-400 rounded-theme transition-all font-medium cursor-not-allowed opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                    <span>Funcionários</span>
                  </button>
                  <button 
                    onClick={() => setActiveModule("configuracoes")}
                    className={cn("w-full text-left flex items-center gap-3 px-3 py-2 text-xs rounded-theme transition-all font-medium", activeModule === "configuracoes" ? "active-nav" : "nav-item-hover text-gray-400")}
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    <span>Usuários do Sistema</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
          {/* END: Negócio Section */}

          {/* BEGIN: Dashboards Section */}
          <section data-purpose="dashboards-nav">
            <header className="px-3 mb-3 flex justify-between items-center">
              <span className="sidebar-section-title">Dashboards</span>
            </header>
            <div className="space-y-0.5">
              <button 
                onClick={() => setActiveModule("dashboard")}
                className={cn("w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-theme transition-all font-medium", activeModule === "dashboard" ? "active-nav" : "nav-item-hover text-gray-400")}
              >
                <span className="material-symbols-outlined text-[20px]">analytics</span>
                <span>Visão Geral do Time</span>
              </button>
            </div>
          </section>
          {/* END: Dashboards Section */}
        </div>
        {/* END: Navigation Content */}

        {/* BEGIN: Sidebar Footer */}
        <div className="mt-auto p-5 border-t border-dark-700/50 bg-dark-900">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveModule("configuracoes")} className="p-2 text-gray-500 hover:text-white hover:bg-dark-800 rounded-theme transition-all" title="Configurações">
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>
            <button onClick={logout} className="p-2 text-gray-500 hover:text-red-400 hover:bg-dark-800 rounded-theme transition-all" title="Sair">
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>
            <div className="ml-auto">
              <button onClick={() => setActiveModule("projetos")} className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white text-xs font-bold py-2 px-4 rounded-theme transition-all shadow-lg shadow-brand/20">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Projeto</span>
              </button>
            </div>
          </div>
        </div>
        {/* END: Sidebar Footer */}
      </aside>
      {/* END: Main Sidebar Container */}

      {/* BEGIN: Main Content Area */}
      <main className="flex-1 flex flex-col bg-dark-950 overflow-hidden relative">
        {/* Glow de fundo global do layout antior adaptado */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-brand/5 rounded-full blur-[150px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/3 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Header */}
        <header className="h-16 border-b border-dark-700/50 flex items-center justify-between px-8 bg-dark-900/50 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded bg-brand flex items-center justify-center shadow-md shadow-brand/20">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">{MODULE_TITLES[activeModule]}</h1>
            </div>
            {activeModule === "projetos" && (
                <>
                    <div className="h-4 w-[1px] bg-dark-700"></div>
                    <nav className="flex gap-6">
                    <button className="text-sm font-bold text-brand border-b-2 border-brand pb-5 translate-y-[10px]">Quadro</button>
                    <button className="text-sm font-medium text-gray-400 hover:text-gray-200 pb-5 translate-y-[10px] transition-colors">Lista</button>
                    <button className="text-sm font-medium text-gray-400 hover:text-gray-200 pb-5 translate-y-[10px] transition-colors">Calendário</button>
                    </nav>
                </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-dark-950 bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-20">AS</div>
              <div className="w-8 h-8 rounded-full border-2 border-dark-950 bg-green-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-10">BK</div>
              <div className="w-8 h-8 rounded-full border-2 border-dark-950 bg-brand flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-0">JD</div>
            </div>
            <button className="bg-dark-800 hover:bg-dark-700 text-gray-300 px-4 py-1.5 rounded-theme text-xs font-semibold border border-dark-700 transition-all shadow-sm">Compartilhar</button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 relative z-10 custom-scrollbar">
            {activeModule === "dashboard" && (
              <DashboardPrincipal />
            )}

            {activeModule === "clientes" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <ClientesList />
              </div>
            )}

            {activeModule === "contratos" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <ContratosList />
              </div>
            )}

            {activeModule === "projetos" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <ProjetosKanban />
              </div>
            )}

            {activeModule === "financeiro" && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <FinanceiroDashboard />
               </div>
            )}

            {activeModule === "relatorios" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <RelatoriosPage />
              </div>
            )}

            {activeModule === "configuracoes" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <ConfiguracoesPage />
              </div>
            )}
        </div>
      </main>
      {/* END: Main Content Area */}
    </div>
  );
}

export default App;
