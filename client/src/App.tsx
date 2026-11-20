import {
  BookOpen,
  ClipboardList,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import {useCallback, useState} from 'react';
import {BeneficiariesView} from './components/BeneficiariesView.tsx';
import {DashboardView} from './components/DashboardView.tsx';
import {LogsAndFeedbackView} from './components/LogsAndFeedbackView.tsx';
import {MessageLibraryView} from './components/MessageLibraryView.tsx';
import {ProgramOverviewPage} from './components/ProgramOverviewPage.tsx';
import {RoadmapView} from './components/RoadmapView.tsx';
import {SimulatedPhone} from './components/SimulatedPhone.tsx';
import {AuthProvider, useAuth} from './context/AuthContext.tsx';

type WorkspaceTab = 'dashboard' | 'beneficiaries' | 'messages' | 'phone' | 'logs' | 'roadmap';

function AuthenticatedWorkspace() {
  const {user, logout} = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [phoneDrawerOpen, setPhoneDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const bumpRefresh = useCallback(() => {
    setRefreshSignal((s) => s + 1);
  }, []);

  const handleOpenPhone = useCallback((beneficiaryId?: string) => {
    if (beneficiaryId) {
      setSelectedBeneficiaryId(beneficiaryId);
    }
    setPhoneDrawerOpen(true);
  }, []);

  const navItems: Array<{id: WorkspaceTab; label: string; icon: typeof LayoutDashboard}> = [
    {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
    {id: 'beneficiaries', label: 'Beneficiaries', icon: Users},
    {id: 'messages', label: 'Message Library', icon: BookOpen},
    {id: 'phone', label: 'Simulated Phone', icon: Smartphone},
    {id: 'logs', label: 'Feedback & Logs', icon: ClipboardList},
    {id: 'roadmap', label: 'Architecture & Roadmap', icon: Compass},
  ];

  const activeTitle = navItems.find((n) => n.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-[#F7F4EE] text-[#172323]">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#DDD5C7] bg-white lg:flex">
        <div className="border-b border-[#EFEAE0] px-6 py-5">
          <span className="font-display text-lg font-bold tracking-tight text-[#172323]">
            DignityLink
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Workspace Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0F5C5C] text-white'
                    : 'text-[#556363] hover:bg-[#F7F4EE] hover:text-[#172323]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#EFEAE0] p-4">
          <div className="rounded-lg border border-[#EFEAE0] bg-[#F7F4EE] p-3">
            <p className="truncate text-sm font-semibold text-[#172323]">{user?.name}</p>
            <p className="mt-0.5 text-xs text-[#556363]">
              {user?.role === 'coordinator' ? 'Coordinator' : 'Volunteer'} ·{' '}
              {user?.assignedCommunity}
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#DDD5C7] bg-white px-3 py-1.5 text-xs font-medium text-[#172323] transition-colors hover:border-[#B85A3A] hover:text-[#B85A3A]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Nav */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#172323]/45"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 flex w-64 flex-col bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-4">
              <span className="font-display text-lg font-bold text-[#172323]">DignityLink</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded p-1 text-[#556363]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium ${
                      active ? 'bg-[#0F5C5C] text-white' : 'text-[#556363]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DDD5C7] px-3 py-2 text-xs font-medium text-[#172323]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out ({user?.name})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#DDD5C7] bg-[#F7F4EE]/95 px-6 py-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg border border-[#DDD5C7] bg-white p-2 text-[#172323] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-[#556363] whitespace-nowrap">
              Workspace / <span className="font-semibold text-[#172323]">{activeTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'phone' && (
              <button
                type="button"
                onClick={() => setPhoneDrawerOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F5C5C] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0B4646] whitespace-nowrap shrink-0"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>{phoneDrawerOpen ? 'Close Phone Panel' : 'Phone Simulator'}</span>
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              refreshSignal={refreshSignal}
              onSchedulerExecuted={bumpRefresh}
              onOpenPhone={handleOpenPhone}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'beneficiaries' && (
            <BeneficiariesView
              refreshSignal={refreshSignal}
              onDataChanged={bumpRefresh}
              onOpenPhone={handleOpenPhone}
            />
          )}
          {activeTab === 'messages' && <MessageLibraryView />}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#172323]">
                  Simulated SMS &amp; WhatsApp Handset
                </h1>
                <p className="mt-1 text-sm text-[#556363]">
                  Preview outbound scheduled messages arriving and simulate beneficiary replies (1,
                  2, or STOP).
                </p>
              </div>
              <SimulatedPhone
                selectedBeneficiaryId={selectedBeneficiaryId}
                onSelectBeneficiaryId={setSelectedBeneficiaryId}
                refreshSignal={refreshSignal}
                onActivityChange={bumpRefresh}
              />
            </div>
          )}
          {activeTab === 'logs' && (
            <LogsAndFeedbackView
              refreshSignal={refreshSignal}
              onDataChanged={bumpRefresh}
              onOpenPhone={handleOpenPhone}
            />
          )}
          {activeTab === 'roadmap' && <RoadmapView />}
        </main>
      </div>

      {/* Persistent Slide-Over Simulated Phone Panel */}
      {phoneDrawerOpen && activeTab !== 'phone' && (
        <div
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-[#DDD5C7] bg-[#F7F4EE] p-4 shadow-2xl"
          role="complementary"
          aria-label="Simulated Phone Slide-Over Panel"
        >
          <div className="mb-3 flex items-center justify-between border-b border-[#DDD5C7] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#172323]">
                Simulated Handset
              </h2>
              <p className="text-[11px] text-[#556363]">
                Live mock SMS &amp; WhatsApp inbox
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhoneDrawerOpen(false);
                  setActiveTab('phone');
                }}
                className="rounded border border-[#DDD5C7] bg-white px-2.5 py-1 text-xs font-medium text-[#0F5C5C] hover:border-[#0F5C5C]"
              >
                Full Tab
              </button>
              <button
                type="button"
                onClick={() => setPhoneDrawerOpen(false)}
                className="rounded-lg p-1.5 text-[#556363] hover:bg-white hover:text-[#172323]"
                aria-label="Close phone panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <SimulatedPhone
              compact
              selectedBeneficiaryId={selectedBeneficiaryId}
              onSelectBeneficiaryId={setSelectedBeneficiaryId}
              refreshSignal={refreshSignal}
              onActivityChange={bumpRefresh}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RootRouter() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F4EE] text-sm text-[#556363]">
        Loading DignityLink...
      </div>
    );
  }

  return user ? <AuthenticatedWorkspace /> : <ProgramOverviewPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <RootRouter />
    </AuthProvider>
  );
}
