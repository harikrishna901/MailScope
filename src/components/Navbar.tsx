import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Menu, X, BookOpen, Layers, BarChart3, Clock, Sparkles } from 'lucide-react';
import { AppConfig } from '../types.ts';
import { Theme } from '../hooks/useTheme.ts';
import { LogoMark } from './LogoMark.tsx';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.ts';

interface NavbarProps {
  config?: AppConfig | null;
  theme: Theme;
  toggleTheme: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  hasResults: boolean;
  historyCount: number;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  toggleTheme,
  mobileMenuOpen,
  setMobileMenuOpen,
  hasResults,
  historyCount,
  onOpenHistory,
}) => {
  const prefersReduced = usePrefersReducedMotion();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
      isActive
        ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg p-1 group"
          >
            <LogoMark size={34} />
            <div>
              <span className="text-base font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-1">
                Mailscope
              </span>
              <span className="block text-[10px] text-[var(--text-faint)] font-mono">
                Deliverability Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[var(--border-subtle)]">
            <NavLink to="/" end className={navLinkClass}>
              Overview
            </NavLink>
            <NavLink to="/app" end className={navLinkClass}>
              <Layers className="w-3.5 h-3.5" />
              Workspace
            </NavLink>
            <NavLink to="/app/analytics" className={navLinkClass}>
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
              {hasResults && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />}
            </NavLink>
            <NavLink to="/docs" className={navLinkClass}>
              <BookOpen className="w-3.5 h-3.5" />
              Documentation
            </NavLink>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* History Drawer Trigger */}
          {historyCount > 0 && (
            <button
              onClick={onOpenHistory}
              type="button"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
              title="Recent batch history"
            >
              <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>History ({historyCount})</span>
            </button>
          )}

          {/* Direct CTA */}
          <Link
            to="/app"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] text-slate-950 hover:opacity-90 shadow-sm transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Launch App
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] border border-[var(--border-subtle)]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-raised)] px-4 py-3 space-y-1 overflow-hidden"
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
            >
              Overview
            </Link>
            <Link
              to="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
            >
              <Layers className="w-4 h-4 text-[var(--accent)]" />
              Workspace
            </Link>
            <Link
              to="/app/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                Analytics
              </span>
              {hasResults && (
                <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-mono">
                  Active
                </span>
              )}
            </Link>
            <Link
              to="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
            >
              <BookOpen className="w-4 h-4 text-[var(--accent)]" />
              Documentation
            </Link>

            {historyCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenHistory();
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
              >
                <Clock className="w-4 h-4 text-[var(--accent)]" />
                History ({historyCount})
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
