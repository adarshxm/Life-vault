import React from 'react';
import { FileText, KeyRound, ShieldCheck, Users } from 'lucide-react';
import { RecordStatus, VaultCategory } from '../types/vault';

interface StatusChipProps {
  status: RecordStatus;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  if (status === 'lapsed') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#FEF2F2] px-2.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#B91C1C] whitespace-nowrap shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" aria-hidden="true" />
        Lapsed
      </span>
    );
  }
  if (status === 'expiring') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#FFFBEB] px-2.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#B45309] whitespace-nowrap shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" aria-hidden="true" />
        Expiring Soon
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#047857] whitespace-nowrap shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
      Active
    </span>
  );
};

interface CategoryBadgeIconProps {
  category: VaultCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadgeIcon: React.FC<CategoryBadgeIconProps> = ({
  category,
  size = 'md',
}) => {
  const boxClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (category === 'policy_warranty') {
    return (
      <div
        className={`${boxClass} flex shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]`}
      >
        <ShieldCheck className={iconClass} />
      </div>
    );
  }
  if (category === 'legal_identity') {
    return (
      <div
        className={`${boxClass} flex shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#0F172A]`}
      >
        <FileText className={iconClass} />
      </div>
    );
  }
  if (category === 'digital_credential') {
    return (
      <div
        className={`${boxClass} flex shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]`}
      >
        <KeyRound className={iconClass} />
      </div>
    );
  }
  return (
    <div
      className={`${boxClass} flex shrink-0 items-center justify-center rounded-full bg-[#FFFBEB] text-[#B45309]`}
    >
      <Users className={iconClass} />
    </div>
  );
};
