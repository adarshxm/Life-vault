import { RecordStatus, VaultCategory, VaultRecord } from '../types/vault';

export const CATEGORY_META: Record<
  VaultCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    identifierLabel: string;
    secondaryLabel: string;
    subTypeOptions: string[];
  }
> = {
  policy_warranty: {
    label: 'Policies & Warranties',
    shortLabel: 'Policies',
    description: 'Insurance policies, equipment warranties, and active coverage terms.',
    identifierLabel: 'Policy or Serial Number',
    secondaryLabel: 'Claim PIN / Group Code',
    subTypeOptions: [
      'Homeowners Policy',
      'Life Insurance',
      'Auto Insurance',
      'Health Insurance',
      'Hardware Warranty',
      'Appliance Warranty',
    ],
  },
  legal_identity: {
    label: 'Legal & Identity',
    shortLabel: 'Legal & IDs',
    description: 'Property deeds, passports, wills, trusts, and notarized vital records.',
    identifierLabel: 'Document / Filing ID',
    secondaryLabel: 'Parcel / Notary Reference',
    subTypeOptions: [
      'Property Deed',
      'Government ID',
      'Estate Planning',
      'Vehicle Title',
      'Tax / Corporate Filing',
      'Marriage / Birth Certificate',
    ],
  },
  digital_credential: {
    label: 'Credentials & Keys',
    shortLabel: 'Credentials',
    description: 'Emergency recovery kits, 2FA hardware tokens, and registrar access.',
    identifierLabel: 'Recovery Key / Token ID',
    secondaryLabel: 'PIN / Passphrase Hint',
    subTypeOptions: [
      'Master Recovery Key',
      '2FA Hardware Token',
      'Cloud & Domain Auth',
      'Encrypted Archive Key',
      'Banking Recovery Code',
    ],
  },
  beneficiary_contact: {
    label: 'Beneficiaries & Contacts',
    shortLabel: 'Beneficiaries',
    description: 'Trusted executors, legal counsel, and emergency access delegates.',
    identifierLabel: 'Direct Phone / Contact ID',
    secondaryLabel: 'Email & Verification Note',
    subTypeOptions: [
      'Primary Beneficiary',
      'Contingent Executor',
      'Legal Counsel',
      'Financial Advisor',
      'Emergency Contact',
    ],
  },
};

export function getDaysUntilExpiration(expirationDate?: string): number | null {
  if (!expirationDate || !expirationDate.trim()) return null;
  const parsed = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = parsed.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function computeRecordStatus(record: VaultRecord): RecordStatus {
  const days = getDaysUntilExpiration(record.expirationDate);
  if (days === null) return 'active';
  if (days < 0) return 'lapsed';
  if (days <= 30) return 'expiring';
  return 'active';
}

export function formatExpirationPhrase(expirationDate?: string): string {
  const days = getDaysUntilExpiration(expirationDate);
  if (days === null) return 'No expiration';
  if (days < 0) {
    const overdue = Math.abs(days);
    return overdue === 1 ? 'Lapsed 1 day ago' : `Lapsed ${overdue} days ago`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 30) return `Due in ${days} days`;
  return formatDisplayDate(expirationDate);
}

export function formatDisplayDate(isoDate?: string): string {
  if (!isoDate || !isoDate.trim()) return 'Non-expiring';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null || Number.isNaN(amount) || amount <= 0) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskSensitiveValue(value: string, masked: boolean): string {
  if (!value) return '—';
  if (!masked) return value;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '••••';
  const tail = trimmed.slice(-4);
  return `•••• •••• ${tail}`;
}

export function addOneYearIso(isoDate?: string): string {
  const base =
    isoDate && !Number.isNaN(new Date(`${isoDate}T00:00:00`).getTime())
      ? new Date(`${isoDate}T00:00:00`)
      : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = base < today ? today : base;
  start.setFullYear(start.getFullYear() + 1);
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
