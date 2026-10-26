import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { WorkspacePage } from './pages/WorkspacePage.tsx';
import { DocumentationPage } from './pages/DocumentationPage.tsx';
import { AnalyticsSkeleton } from './components/AnalyticsSkeleton.tsx';
import { useTheme } from './hooks/useTheme.ts';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion.ts';
import { fetchServerConfig } from './services/api.ts';
import { EmailResult, AppConfig, HistoryRecord } from './types.ts';
import { ToastProvider } from './components/ui/Toast.tsx';
import { Clock, Trash2, X } from 'lucide-react';
import { Button } from './components/ui/Button.tsx';

// Part A3: Lazy loaded AnalyticsPage with Suspense and skeleton fallback
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage.tsx'));

const OLD_RESULTS_KEY = 'mailcheck_active_results';
const RESULTS_KEY = 'mailscope_active_results';

const OLD_HISTORY_KEY = 'mailcheck_history';
const HISTORY_KEY = 'mailscope_history';

function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const prefersReduced = usePrefersReducedMotion();
  const [config, setConfig] = useState<AppConfig | null>(null);

  // Graceful migration of sessionStorage results
  const [results, setResults] = useState<EmailResult[]>(() => {
    try {
      let saved = sessionStorage.getItem(RESULTS_KEY);
      if (!saved) {
        const oldSaved = sessionStorage.getItem(OLD_RESULTS_KEY);
        if (oldSaved) {
          sessionStorage.setItem(RESULTS_KEY, oldSaved);
          sessionStorage.removeItem(OLD_RESULTS_KEY);
          saved = oldSaved;
        }
      }
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (results.length > 0) {
        sessionStorage.setItem(RESULTS_KEY, JSON.stringify(results));
      }
    } catch {
      // ignore
    }
  }, [results]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Graceful migration of localStorage history
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      let saved = localStorage.getItem(HISTORY_KEY);
      if (!saved) {
        const oldSaved = localStorage.getItem(OLD_HISTORY_KEY);
        if (oldSaved) {
          localStorage.setItem(HISTORY_KEY, oldSaved);
          localStorage.removeItem(OLD_HISTORY_KEY);
          saved = oldSaved;
        }
      }
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch server configuration on mount
  useEffect(() => {
    fetchServerConfig().then((cfg) => setConfig(cfg));
  }, []);

  // Save history record upon batch completion
  const handleAnalysisCompleted = (newResults: EmailResult[], duplicatesRemoved: number) => {
    const deliverable = newResults.filter((r) => r.classification === 'likely_deliverable').length;
    const bounce = newResults.filter((r) => r.classification === 'likely_bounce').length;
    const unknown = newResults.filter((r) => r.classification === 'unknown').length;

    const record: HistoryRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      total: newResults.length,
      deliverable,
      bounce,
      unknown,
      duplicatesRemoved,
    };

    const updated = [record, ...history].slice(0, 10);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(OLD_HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--accent)] text-slate-950 font-bold rounded-lg shadow-lg"
      >
        Skip to main content
      </a>

      {/* Main Header */}
      <Navbar
        config={config}
        theme={theme}
        toggleTheme={toggleTheme}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        hasResults={results.length > 0}
        historyCount={history.length}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
      />

      {/* Main Page Content */}
      <main id="main-content" className="flex-1 pt-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/app"
            element={
              <WorkspacePage
                results={results}
                setResults={setResults}
                config={config}
                onAnalysisCompleted={handleAnalysisCompleted}
              />
            }
          />
          <Route
            path="/app/analytics"
            element={
              <Suspense fallback={<AnalyticsSkeleton />}>
                <AnalyticsPage
                  results={results}
                  onGoToWorkspace={() => {}}
                />
              </Suspense>
            }
          />
          <Route path="/docs" element={<DocumentationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Minimal Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-raised)]/60 py-6 px-4 text-center text-xs text-[var(--text-secondary)] font-mono transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">Mailscope</span>
            <span>·</span>
            <span>Evidence-Based Deliverability Intelligence</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
              Overview
            </Link>
            <span>·</span>
            <Link to="/app" className="hover:text-[var(--text-primary)] transition-colors">
              Workspace
            </Link>
            <span>·</span>
            <Link to="/app/analytics" className="hover:text-[var(--text-primary)] transition-colors">
              Analytics
            </Link>
            <span>·</span>
            <Link to="/docs" className="hover:text-[var(--text-primary)] transition-colors">
              Documentation
            </Link>
            {history.length > 0 && (
              <>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setHistoryDrawerOpen(true)}
                  className="hover:text-[var(--accent)] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  History ({history.length})
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* History Slide-over Drawer */}
      <AnimatePresence>
        {historyDrawerOpen && (
          <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-drawer-title"
          >
            <button
              type="button"
              aria-label="Close history drawer"
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-default w-full h-full border-0 p-0"
              onClick={() => setHistoryDrawerOpen(false)}
            />
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { x: '100%' }}
              animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 w-full max-w-md h-full bg-[var(--bg-raised)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-canvas)]/40">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-[var(--accent)]" />
                  <h3 id="history-drawer-title" className="text-base font-bold text-[var(--text-primary)]">
                    Local Batch History
                  </h3>
                </div>
                <button
                  onClick={() => setHistoryDrawerOpen(false)}
                  className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
                  aria-label="Close history drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  Session batch summaries stored locally in your browser. No server storage or tracking.
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[var(--text-faint)] font-mono">
                    No recent verification batches found.
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-xs">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-semibold text-[var(--text-primary)]">{item.total} addresses</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-1 text-[11px]">
                          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <div>Deliverable</div>
                            <div className="font-bold">{item.deliverable}</div>
                          </div>
                          <div className="p-1.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <div>Bounce</div>
                            <div className="font-bold">{item.bounce}</div>
                          </div>
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <div>Unknown</div>
                            <div className="font-bold">{item.unknown}</div>
                          </div>
                        </div>

                        {item.duplicatesRemoved > 0 && (
                          <div className="text-[10px] text-[var(--text-faint)] pt-0.5">
                            {item.duplicatesRemoved} duplicate(s) pruned in pre-flight
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {history.length > 0 && (
                <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/40 flex items-center justify-between">
                  <button
                    onClick={handleClearHistory}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear History
                  </button>
                  <Button variant="secondary" size="sm" onClick={() => setHistoryDrawerOpen(false)}>
                    Close
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </BrowserRouter>
  );
}
