import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { EmailResult, AppConfig } from '../types.ts';
import { verifyEmailsApi, ApiError } from '../services/api.ts';
import { generateCsv, extractEmailsFromText } from '../lib/csv.ts';
import { validateEmailSyntax } from '../../server/src/verification/syntax.ts';
import { detectMailProvider, isDisposableDomain } from '../lib/intelligence.ts';
import { QuickCheckBar } from '../components/QuickCheckBar.tsx';
import { HealthAuditCard } from '../components/HealthAuditCard.tsx';
import { InputPanel } from '../components/workspace/InputPanel.tsx';
import { ProgressTracker } from '../components/workspace/ProgressTracker.tsx';
import { SummaryCards } from '../components/workspace/SummaryCards.tsx';
import { SessionSummaryCard } from '../components/workspace/SessionSummaryCard.tsx';
import {
  SessionStats,
  loadSessionStats,
  recordBatchVerification,
  recordSingleVerification,
  resetSessionStats,
} from '../lib/sessionStats.ts';
import { ResultsToolbar, FlagFilterValue } from '../components/workspace/ResultsToolbar.tsx';
import { ResultsTable } from '../components/workspace/ResultsTable.tsx';
import { DetailPanel } from '../components/workspace/DetailPanel.tsx';
import { PrintModal } from '../components/workspace/PrintModal.tsx';
import { PrintableReport } from '../components/workspace/PrintableReport.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { fadeUp, staggerContainer } from '../lib/motion.ts';
import { calculateStatusCounts } from '../lib/statusFilter.ts';

interface WorkspacePageProps {
  results: EmailResult[];
  setResults: React.Dispatch<React.SetStateAction<EmailResult[]>>;
  config: AppConfig | null;
  onAnalysisCompleted?: (newResults: EmailResult[], duplicatesRemoved: number) => void;
}

const DEMO_EMAILS = [
  'alex.martinez@stripe.com',
  'sarah.jenkins@github.com',
  'alex.typo@gmial.com',
  'invalid..syntax@broken..domain',
  'missing-at-symbol-address.org',
  'billing@nullmx-blackhole.invalid',
  'contact@nonexistent-domain-xyz9871.net',
  'developer.team@cloudflare.com',
  'support@example.com',
  'disposable.test@mailinator.com',
  'duplicated.lead@domain.com',
  'DUPLICATED.LEAD@DOMAIN.COM',
].join('\n');

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  results,
  setResults,
  config,
  onAnalysisCompleted,
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<EmailResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [flagFilter, setFlagFilter] = useState<FlagFilterValue>('all');
  const [sortField, setSortField] = useState<'email' | 'classification' | 'domain'>('email');
  const [sortAsc, setSortAsc] = useState(true);

  // Opt-in SPF/DMARC lookup (Part B4)
  const [includeDomainAuth, setIncludeDomainAuth] = useState(false);

  // Retry Unknown State (Part B3)
  const [isRetryingUnknown, setIsRetryingUnknown] = useState(false);
  const [retryRoundsLeft, setRetryRoundsLeft] = useState(3);
  const [lastRetryResolutionMsg, setLastRetryResolutionMsg] = useState<string | null>(null);

  // Printable Report State (Part B5)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [includeFullListInPrint, setIncludeFullListInPrint] = useState(true);

  const [sessionStats, setSessionStats] = useState<SessionStats>(() => loadSessionStats(results));

  const handleResetSession = () => {
    const clean = resetSessionStats();
    setSessionStats(clean);
    toast.show({
      type: 'info',
      message: 'Current session verification metrics have been reset to 0.',
    });
  };

  const toast = useToast();
  const maxBatch = config?.maxBatch || 100;

  // Pre-flight calculation from input text
  const preflight = useMemo(() => {
    if (!inputText.trim()) {
      return { totalLines: 0, uniqueCount: 0, duplicateCount: 0, invalidCount: 0, uniqueList: [] };
    }

    const rawList = extractEmailsFromText(inputText);
    const seen = new Set<string>();
    const uniqueList: string[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    for (const em of rawList) {
      const lower = em.toLowerCase();
      if (seen.has(lower)) {
        duplicateCount++;
      } else {
        seen.add(lower);
      }
      uniqueList.push(em);
      const syntax = validateEmailSyntax(em);
      if (!syntax.valid) {
        invalidCount++;
      }
    }

    return {
      totalLines: rawList.length,
      uniqueCount: Array.from(seen).length,
      duplicateCount,
      invalidCount,
      uniqueList: Array.from(seen),
    };
  }, [inputText]);

  const handleLoadDemo = () => {
    setInputText(DEMO_EMAILS);
    setErrorMessage(null);
    toast.show({
      type: 'info',
      message: 'Demo dataset loaded (12 sample emails with mixed deliverability and typo flags)',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setErrorMessage('File size exceeds 1 MB limit. Please select a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setInputText(content);
        setErrorMessage(null);
        toast.show({
          type: 'ok',
          message: `Imported ${file.name} successfully`,
        });
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file content.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    setInputText('');
    setErrorMessage(null);
  };

  const handleVerify = async () => {
    setErrorMessage(null);
    if (preflight.uniqueList.length === 0) {
      setErrorMessage('Please enter or upload at least one email address to verify.');
      return;
    }

    if (preflight.uniqueList.length > maxBatch) {
      setErrorMessage(
        `Batch size (${preflight.uniqueList.length}) exceeds the maximum limit of ${maxBatch}. Please trim the list.`
      );
      return;
    }

    setLoading(true);

    try {
      const response = await verifyEmailsApi(preflight.uniqueList, {
        domainAuth: includeDomainAuth,
      });
      setResults(response.results);
      setSessionStats((prev) => recordBatchVerification(prev, response.results));
      if (onAnalysisCompleted) {
        onAnalysisCompleted(response.results, response.duplicatesRemoved);
      }
      toast.show({
        type: 'ok',
        message: `Verified ${response.results.length} addresses successfully`,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(`Server error [${err.code}]: ${err.message}`);
      } else {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred during verification.';
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-check Unknown feature (Part B3)
  const handleRetryUnknown = async () => {
    const unknowns = results.filter((r) => r.classification === 'unknown');
    if (unknowns.length === 0 || isRetryingUnknown || retryRoundsLeft <= 0) return;

    setIsRetryingUnknown(true);
    setLastRetryResolutionMsg(null);

    try {
      const unknownEmails = unknowns.map((r) => r.email);
      const res = await verifyEmailsApi(unknownEmails, { domainAuth: includeDomainAuth });

      // Merge returned rows back into the main results array by email address
      const newMap = new Map(res.results.map((r) => [r.email.toLowerCase(), r]));
      let resolvedCount = 0;

      const merged = results.map((original) => {
        const lower = original.email.toLowerCase();
        if (newMap.has(lower)) {
          const updated = newMap.get(lower)!;
          if (original.classification === 'unknown' && updated.classification !== 'unknown') {
            resolvedCount++;
          }
          return updated;
        }
        return original;
      });

      setResults(merged);
      const remainingRounds = retryRoundsLeft - 1;
      setRetryRoundsLeft(remainingRounds);

      const msg = `Re-check completed. ${resolvedCount} of ${unknownEmails.length} unknown addresses resolved.`;
      setLastRetryResolutionMsg(msg);

      if (remainingRounds === 0) {
        toast.show({
          type: 'info',
          message: `${msg} Re-check limit reached (3/3). Persistent unknowns usually indicate greylisting or unresponsive servers.`,
        });
      } else {
        toast.show({
          type: resolvedCount > 0 ? 'ok' : 'info',
          message: `${msg} (${remainingRounds} rounds left)`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.show({
        type: 'bad',
        message: `Re-check failed: ${msg}`,
      });
    } finally {
      setIsRetryingUnknown(false);
    }
  };

  // Typo Quick Correction (Part B1)
  const handleApplyTypoFix = (oldEmail: string, correctedEmail: string) => {
    // Replace misspelled email in the input text area
    setInputText((prev) => {
      const regex = new RegExp(`(^|\\s|,|;)${escapeRegExp(oldEmail)}($|\\s|,|;)`, 'gi');
      return prev.replace(regex, `$1${correctedEmail}$2`);
    });

    toast.show({
      type: 'ok',
      message: `Replaced "${oldEmail}" with "${correctedEmail}" in your input list. Click Analyze to re-verify.`,
    });
  };

  const handleAddSingleResult = (newRes: EmailResult) => {
    setSessionStats((prev) => recordSingleVerification(prev, newRes));
    setResults((prev) => {
      const exists = prev.some((r) => r.email.toLowerCase() === newRes.email.toLowerCase());
      if (exists) {
        return prev.map((r) => (r.email.toLowerCase() === newRes.email.toLowerCase() ? newRes : r));
      }
      return [newRes, ...prev];
    });
  };

  // Filter and Sort results
  const filteredResults = useMemo(() => {
    let list = [...results];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) => r.email.toLowerCase().includes(q) || (r.domain && r.domain.toLowerCase().includes(q))
      );
    }

    // Classification filter
    if (filterClassification !== 'all') {
      list = list.filter((r) => r.classification === filterClassification);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      list = list.filter((r) => {
        const p = detectMailProvider(r.reason, r.domain);
        return p.type === providerFilter;
      });
    }

    // Informational Flag filter (Part B1/B2)
    if (flagFilter === 'typo') {
      list = list.filter((r) => Boolean(r.suggestion));
    } else if (flagFilter === 'role') {
      list = list.filter((r) => Boolean(r.isRoleAddress));
    } else if (flagFilter === 'disposable') {
      list = list.filter((r) => Boolean(r.isDisposableDomain ?? isDisposableDomain(r.domain)));
    } else if (flagFilter === 'free') {
      list = list.filter((r) => Boolean(r.isFreeProvider));
    }

    // Sorting
    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'email') {
        valA = a.email.toLowerCase();
        valB = b.email.toLowerCase();
      } else if (sortField === 'classification') {
        valA = a.classification;
        valB = b.classification;
      } else if (sortField === 'domain') {
        valA = (a.domain || '').toLowerCase();
        valB = (b.domain || '').toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [results, searchQuery, filterClassification, providerFilter, flagFilter, sortField, sortAsc]);

  // Export CSV
  const handleExportCsv = (mode: 'current' | 'all' | 'filtered' | 'deliverable' | 'bounce' | boolean = 'current') => {
    let listToExport = results;
    let label = 'all';

    if (mode === true || mode === 'filtered' || mode === 'current') {
      listToExport = filteredResults;
      label = 'filtered';
    } else if (mode === 'deliverable') {
      listToExport = results.filter((r) => r.classification === 'likely_deliverable');
      label = 'deliverable-only';
    } else if (mode === 'bounce') {
      listToExport = results.filter((r) => r.classification === 'likely_bounce');
      label = 'bounce-only';
    } else {
      listToExport = results;
      label = 'all';
    }

    if (listToExport.length === 0) {
      toast.show({
        type: 'info',
        message: 'No email results available for this export selection.',
      });
      return;
    }

    const csvContent = generateCsv(listToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `mailscope-${label}-${dateStr}-${Date.now().toString().slice(-4)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.show({
      type: 'ok',
      message: `Exported ${listToExport.length} verified email rows to CSV (${label})`,
    });
  };

  // Export JSON Report
  const handleExportJson = (filteredOnly: boolean) => {
    const listToExport = filteredOnly ? filteredResults : results;
    if (listToExport.length === 0) return;

    const report = {
      platform: 'Mailscope',
      generatedAt: new Date().toISOString(),
      totalVerified: listToExport.length,
      results: listToExport,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mailscope-report-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.show({
      type: 'ok',
      message: `Exported ${listToExport.length} rows to JSON report`,
    });
  };

  // Summary counts using statusFilter utility
  const counts = useMemo(() => calculateStatusCounts(results), [results]);

  return (
    <>
      {/* On-screen Workspace View */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 no-print"
      >
        {/* Quick Single Address Live Inspector */}
        <motion.div variants={fadeUp}>
          <QuickCheckBar
            onAddResult={handleAddSingleResult}
            onInspectDetails={(res) => setSelectedResult(res)}
          />
        </motion.div>

        {/* Current Session Summary Card */}
        <motion.div variants={fadeUp}>
          <SessionSummaryCard stats={sessionStats} onReset={handleResetSession} />
        </motion.div>

        {/* Deliverability Health Audit (when results exist) */}
        {results.length > 0 && (
          <motion.div variants={fadeUp}>
            <HealthAuditCard results={results} />
          </motion.div>
        )}

        {/* Batch Input Component */}
        <motion.div variants={fadeUp}>
          <InputPanel
            inputText={inputText}
            setInputText={setInputText}
            loading={loading}
            maxBatch={maxBatch}
            preflight={preflight}
            errorMessage={errorMessage}
            includeDomainAuth={includeDomainAuth}
            setIncludeDomainAuth={setIncludeDomainAuth}
            domainAuthSupported={config?.domainAuthEnabled ?? true}
            onLoadDemo={handleLoadDemo}
            onFileUpload={handleFileUpload}
            onClear={handleClear}
            onVerify={handleVerify}
          />
        </motion.div>

        {/* Active Pipeline Progress Tracker */}
        <ProgressTracker isRunning={loading} totalCount={preflight.uniqueCount} />

        {/* Summary Stat Cards with Click-to-Filter Toggles */}
        {results.length > 0 && (
          <motion.div variants={fadeUp}>
            <SummaryCards
              counts={counts}
              activeFilter={filterClassification}
              onFilterChange={setFilterClassification}
            />
          </motion.div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-4">
            <ResultsToolbar
              counts={counts}
              filterClassification={filterClassification}
              setFilterClassification={setFilterClassification}
              providerFilter={providerFilter}
              setProviderFilter={setProviderFilter}
              flagFilter={flagFilter}
              setFlagFilter={setFlagFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortAsc={sortAsc}
              setSortAsc={setSortAsc}
              filteredCount={filteredResults.length}
              totalCount={results.length}
              onExportCsv={handleExportCsv}
              onExportJson={handleExportJson}
              onPrintReport={() => setIsPrintModalOpen(true)}
            />

            <ResultsTable
              results={filteredResults}
              onSelectResult={(item) => setSelectedResult(item)}
              sortField={sortField}
              sortAsc={sortAsc}
              onSortChange={(field) => {
                if (sortField === field) {
                  setSortAsc(!sortAsc);
                } else {
                  setSortField(field);
                  setSortAsc(true);
                }
              }}
              onExportCsv={() => handleExportCsv('current')}
              activeFilter={filterClassification}
              onFilterChange={setFilterClassification}
              counts={counts}
              totalCount={results.length}
              onApplyTypoFix={handleApplyTypoFix}
              onRetryUnknown={handleRetryUnknown}
              isRetryingUnknown={isRetryingUnknown}
              retryRoundsLeft={retryRoundsLeft}
              lastRetryResolutionMsg={lastRetryResolutionMsg}
            />
          </motion.div>
        )}

        {/* Technical Diagnostic Modal / Panel */}
        <DetailPanel
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onApplyTypoFix={handleApplyTypoFix}
        />

        {/* Print Configuration Modal */}
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          results={results}
          includeFullList={includeFullListInPrint}
          setIncludeFullList={setIncludeFullListInPrint}
          onPrint={() => window.print()}
        />
      </motion.div>

      {/* Printable Report Component (renders only during window.print()) */}
      <PrintableReport results={results} includeFullList={includeFullListInPrint} />
    </>
  );
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
