import React from 'react';
import { Check, Copy, Eye, EyeOff, MapPin } from 'lucide-react';
import { VaultRecord } from '../types/vault';
import {
  CATEGORY_META,
  computeRecordStatus,
  formatCurrency,
  formatExpirationPhrase,
  maskSensitiveValue,
} from '../utils/vaultHelpers';
import { CategoryBadgeIcon, StatusChip } from './StatusChip';

interface RecordCardProps {
  record: VaultRecord;
  isRevealed: boolean;
  isCopied: boolean;
  onToggleReveal: (id: string) => void;
  onCopyIdentifier: (id: string, value: string) => void;
  onSelect: (record: VaultRecord) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  isRevealed,
  isCopied,
  onToggleReveal,
  onCopyIdentifier,
  onSelect,
}) => {
  const status = computeRecordStatus(record);
  const categoryMeta = CATEGORY_META[record.category];
  const formattedValue = formatCurrency(record.valueAmount);

  return (
    <article
      onClick={() => onSelect(record)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(record);
        }
      }}
      className="vault-card-interactive flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
    >
      <div>
        {/* Top Row: Category icon + clean unboxed metadata */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CategoryBadgeIcon category={record.category} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#475569] truncate">
                <span className="truncate">{record.subType}</span>
                <span aria-hidden="true" className="text-[#94A3B8]">
                  ·
                </span>
                <span className="truncate text-[#64748B]">{categoryMeta.shortLabel}</span>
              </div>
              <p className="truncate text-[13px] font-medium text-[#94A3B8]">
                {record.providerOrIssuer}
              </p>
            </div>
          </div>
          <StatusChip status={status} />
        </div>

        {/* Middle Section: Title + Value */}
        <div className="mt-4">
          <h3 className="text-[17px] font-semibold leading-snug text-[#0F172A] line-clamp-2">
            {record.title}
          </h3>
          {formattedValue !== '—' && (
            <p className="mt-1.5 text-[20px] font-bold tracking-tight text-[#0F172A] tabular-nums">
              {formattedValue}
              <span className="ml-1.5 text-[12px] font-medium text-[#94A3B8]">
                coverage / value
              </span>
            </p>
          )}
        </div>

        {/* Sensitive ID Inlay (#F1F5F9) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-[#F1F5F9] px-3 py-2"
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
              {categoryMeta.identifierLabel}
            </span>
            <span className="block truncate font-mono text-[13px] font-medium text-[#0F172A] tabular-nums">
              {maskSensitiveValue(record.sensitiveIdentifier, !isRevealed)}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleReveal(record.id)}
              aria-label={isRevealed ? 'Hide sensitive identifier' : 'Reveal sensitive identifier'}
              title={isRevealed ? 'Hide identifier' : 'Reveal identifier'}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
            >
              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => onCopyIdentifier(record.id, record.sensitiveIdentifier)}
              aria-label="Copy identifier"
              title="Copy identifier"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-[#10B981]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Storage location + Expiration */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F1F5F9] pt-3.5 text-[12px]">
        <span className="flex items-center gap-1.5 text-[#64748B] truncate min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
          <span className="truncate">{record.locationOrStorage || 'Unspecified location'}</span>
        </span>
        <span
          className={`shrink-0 font-semibold tabular-nums whitespace-nowrap ${
            status === 'lapsed'
              ? 'text-[#B91C1C]'
              : status === 'expiring'
                ? 'text-[#B45309]'
                : 'text-[#475569]'
          }`}
        >
          {formatExpirationPhrase(record.expirationDate)}
        </span>
      </div>
    </article>
  );
};
