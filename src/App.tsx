import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Lock,
  Menu,
  Plus,
  Search,
} from 'lucide-react';
import { AddEditRecordModal } from './components/AddEditRecordModal';
import { BackupSecurityView } from './components/BackupSecurityView';
import { OverviewView } from './components/OverviewView';
import { RecordCard } from './components/RecordCard';
import { RecordDetailDrawer } from './components/RecordDetailDrawer';
import { RecordTable } from './components/RecordTable';
import { Sidebar } from './components/Sidebar';
import { VaultLockOverlay } from './components/VaultLockOverlay';
import { DEFAULT_VAULT_SETTINGS, SEED_VAULT_RECORDS } from './data/seedRecords';
import {
  NavSection,
  RecordStatus,
  VaultCategory,
  VaultRecord,
  VaultSettings,
  ViewMode,
} from './types/vault';
import {
  addOneYearIso,
  CATEGORY_META,
  computeRecordStatus,
  getDaysUntilExpiration,
} from './utils/vaultHelpers';

const STORAGE_RECORDS_KEY = 'lifevault_records_v1';
const STORAGE_SETTINGS_KEY = 'lifevault_settings_v1';

function loadInitialRecords(): VaultRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS_KEY);
    if (!raw) return SEED_VAULT_RECORDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_VAULT_RECORDS;
  } catch {
    return SEED_VAULT_RECORDS;
  }
}

function loadInitialSettings(): VaultSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_VAULT_SETTINGS;
    return { ...DEFAULT_VAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VAULT_SETTINGS;
  }
}

export default function App() {
  const [records, setRecords] = useState<VaultRecord[]>(loadInitialRecords);
  const [settings, setSettings] = useState<VaultSettings>(loadInitialSettings);

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [statusFilter, setStatusFilter] = useState<'all' | RecordStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLocked, setIsLocked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [revealedIds, setRevealedIds] = useState<Set<string>>(() =>
    settings.autoMaskByDefault
      ? new Set()
      : new Set(records.map((r) => r.id))
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VaultRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
    } catch {
      // Ignore storage quota errors
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  const notify = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const counts = useMemo<Record<VaultCategory, number>>(() => {
    return {
      policy_warranty: records.filter((r) => r.category === 'policy_warranty').length,
      legal_identity: records.filter((r) => r.category === 'legal_identity').length,
      digital_credential: records.filter((r) => r.category === 'digital_credential').length,
      beneficiary_contact: records.filter((r) => r.category === 'beneficiary_contact').length,
    };
  }, [records]);

  const attentionCount = useMemo(() => {
    return records.filter((r) => computeRecordStatus(r) !== 'active').length;
  }, [records]);

  const beneficiaries = useMemo(
    () => records.filter((r) => r.category === 'beneficiary_contact'),
    [records]
  );

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId) || null,
    [records, selectedRecordId]
  );

  const filteredRecords = useMemo(() => {
    let base = records;
    if (
      activeSection === 'policy_warranty' ||
      activeSection === 'legal_identity' ||
      activeSection === 'digital_credential' ||
      activeSection === 'beneficiary_contact'
    ) {
      base = base.filter((r) => r.category === activeSection);
    } else if (activeSection === 'renewals') {
      base = base
        .filter((r) => computeRecordStatus(r) !== 'active')
        .sort((a, b) => {
          const dA = getDaysUntilExpiration(a.expirationDate) ?? 9999;
          const dB = getDaysUntilExpiration(b.expirationDate) ?? 9999;
          return dA - dB;
        });
    }

    if (statusFilter !== 'all') {
      base = base.filter((r) => computeRecordStatus(r) === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.providerOrIssuer.toLowerCase().includes(q) ||
          r.subType.toLowerCase().includes(q) ||
          r.locationOrStorage.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q)
      );
    }

    return base;
  }, [records, activeSection, statusFilter, searchQuery]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allVisibleRevealed =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => revealedIds.has(r.id));

  const toggleRevealAllVisible = () => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleRevealed) {
        filteredRecords.forEach((r) => next.delete(r.id));
      } else {
        filteredRecords.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const handleCopyIdentifier = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      notify('Identifier copied to clipboard.');
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1600);
    } catch {
      notify('Clipboard access unavailable.');
    }
  };

  const handleLockVault = () => {
    if (settings.autoMaskByDefault) {
      setRevealedIds(new Set());
    }
    setSelectedRecordId(null);
    setModalOpen(false);
    setIsLocked(true);
  };

  const handleSaveRecord = (
    data: Omit<VaultRecord, 'id' | 'updatedAt'>,
    existingId?: string
  ) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    if (existingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === existingId ? { ...data, id: existingId, updatedAt: todayIso } : r
        )
      );
      notify('Vault record updated.');
    } else {
      const newRecord: VaultRecord = {
        ...data,
        id: `rec-${Date.now().toString(36)}`,
        updatedAt: todayIso,
      };
      setRecords((prev) => [newRecord, ...prev]);
      notify('New record added to vault.');
    }
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedRecordId(null);
    notify('Record removed from vault.');
  };

  const handleRenewOneYear = (record: VaultRecord) => {
    const nextExpiry = addOneYearIso(record.expirationDate);
    const todayIso = new Date().toISOString().slice(0, 10);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id
          ? { ...r, expirationDate: nextExpiry, updatedAt: todayIso }
          : r
      )
    );
    notify(`Renewed "${record.title}" through ${nextExpiry}.`);
  };

  const handleImportRecords = (
    imported: VaultRecord[],
    mode: 'replace' | 'merge'
  ) => {
    if (mode === 'replace') {
      setRecords(imported);
    } else {
      setRecords((prev) => {
        const map = new Map(prev.map((r) => [r.id, r]));
        imported.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });
    }
  };

  const handleResetSampleData = () => {
    setRecords(SEED_VAULT_RECORDS);
    setRevealedIds(new Set());
    notify('Restored curated LifeVault sample records.');
  };

  const handleUpdateSettings = (next: VaultSettings) => {
    setSettings(next);
    if (!next.autoMaskByDefault) {
      setRevealedIds(new Set(records.map((r) => r.id)));
    } else {
      setRevealedIds(new Set());
    }
  };

  const getSectionHeader = () => {
    if (activeSection === 'overview') {
      return {
        breadcrumb: 'Overview',
        title: 'Vault Overview',
        description: '',
      };
    }
    if (activeSection === 'renewals') {
      return {
        breadcrumb: 'Renewal Queue',
        title: 'Renewal & Expiration Queue',
        description:
          'Policies, hardware warranties, IDs, and recovery keys due within 30 days or past due.',
      };
    }
    if (activeSection === 'settings') {
      return {
        breadcrumb: 'Backup & Security',
        title: 'Backup & Security',
        description: '',
      };
    }
    const meta = CATEGORY_META[activeSection];
    return {
      breadcrumb: meta.label,
      title: meta.label,
      description: meta.description,
    };
  };

  const headerInfo = getSectionHeader();
  const defaultModalCategory: VaultCategory =
    activeSection === 'policy_warranty' ||
    activeSection === 'legal_identity' ||
    activeSection === 'digital_credential' ||
    activeSection === 'beneficiary_contact'
      ? activeSection
      : 'policy_warranty';

  const isRegistryView =
    activeSection !== 'overview' && activeSection !== 'settings';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setStatusFilter('all');
          setSearchQuery('');
        }}
        counts={counts}
        attentionCount={attentionCount}
        settings={settings}
        onLockVault={handleLockVault}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract: Breadcrumb on Left, Primary Actions on Right */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur-xs sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-[#475569] hover:bg-[#F1F5F9] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] min-w-0">
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className="font-medium text-[#64748B] hover:text-[#0F172A] whitespace-nowrap"
              >
                LifeVault
              </button>
              <span aria-hidden="true" className="text-[#CBD5E1]">
                /
              </span>
              <span className="truncate font-semibold text-[#0F172A]">
                {headerInfo.breadcrumb}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleLockVault}
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-[13px] font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] whitespace-nowrap shrink-0"
            >
              <Lock className="h-4 w-4 text-[#475569]" />
              Quick Lock
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setModalOpen(true);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Record
            </button>
          </div>
        </header>

        {/* Main Workspace Container */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {activeSection === 'overview' && (
            <OverviewView
              records={records}
              onNavigate={(sec) => setActiveSection(sec)}
              onSelectRecord={(rec) => setSelectedRecordId(rec.id)}
              onRenewOneYear={handleRenewOneYear}
            />
          )}

          {activeSection === 'settings' && (
            <BackupSecurityView
              records={records}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onImportRecords={handleImportRecords}
              onResetSampleData={handleResetSampleData}
              onLockNow={handleLockVault}
              onNotify={notify}
            />
          )}

          {isRegistryView && (
            <div className="space-y-6">
              {/* Section Title & Description */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-[24px] font-bold tracking-tight text-[#0F172A]">
                    {headerInfo.title}
                  </h1>
                  <p className="mt-1 text-[14px] text-[#475569]">
                    {headerInfo.description}
                  </p>
                </div>

                {/* Reveal/Mask All + View Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={toggleRevealAllVisible}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] whitespace-nowrap"
                  >
                    {allVisibleRevealed ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-[#475569]" />
                        Mask All IDs
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 text-[#475569]" />
                        Reveal All IDs
                      </>
                    )}
                  </button>

                  <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      aria-label="Card grid view"
                      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold transition-colors ${
                        viewMode === 'cards'
                          ? 'bg-[#F1F5F9] text-[#0F172A]'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      aria-label="Ledger table view"
                      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold transition-colors ${
                        viewMode === 'table'
                          ? 'bg-[#F1F5F9] text-[#0F172A]'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                      Ledger
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, issuer, or custody location..."
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pl-10 pr-3.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>

                <div className="inline-flex items-center gap-1 overflow-x-auto rounded-lg bg-[#F1F5F9] p-1">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'expiring', label: 'Expiring Soon' },
                      { id: 'lapsed', label: 'Lapsed' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        statusFilter === tab.id
                          ? 'bg-white text-[#0F172A] shadow-xs'
                          : 'text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Empty State vs. Cards / Ledger */}
              {filteredRecords.length === 0 ? (
                <div className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white px-6 py-14 text-center">
                  <p className="text-[16px] font-semibold text-[#0F172A]">
                    No matching records found
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-[14px] text-[#64748B]">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Adjust your search query or status filter to inspect other vault records.'
                      : 'Add your first policy, document, or recovery key via AI scan or manual entry.'}
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    {(searchQuery || statusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(null);
                        setModalOpen(true);
                      }}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-[13px] font-semibold text-white hover:bg-[#1D4ED8]"
                    >
                      <Plus className="h-4 w-4" />
                      Add Record
                    </button>
                  </div>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredRecords.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      isRevealed={revealedIds.has(record.id)}
                      isCopied={copiedId === record.id}
                      onToggleReveal={toggleReveal}
                      onCopyIdentifier={handleCopyIdentifier}
                      onSelect={(rec) => setSelectedRecordId(rec.id)}
                    />
                  ))}
                </div>
              ) : (
                <RecordTable
                  records={filteredRecords}
                  revealedIds={revealedIds}
                  copiedId={copiedId}
                  onToggleReveal={toggleReveal}
                  onCopyIdentifier={handleCopyIdentifier}
                  onSelect={(rec) => setSelectedRecordId(rec.id)}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Slide-Over Detail Drawer */}
      <RecordDetailDrawer
        record={selectedRecord}
        allRecords={records}
        isRevealed={selectedRecord ? revealedIds.has(selectedRecord.id) : false}
        onToggleReveal={toggleReveal}
        onClose={() => setSelectedRecordId(null)}
        onEdit={(rec) => {
          setSelectedRecordId(null);
          setEditingRecord(rec);
          setModalOpen(true);
        }}
        onDelete={handleDeleteRecord}
        onRenewOneYear={handleRenewOneYear}
        onSelectLinkedRecord={(linked) => setSelectedRecordId(linked.id)}
        onNotify={notify}
      />

      {/* Add / Edit / AI Scan Modal */}
      <AddEditRecordModal
        isOpen={modalOpen}
        editingRecord={editingRecord}
        defaultCategory={defaultModalCategory}
        beneficiaries={beneficiaries}
        onClose={() => {
          setModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
      />

      {/* Quick Lock Privacy Overlay */}
      {isLocked && (
        <VaultLockOverlay
          expectedPin={settings.pinCode}
          onUnlock={() => {
            setIsLocked(false);
            notify('LifeVault unlocked.');
          }}
        />
      )}

      {/* Subtle Toast Confirmation */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="vault-modal-shadow fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#0F172A] px-4 py-3 text-[13px] font-medium text-white"
        >
          <Check className="h-4 w-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
