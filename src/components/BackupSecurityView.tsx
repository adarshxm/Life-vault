import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  KeyRound,
  RotateCcw,
  Shield,
  Upload,
} from 'lucide-react';
import { VaultRecord, VaultSettings } from '../types/vault';

interface BackupSecurityViewProps {
  records: VaultRecord[];
  settings: VaultSettings;
  onUpdateSettings: (next: VaultSettings) => void;
  onImportRecords: (imported: VaultRecord[], mode: 'replace' | 'merge') => void;
  onResetSampleData: () => void;
  onLockNow: () => void;
  onNotify: (msg: string) => void;
}

export const BackupSecurityView: React.FC<BackupSecurityViewProps> = ({
  records,
  settings,
  onUpdateSettings,
  onImportRecords,
  onResetSampleData,
  onLockNow,
  onNotify,
}) => {
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [ownerEmail, setOwnerEmail] = useState(settings.ownerEmail);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) return;
    onUpdateSettings({
      ...settings,
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim() || settings.ownerEmail,
    });
    onNotify('Vault owner profile updated.');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 numeric digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PIN confirmation does not match.');
      return;
    }
    onUpdateSettings({
      ...settings,
      pinCode: newPin,
    });
    setNewPin('');
    setConfirmPin('');
    onNotify('Quick Lock PIN updated.');
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      system: 'LifeVault System',
      recordCount: records.length,
      records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `lifevault-backup-${dateStamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported ${records.length} records to JSON backup.`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed.records;
        if (!Array.isArray(list)) {
          throw new Error('Backup file must contain a records array.');
        }
        const valid = list.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            typeof item.category === 'string'
        ) as VaultRecord[];
        if (valid.length === 0) {
          throw new Error('No valid LifeVault records found in file.');
        }
        onImportRecords(valid, importMode);
        onNotify(
          `Imported ${valid.length} records (${importMode === 'replace' ? 'replaced workspace' : 'merged into vault'}).`
        );
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : 'Invalid JSON backup file.');
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#0F172A]">
          Backup & Security Controls
        </h1>
        <p className="mt-1 text-[14px] text-[#475569]">
          Configure your Quick Lock PIN, sensitive-field masking behavior, and portable JSON backups.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Privacy & Quick Lock PIN */}
        <section className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[#0F172A]">
                  Quick Lock & Privacy Masking
                </h2>
                <p className="text-[13px] text-[#64748B]">
                  Protect sensitive policy IDs, deeds, and recovery codes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLockNow}
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Test Lock
            </button>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-[#F8FAFC] p-4 border border-[#E2E8F0]">
            <div>
              <span className="block text-[14px] font-semibold text-[#0F172A]">
                Mask sensitive identifiers by default
              </span>
              <span className="block text-[12px] text-[#64748B]">
                Automatically obscures policy numbers, recovery keys, and contact IDs until revealed.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoMaskByDefault}
              onChange={(e) => {
                onUpdateSettings({
                  ...settings,
                  autoMaskByDefault: e.target.checked,
                });
                onNotify(
                  e.target.checked
                    ? 'Default masking enabled across all records.'
                    : 'Identifiers unmasked by default.'
                );
              }}
              className="h-[18px] w-[18px] shrink-0 accent-[#2563EB]"
            />
          </label>

          <form onSubmit={handleUpdatePin} className="space-y-3 border-t border-[#F1F5F9] pt-4">
            <h3 className="text-[13px] font-semibold text-[#0F172A]">
              Change 4-Digit Quick Lock PIN
            </h3>
            {pinError && (
              <div className="flex items-center gap-2 rounded-lg bg-[#FEF2F2] px-3 py-2 text-[12px] font-medium text-[#B91C1C]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {pinError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="New 4-digit PIN"
                className="rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 font-mono text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm PIN"
                className="rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 font-mono text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-[13px] font-semibold text-white hover:bg-[#1D4ED8] active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              Update Lock PIN
            </button>
          </form>
        </section>

        {/* Owner Profile */}
        <section className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-[#0F172A]">
                Vault Custodian Profile
              </h2>
              <p className="text-[13px] text-[#64748B]">
                Displayed on the sidebar and included in backup metadata.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#0F172A]">
                Custodian Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#0F172A]">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Save Profile
            </button>
          </form>
        </section>

        {/* Export & Import Backup */}
        <section className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[#0F172A]">
                Portable Vault Backups
              </h2>
              <p className="mt-0.5 text-[13px] text-[#64748B]">
                Your records are stored locally in this browser. Export a snapshot regularly or restore from JSON.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-[13px] font-semibold text-white hover:bg-[#1D4ED8] active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Export JSON Backup ({records.length})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-[#F1F5F9] pt-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#0F172A]">
                  Restore from JSON Backup
                </span>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="rounded-md border border-[#CBD5E1] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0F172A]"
                >
                  <option value="merge">Merge with existing</option>
                  <option value="replace">Replace workspace</option>
                </select>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                <Upload className="h-4 w-4" />
                Choose Backup File
              </button>
              {importError && (
                <p className="text-[12px] font-medium text-[#B91C1C]">{importError}</p>
              )}
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col justify-between gap-3">
              <div>
                <span className="block text-[14px] font-semibold text-[#0F172A]">
                  Reset Demo Workspace
                </span>
                <span className="block text-[12px] text-[#64748B]">
                  Restores the initial curated policies, deeds, recovery keys, and beneficiaries.
                </span>
              </div>
              {!confirmReset ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#FEF2F2] px-4 text-[13px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Sample Data
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] font-semibold text-[#0F172A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetSampleData();
                      setConfirmReset(false);
                    }}
                    className="rounded-lg bg-[#DC2626] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#B91C1C]"
                  >
                    Confirm Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
