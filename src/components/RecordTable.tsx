import React, { useState } from 'react';
import { ArrowUpDown, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { VaultRecord } from '../types/vault';
import {
  CATEGORY_META,
  computeRecordStatus,
  formatCurrency,
  formatExpirationPhrase,
  maskSensitiveValue,
} from '../utils/vaultHelpers';
import { CategoryBadgeIcon, StatusChip } from './StatusChip';

type SortField = 'title' | 'valueAmount' | 'expirationDate';

interface RecordTableProps {
  records: VaultRecord[];
  revealedIds: Set<string>;
  copiedId: string | null;
  onToggleReveal: (id: string) => void;
  onCopyIdentifier: (id: string, value: string) => void;
  onSelect: (record: VaultRecord) => void;
}

export const RecordTable: React.FC<RecordTableProps> = ({
  records,
  revealedIds,
  copiedId,
  onToggleReveal,
  onCopyIdentifier,
  onSelect,
}) => {
  const [sortField, setSortField] = useState<SortField>('expirationDate');
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sorted = [...records].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortField === 'title') {
      return a.title.localeCompare(b.title) * dir;
    }
    if (sortField === 'valueAmount') {
      return ((a.valueAmount || 0) - (b.valueAmount || 0)) * dir;
    }
    const dateA = a.expirationDate || '9999-12-31';
    const dateB = b.expirationDate || '9999-12-31';
    return dateA.localeCompare(dateB) * dir;
  });

  return (
    <div className="vault-card-shadow overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-4 py-3 text-[11px] font-bold tracking-[0.04em] uppercase text-[#475569]">
                <button
                  type="button"
                  onClick={() => toggleSort('title')}
                  className="inline-flex items-center gap-1 hover:text-[#0F172A]"
                >
                  Record & Provider
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-[11px] font-bold tracking-[0.04em] uppercase text-[#475569]">
                Identifier
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-[11px] font-bold tracking-[0.04em] uppercase text-[#475569]">
                Storage Location
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold tracking-[0.04em] uppercase text-[#475569]">
                <button
                  type="button"
                  onClick={() => toggleSort('valueAmount')}
                  className="inline-flex items-center justify-end gap-1 hover:text-[#0F172A]"
                >
                  Value
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold tracking-[0.04em] uppercase text-[#475569]">
                <button
                  type="button"
                  onClick={() => toggleSort('expirationDate')}
                  className="inline-flex items-center justify-end gap-1 hover:text-[#0F172A]"
                >
                  Renewal / Expiry
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold tracking-[0.04em] uppercase text-[#475569]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((record) => {
              const status = computeRecordStatus(record);
              const isRevealed = revealedIds.has(record.id);
              const isCopied = copiedId === record.id;
              const categoryMeta = CATEGORY_META[record.category];

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelect(record)}
                  className="cursor-pointer border-b border-[#F1F5F9] last:border-b-0 transition-colors hover:bg-[#F8FAFC]"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <CategoryBadgeIcon category={record.category} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-[14px] text-[#0F172A] truncate max-w-[260px]">
                          {record.title}
                        </div>
                        <div className="text-[12px] text-[#64748B] truncate max-w-[260px]">
                          {record.subType} · {record.providerOrIssuer}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-3.5 whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F1F5F9] px-2.5 py-1">
                      <span
                        title={`${categoryMeta.identifierLabel}`}
                        className="font-mono text-[12px] font-medium text-[#0F172A] tabular-nums"
                      >
                        {maskSensitiveValue(record.sensitiveIdentifier, !isRevealed)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleReveal(record.id)}
                        aria-label={isRevealed ? 'Hide identifier' : 'Reveal identifier'}
                        className="p-0.5 text-[#64748B] hover:text-[#0F172A]"
                      >
                        {isRevealed ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopyIdentifier(record.id, record.sensitiveIdentifier)}
                        aria-label="Copy identifier"
                        className="p-0.5 text-[#64748B] hover:text-[#0F172A]"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-[#10B981]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3.5 text-[13px] text-[#475569] max-w-[220px] truncate">
                    {record.locationOrStorage || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-[13px] text-[#0F172A] tabular-nums whitespace-nowrap">
                    {formatCurrency(record.valueAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] font-medium text-[#475569] tabular-nums whitespace-nowrap">
                    {formatExpirationPhrase(record.expirationDate)}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <StatusChip status={status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
