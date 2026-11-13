import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { NavSection, VaultCategory, VaultRecord } from '../types/vault';
import {
  CATEGORY_META,
  computeRecordStatus,
  formatCurrency,
  formatExpirationPhrase,
  getDaysUntilExpiration,
} from '../utils/vaultHelpers';
import { CategoryBadgeIcon, StatusChip } from './StatusChip';

interface OverviewViewProps {
  records: VaultRecord[];
  onNavigate: (section: NavSection) => void;
  onSelectRecord: (record: VaultRecord) => void;
  onRenewOneYear: (record: VaultRecord) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  records,
  onNavigate,
  onSelectRecord,
  onRenewOneYear,
}) => {
  const totalProtectedValue = records.reduce(
    (sum, r) => sum + (r.valueAmount && r.valueAmount > 0 ? r.valueAmount : 0),
    0
  );

  const activeCount = records.filter((r) => computeRecordStatus(r) === 'active').length;
  const expiringList = records.filter((r) => computeRecordStatus(r) === 'expiring');
  const lapsedList = records.filter((r) => computeRecordStatus(r) === 'lapsed');

  const attentionQueue = [...lapsedList, ...expiringList].sort((a, b) => {
    const dA = getDaysUntilExpiration(a.expirationDate) ?? 9999;
    const dB = getDaysUntilExpiration(b.expirationDate) ?? 9999;
    return dA - dB;
  });

  const categories: VaultCategory[] = [
    'policy_warranty',
    'legal_identity',
    'digital_credential',
    'beneficiary_contact',
  ];

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-[#0F172A]">
          Household Vault Overview
        </h1>
        <p className="mt-1 text-[14px] text-[#475569]">
          Consolidated registry of active coverage, legal instruments, digital keys, and emergency delegates.
        </p>
      </div>

      {/* 4-Column KPI Strip */}
      <section aria-label="Vault key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
            Total Protected Value
          </span>
          <p className="mt-2 text-[28px] font-bold tracking-tight text-[#0F172A] tabular-nums">
            {formatCurrency(totalProtectedValue)}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Across insured policies & recorded deeds
          </p>
        </div>

        <div className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
            Verified & Active
          </span>
          <p className="mt-2 text-[28px] font-bold tracking-tight text-[#0F172A] tabular-nums">
            {activeCount}
            <span className="ml-1.5 text-[14px] font-medium text-[#94A3B8]">
              / {records.length}
            </span>
          </p>
          <p className="mt-1 text-[12px] font-medium text-[#047857]">
            Current & in good standing
          </p>
        </div>

        <div className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
            Expiring Within 30 Days
          </span>
          <p className="mt-2 text-[28px] font-bold tracking-tight text-[#B45309] tabular-nums">
            {expiringList.length}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Upcoming renewals & scheduled reviews
          </p>
        </div>

        <div className="vault-card-shadow rounded-2xl border border-[#E2E8F0] bg-white p-5">
          <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-[#64748B]">
            Action Required (Lapsed)
          </span>
          <p className="mt-2 text-[28px] font-bold tracking-tight text-[#B91C1C] tabular-nums">
            {lapsedList.length}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Past due coverage or overdue key rotation
          </p>
        </div>
      </section>

      {/* Attention & Renewal Queue */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-[#0F172A]">
              Attention & Renewal Queue
            </h2>
            <p className="text-[13px] text-[#64748B]">
              Records requiring immediate renewal, verification, or rotation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('renewals')}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
          >
            View full queue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="vault-card-shadow overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
          {attentionQueue.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[15px] font-semibold text-[#0F172A]">
                All vault records are current
              </p>
              <p className="mt-1 text-[13px] text-[#64748B]">
                No policies, warranties, or credentials are due within the next 30 days.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {attentionQueue.map((record) => {
                const status = computeRecordStatus(record);
                return (
                  <div
                    key={record.id}
                    onClick={() => onSelectRecord(record)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectRecord(record);
                      }
                    }}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <CategoryBadgeIcon category={record.category} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-[#0F172A]">
                          {record.title}
                        </p>
                        <p className="truncate text-[12px] text-[#64748B]">
                          {record.subType} · {record.providerOrIssuer}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end shrink-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[13px] font-semibold tabular-nums ${
                            status === 'lapsed' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                          }`}
                        >
                          {formatExpirationPhrase(record.expirationDate)}
                        </span>
                        <StatusChip status={status} />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenewOneYear(record);
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9]"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-[#2563EB]" />
                        Renew +1y
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Vault Category Directories */}
      <section className="space-y-3">
        <h2 className="text-[18px] font-semibold text-[#0F172A]">Vault Directories</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const catRecords = records.filter((r) => r.category === cat);
            const catValue = catRecords.reduce(
              (sum, r) => sum + (r.valueAmount && r.valueAmount > 0 ? r.valueAmount : 0),
              0
            );
            const catAttention = catRecords.filter(
              (r) => computeRecordStatus(r) !== 'active'
            ).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onNavigate(cat)}
                className="vault-card-interactive flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-6 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <CategoryBadgeIcon category={cat} />
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#0F172A]">
                        {meta.label}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#64748B]">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#F1F5F9] pt-3.5 text-[13px]">
                  <span className="font-semibold text-[#0F172A] tabular-nums">
                    {catRecords.length} {catRecords.length === 1 ? 'record' : 'records'}
                    {catAttention > 0 && (
                      <span className="ml-2 text-[#B45309]">
                        · {catAttention} needing attention
                      </span>
                    )}
                  </span>
                  {catValue > 0 && (
                    <span className="font-bold text-[#0F172A] tabular-nums">
                      {formatCurrency(catValue)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
