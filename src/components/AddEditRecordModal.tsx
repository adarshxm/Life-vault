import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FileUp,
  Loader2,
  ScanText,
  Upload,
  X,
} from 'lucide-react';
import { ScannedDraftResponse, VaultCategory, VaultRecord } from '../types/vault';
import { CATEGORY_META } from '../utils/vaultHelpers';

interface AddEditRecordModalProps {
  isOpen: boolean;
  editingRecord: VaultRecord | null;
  defaultCategory: VaultCategory;
  beneficiaries: VaultRecord[];
  onClose: () => void;
  onSave: (record: Omit<VaultRecord, 'id' | 'updatedAt'>, existingId?: string) => void;
}

const SAMPLE_SCAN_TEXT = `CHUBB PRIVATE RISK SERVICES — POLICY DECLARATIONS
Policy Number: CHB-9104-7728-AU
Insured Vehicle: 2025 Rivian R1S Dual-Motor
Coverage Limit: $125,000 Comprehensive & Collision
Effective Date: 2026-11-01
Expiration Date: 2027-11-01
Auto-Renewal: Enrolled (Annual Autopay)
Roadside Assistance PIN: 8821-RV
Notes: Includes OEM glass replacement waiver and $500 deductible.`;

export const AddEditRecordModal: React.FC<AddEditRecordModalProps> = ({
  isOpen,
  editingRecord,
  defaultCategory,
  beneficiaries,
  onClose,
  onSave,
}) => {
  const [entryMode, setEntryMode] = useState<'scan' | 'manual'>('scan');

  // Form fields
  const [category, setCategory] = useState<VaultCategory>(defaultCategory);
  const [title, setTitle] = useState('');
  const [subType, setSubType] = useState('');
  const [providerOrIssuer, setProviderOrIssuer] = useState('');
  const [sensitiveIdentifier, setSensitiveIdentifier] = useState('');
  const [secondarySecret, setSecondarySecret] = useState('');
  const [valueAmount, setValueAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [locationOrStorage, setLocationOrStorage] = useState('');
  const [linkedContactId, setLinkedContactId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // AI Scan state
  const [scanText, setScanText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    mimeType: string;
    dataUrl: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccessNote, setScanSuccessNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    setScanError('');
    setScanSuccessNote('');
    setScanText('');
    setSelectedFile(null);

    if (editingRecord) {
      setEntryMode('manual');
      setCategory(editingRecord.category);
      setTitle(editingRecord.title);
      setSubType(editingRecord.subType);
      setProviderOrIssuer(editingRecord.providerOrIssuer);
      setSensitiveIdentifier(editingRecord.sensitiveIdentifier);
      setSecondarySecret(editingRecord.secondarySecret || '');
      setValueAmount(
        editingRecord.valueAmount !== undefined && editingRecord.valueAmount > 0
          ? String(editingRecord.valueAmount)
          : ''
      );
      setIssueDate(editingRecord.issueDate || '');
      setExpirationDate(editingRecord.expirationDate || '');
      setAutoRenew(editingRecord.autoRenew);
      setLocationOrStorage(editingRecord.locationOrStorage);
      setLinkedContactId(editingRecord.linkedContactId || '');
      setNotes(editingRecord.notes);
    } else {
      setEntryMode('scan');
      setCategory(defaultCategory);
      setTitle('');
      setSubType(CATEGORY_META[defaultCategory].subTypeOptions[0]);
      setProviderOrIssuer('');
      setSensitiveIdentifier('');
      setSecondarySecret('');
      setValueAmount('');
      setIssueDate('');
      setExpirationDate('');
      setAutoRenew(false);
      setLocationOrStorage('');
      setLinkedContactId('');
      setNotes('');
    }
  }, [isOpen, editingRecord, defaultCategory]);

  if (!isOpen) return null;

  const meta = CATEGORY_META[category];

  const handleCategoryChange = (nextCategory: VaultCategory) => {
    setCategory(nextCategory);
    if (!CATEGORY_META[nextCategory].subTypeOptions.includes(subType)) {
      setSubType(CATEGORY_META[nextCategory].subTypeOptions[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError('');

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type)) {
      setScanError('Upload a PNG, JPG, WebP, PDF, or TXT document.');
      return;
    }

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = () => {
        setScanText(typeof reader.result === 'string' ? reader.result : '');
        setSelectedFile(null);
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedFile({
          name: file.name,
          mimeType: file.type,
          dataUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunScan = async () => {
    if (!scanText.trim() && !selectedFile) {
      setScanError('Paste document text or upload an image/PDF before running extraction.');
      return;
    }
    setScanError('');
    setIsScanning(true);

    try {
      const response = await fetch('/api/vault/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scanText,
          fileData: selectedFile?.dataUrl,
          mimeType: selectedFile?.mimeType,
          fileName: selectedFile?.name,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not extract fields from this document.');
      }

      const draft = payload as ScannedDraftResponse;
      setCategory(draft.category || 'policy_warranty');
      setTitle(draft.title || '');
      setSubType(draft.subType || CATEGORY_META[draft.category || 'policy_warranty'].subTypeOptions[0]);
      setProviderOrIssuer(draft.providerOrIssuer || '');
      setSensitiveIdentifier(draft.sensitiveIdentifier || '');
      setSecondarySecret(draft.secondarySecret || '');
      setValueAmount(draft.valueAmount > 0 ? String(draft.valueAmount) : '');
      setIssueDate(draft.issueDate || '');
      setExpirationDate(draft.expirationDate || '');
      setAutoRenew(Boolean(draft.autoRenew));
      setLocationOrStorage(draft.locationOrStorage || '');
      setNotes(draft.notes || '');
      setScanSuccessNote(
        draft.confidenceNote || 'Fields extracted. Review values below before saving to your vault.'
      );
      setEntryMode('manual');
    } catch (err: unknown) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'Document scan failed. You can retry or switch to Manual Entry.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Enter a clear title for this vault record.');
      return;
    }
    if (!providerOrIssuer.trim()) {
      setFormError('Specify the provider, issuer, or relationship.');
      return;
    }
    if (!sensitiveIdentifier.trim()) {
      setFormError(`Enter the ${meta.identifierLabel.toLowerCase()}.`);
      return;
    }

    const numericValue = valueAmount.trim() ? Number(valueAmount) : undefined;
    if (valueAmount.trim() && (Number.isNaN(numericValue) || (numericValue ?? 0) < 0)) {
      setFormError('Coverage / asset value must be a positive number.');
      return;
    }

    onSave(
      {
        category,
        title: title.trim(),
        subType: subType.trim() || meta.subTypeOptions[0],
        providerOrIssuer: providerOrIssuer.trim(),
        sensitiveIdentifier: sensitiveIdentifier.trim(),
        secondarySecret: secondarySecret.trim() || undefined,
        valueAmount: numericValue,
        issueDate: issueDate.trim() || undefined,
        expirationDate: expirationDate.trim() || undefined,
        autoRenew,
        locationOrStorage: locationOrStorage.trim() || 'Digital Vault',
        linkedContactId: linkedContactId || undefined,
        notes: notes.trim(),
      },
      editingRecord?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#0F172A]/35 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="vault-modal-shadow relative z-10 flex max-h-[92vh] w-full max-w-[660px] flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 id="modal-title" className="text-[20px] font-bold text-[#0F172A]">
              {editingRecord ? 'Edit Vault Record' : 'Add Record to LifeVault'}
            </h2>
            <p className="mt-0.5 text-[13px] text-[#64748B]">
              {editingRecord
                ? 'Update policy details, storage custody, or renewal dates.'
                : 'Scan a document automatically or enter structured metadata directly.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs (only for new records) */}
        {!editingRecord && (
          <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3">
            <div className="inline-flex rounded-lg bg-[#E2E8F0]/70 p-1">
              <button
                type="button"
                onClick={() => setEntryMode('scan')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  entryMode === 'scan'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <ScanText className="h-4 w-4 text-[#2563EB]" />
                AI Document Scan
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  entryMode === 'manual'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                Manual Structured Entry
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {entryMode === 'scan' && !editingRecord ? (
            <div className="space-y-4">
              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-7 text-center transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF]/40"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#E2E8F0] text-[#2563EB]">
                  {selectedFile ? <FileUp className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                </div>
                {selectedFile ? (
                  <div className="mt-3">
                    <p className="text-[14px] font-semibold text-[#0F172A]">
                      {selectedFile.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#64748B]">
                      Ready for extraction · Click to replace file
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-[14px] font-semibold text-[#0F172A]">
                      Upload policy scan, receipt photo, or PDF
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#64748B]">
                      Supports PNG, JPG, WebP, PDF, or TXT documents
                    </p>
                  </div>
                )}
              </div>

              {/* Paste Text Alternative */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="scan-text-input"
                    className="text-[13px] font-semibold text-[#0F172A]"
                  >
                    Or paste policy / warranty / recovery text
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setScanText(SAMPLE_SCAN_TEXT);
                      setScanError('');
                    }}
                    className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                  >
                    Insert sample declaration
                  </button>
                </div>
                <textarea
                  id="scan-text-input"
                  rows={5}
                  value={scanText}
                  onChange={(e) => setScanText(e.target.value)}
                  placeholder="Paste confirmation email, insurance declarations, warranty receipt, or deed details..."
                  className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                />
              </div>

              {isScanning && (
                <div className="space-y-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2563EB]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting structured policy & coverage fields...
                  </div>
                  <div className="h-3 w-3/4 animate-pulse rounded bg-[#E2E8F0]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#E2E8F0]" />
                </div>
              )}

              {scanError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-[13px] text-[#B91C1C]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setEntryMode('manual')}
                  className="text-[13px] font-semibold text-[#475569] hover:text-[#0F172A]"
                >
                  Skip to manual entry
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={handleRunScan}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60 active:scale-[0.98]"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ScanText className="h-4 w-4" />
                      Extract Fields
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form id="vault-record-form" onSubmit={handleSubmit} className="space-y-4">
              {scanSuccessNote && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5 text-[13px] text-[#047857]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{scanSuccessNote}</span>
                </div>
              )}

              {formError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-[13px] text-[#B91C1C]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Vault Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as VaultCategory)}
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  >
                    <option value="policy_warranty">Policies & Warranties</option>
                    <option value="legal_identity">Legal & Identity</option>
                    <option value="digital_credential">Credentials & Keys</option>
                    <option value="beneficiary_contact">Beneficiaries & Contacts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Record Type
                  </label>
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  >
                    {meta.subTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A]">
                  Record Title <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Homeowners Umbrella Coverage or Passport Book"
                  className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Provider / Issuer / Role <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={providerOrIssuer}
                    onChange={(e) => setProviderOrIssuer(e.target.value)}
                    placeholder="e.g., Chubb, U.S. Dept of State"
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Coverage / Asset Value (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={valueAmount}
                    onChange={(e) => setValueAmount(e.target.value)}
                    placeholder="Optional (e.g., 500000)"
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] tabular-nums placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    {meta.identifierLabel} <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={sensitiveIdentifier}
                    onChange={(e) => setSensitiveIdentifier(e.target.value)}
                    placeholder="Masked automatically in vault"
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 font-mono text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    {meta.secondaryLabel}
                  </label>
                  <input
                    type="text"
                    value={secondarySecret}
                    onChange={(e) => setSecondarySecret(e.target.value)}
                    placeholder="Optional PIN, email, or reference"
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 font-mono text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Issue / Effective Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Expiration / Next Review
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] tabular-nums focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A]">
                    Storage / Custody Location
                  </label>
                  <input
                    type="text"
                    value={locationOrStorage}
                    onChange={(e) => setLocationOrStorage(e.target.value)}
                    placeholder="e.g., Safe Deposit Box #408"
                    className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                  />
                </div>

                {category !== 'beneficiary_contact' && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#0F172A]">
                      Linked Beneficiary / Contact
                    </label>
                    <select
                      value={linkedContactId}
                      onChange={(e) => setLinkedContactId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                    >
                      <option value="">None linked</option>
                      {beneficiaries.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="h-[18px] w-[18px] rounded border-[#CBD5E1] accent-[#2563EB]"
                />
                <span className="text-[14px] font-medium text-[#0F172A]">
                  Enrolled in automatic renewal or standing review
                </span>
              </label>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A]">
                  Notes & Terms
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Riders, deductibles, claim instructions, or emergency access notes..."
                  className="mt-1.5 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {(entryMode === 'manual' || editingRecord) && (
          <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[14px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="vault-record-form"
              className="h-10 rounded-lg bg-[#2563EB] px-5 text-[14px] font-semibold text-white hover:bg-[#1D4ED8] active:scale-[0.98]"
            >
              {editingRecord ? 'Save Changes' : 'Save to Vault'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
