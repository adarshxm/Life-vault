import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  MapPin,
  RefreshCw,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { VaultRecord } from '../types/vault';
import {
  CATEGORY_META,
  computeRecordStatus,
  formatCurrency,
  formatDisplayDate,
  formatExpirationPhrase,
  maskSensitiveValue,
} from '../utils/vaultHelpers';
import { CategoryBadgeIcon, StatusChip } from './StatusChip';

interface RecordDetailDrawerProps {
  record: VaultRecord | null;
  allRecords: VaultRecord[];
  isRevealed: boolean;
  onToggleReveal: (id: string) => void;
  onClose: () => void;
  onEdit: (record: VaultRecord) => void;
  onDelete: (id: string) => void;
  onRenewOneYear: (record: VaultRecord) => void;
  onSelectLinkedRecord: (record: VaultRecord) => void;
  onNotify: (message: string) => void;
}

export const RecordDetailDrawer: React.FC<RecordDetailDrawerProps> = ({
  record,
  allRecords,
  isRevealed,
  onToggleReveal,
  onClose,
  onEdit,
  onDelete,
  onRenewOneYear,
  onSelectLinkedRecord,
  onNotify,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedField, setCopiedField] = useState<'primary' | 'secondary' | null>(null);
  const [revealSecondary, setRevealSecondary] = useState(false);

  if (!record) return null;

  const status = computeRecordStatus(record);
  const meta = CATEGORY_META[record.category];
  const linkedContact = record.linkedContactId
    ? allRecords.find((r) => r.id === record.linkedContactId)
    : undefined;

  const copyValue = async (text: string, field: 'primary' | 'secondary') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      onNotify('Copied sensitive value to clipboard.');
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      onNotify('Clipboard access unavailable in this browser context.');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="fixed inset-0 bg-[#0F172A]/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="Record details"
        className="vault-modal-shadow relative z-10 flex h-full w-full max-w-[520px] flex-col border-l border-[#E2E8F0] bg-white"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div className="flex items-start gap-3 min-w-0">
            <CategoryBadgeIcon category={record.category} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748B]">
                <span>{meta.label}</span>
                <span aria-hidden="true">·</span>
                <span>{record.subType}</span>
              </div>
              <h2 className="mt-0.5 text-[20px] font-bold leading-snug text-[#0F172A]">
                {record.title}
              </h2>
              <p className="mt-0.5 text-[14px] text-[#475569]">{record.providerOrIssuer}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail drawer"
            className="rounded-lg p-2 text-[#475569] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Status + Value Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div>
              <span className="block text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
                Current Status
              </span>
              <div className="mt-1.5 flex items-center gap-2.5">
                <StatusChip status={status} />
                <span className="text-[13px] font-semibold text-[#0F172A] tabular-nums">
                  {formatExpirationPhrase(record.expirationDate)}
                </span>
              </div>
            </div>
            {record.valueAmount !== undefined && record.valueAmount > 0 && (
              <div className="text-right">
                <span className="block text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
                  Protected Value
                </span>
                <span className="mt-1 block text-[22px] font-bold text-[#0F172A] tabular-nums">
                  {formatCurrency(record.valueAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Sensitive Identifiers */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
              Protected Identifiers
            </h3>

            <div className="rounded-xl bg-[#F1F5F9] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-[#475569]">
                    {meta.identifierLabel}
                  </span>
                  <span className="mt-1 block break-all font-mono text-[15px] font-semibold text-[#0F172A] tabular-nums">
                    {maskSensitiveValue(record.sensitiveIdentifier, !isRevealed)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleReveal(record.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Reveal
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyValue(record.sensitiveIdentifier, 'primary')}
                    aria-label="Copy primary identifier"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    {copiedField === 'primary' ? (
                      <Check className="h-4 w-4 text-[#10B981]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {record.secondarySecret && (
                <div className="mt-3.5 border-t border-[#E2E8F0] pt-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold text-[#475569]">
                      {meta.secondaryLabel}
                    </span>
                    <span className="mt-1 block break-all font-mono text-[14px] font-medium text-[#0F172A] tabular-nums">
                      {maskSensitiveValue(record.secondarySecret, !revealSecondary)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRevealSecondary((prev) => !prev)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-[12px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                    >
                      {revealSecondary ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyValue(record.secondarySecret || '', 'secondary')}
                      aria-label="Copy secondary detail"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                    >
                      {copiedField === 'secondary' ? (
                        <Check className="h-3.5 w-3.5 text-[#10B981]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates & Physical Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E2E8F0] p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
                <Calendar className="h-3.5 w-3.5" />
                Effective / Issued
              </span>
              <span className="mt-1 block text-[14px] font-semibold text-[#0F172A] tabular-nums">
                {record.issueDate ? formatDisplayDate(record.issueDate) : 'Not specified'}
              </span>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] p-3.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
                <Calendar className="h-3.5 w-3.5" />
                Expiration / Review
              </span>
              <span className="mt-1 block text-[14px] font-semibold text-[#0F172A] tabular-nums">
                {formatDisplayDate(record.expirationDate)}
              </span>
              <span className="mt-0.5 block text-[12px] text-[#64748B]">
                {record.autoRenew ? 'Auto-renewal active' : 'Manual renewal required'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
              <MapPin className="h-3.5 w-3.5" />
              Storage & Custody
            </span>
            <p className="mt-1 text-[14px] font-medium text-[#0F172A]">
              {record.locationOrStorage || 'No physical or digital custody path specified'}
            </p>
          </div>

          {/* Linked Emergency Contact / Beneficiary */}
          {linkedContact && (
            <div className="rounded-xl border border-[#E2E8F0] p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
                <UserCheck className="h-3.5 w-3.5" />
                Linked Beneficiary / Delegate
              </span>
              <button
                type="button"
                onClick={() => onSelectLinkedRecord(linkedContact)}
                className="mt-2 flex w-full items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2.5 text-left transition-colors hover:bg-[#F1F5F9]"
              >
                <div>
                  <span className="block text-[14px] font-semibold text-[#0F172A]">
                    {linkedContact.title}
                  </span>
                  <span className="block text-[12px] text-[#64748B]">
                    {linkedContact.subType} · {linkedContact.providerOrIssuer}
                  </span>
                </div>
                <span className="text-[12px] font-semibold text-[#2563EB]">Inspect</span>
              </button>
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
              Record Notes
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#475569]">
              {record.notes || 'No supplemental notes added.'}
            </p>
            <p className="mt-3 text-[12px] text-[#94A3B8] tabular-nums">
              Last updated {formatDisplayDate(record.updatedAt)}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
          {!confirmDelete ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(record)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] active:scale-[0.98]"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#FEF2F2] px-3.5 text-[13px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>

              {(status === 'expiring' || status === 'lapsed' || record.expirationDate) && (
                <button
                  type="button"
                  onClick={() => onRenewOneYear(record)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-[13px] font-semibold text-white hover:bg-[#1D4ED8] active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Renew +1 Year
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-[#FEF2F2] px-3.5 py-2.5">
              <span className="text-[13px] font-semibold text-[#B91C1C]">
                Remove this record permanently?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] border border-[#E2E8F0]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(record.id);
                    setConfirmDelete(false);
                  }}
                  className="rounded-md bg-[#DC2626] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#B91C1C]"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
