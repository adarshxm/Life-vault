export type VaultCategory =
  | 'policy_warranty'
  | 'legal_identity'
  | 'digital_credential'
  | 'beneficiary_contact';

export type RecordStatus = 'active' | 'expiring' | 'lapsed';

export type NavSection =
  | 'overview'
  | VaultCategory
  | 'renewals'
  | 'settings';

export type ViewMode = 'cards' | 'table';

export interface VaultRecord {
  id: string;
  category: VaultCategory;
  title: string;
  subType: string;
  providerOrIssuer: string;
  sensitiveIdentifier: string;
  secondarySecret?: string;
  valueAmount?: number;
  issueDate?: string;
  expirationDate?: string;
  autoRenew: boolean;
  locationOrStorage: string;
  linkedContactId?: string;
  notes: string;
  updatedAt: string;
}

export interface VaultSettings {
  pinCode: string;
  autoMaskByDefault: boolean;
  ownerName: string;
  ownerEmail: string;
}

export interface ScannedDraftResponse {
  category: VaultCategory;
  title: string;
  subType: string;
  providerOrIssuer: string;
  sensitiveIdentifier: string;
  secondarySecret: string;
  valueAmount: number;
  issueDate: string;
  expirationDate: string;
  autoRenew: boolean;
  locationOrStorage: string;
  notes: string;
  confidenceNote: string;
}
