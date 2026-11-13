import React, { useState } from 'react';
import {
  BellRing,
  FileText,
  KeyRound,
  LayoutGrid,
  Lock,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { NavSection, VaultCategory, VaultSettings } from '../types/vault';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  counts: Record<VaultCategory, number>;
  attentionCount: number;
  settings: VaultSettings;
  onLockVault: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  counts,
  attentionCount,
  settings,
  onLockVault,
  mobileOpen,
  onCloseMobile,
}) => {
  const [imgError, setImgError] = useState(false);

  const navItems: Array<{
    id: NavSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeTone?: 'muted' | 'attention';
  }> = [
    {
      id: 'overview',
      label: 'Vault Overview',
      icon: <LayoutGrid className="h-[18px] w-[18px]" />,
    },
    {
      id: 'policy_warranty',
      label: 'Policies & Warranties',
      icon: <ShieldCheck className="h-[18px] w-[18px]" />,
      badge: counts.policy_warranty,
      badgeTone: 'muted',
    },
    {
      id: 'legal_identity',
      label: 'Legal & Identity',
      icon: <FileText className="h-[18px] w-[18px]" />,
      badge: counts.legal_identity,
      badgeTone: 'muted',
    },
    {
      id: 'digital_credential',
      label: 'Credentials & Keys',
      icon: <KeyRound className="h-[18px] w-[18px]" />,
      badge: counts.digital_credential,
      badgeTone: 'muted',
    },
    {
      id: 'beneficiary_contact',
      label: 'Beneficiaries',
      icon: <Users className="h-[18px] w-[18px]" />,
      badge: counts.beneficiary_contact,
      badgeTone: 'muted',
    },
    {
      id: 'renewals',
      label: 'Renewal Queue',
      icon: <BellRing className="h-[18px] w-[18px]" />,
      badge: attentionCount > 0 ? attentionCount : undefined,
      badgeTone: 'attention',
    },
    {
      id: 'settings',
      label: 'Backup & Security',
      icon: <SlidersHorizontal className="h-[18px] w-[18px]" />,
    },
  ];

  const handleNavClick = (section: NavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const initials = settings.ownerName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="flex h-full w-[260px] flex-col border-r border-[#E2E8F0] bg-white">
      {/* Brand Lockup */}
      <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-5">
        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-[16px] font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
            LifeVault
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="rounded-lg p-1.5 text-[#475569] hover:bg-[#F1F5F9] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Vault sections" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-1.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#94A3B8]">
          Registry
        </div>
        {navItems.slice(0, 5).map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={active ? 'text-[#2563EB]' : 'text-[#64748B]'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && (
                <span
                  className={`ml-2 tabular-nums text-[12px] font-semibold ${
                    active ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-5 pb-1.5 text-[11px] font-bold tracking-[0.04em] uppercase text-[#94A3B8]">
          Vigilance & Controls
        </div>
        {navItems.slice(5).map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={active ? 'text-[#2563EB]' : 'text-[#64748B]'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFFBEB] px-1.5 text-[11px] font-bold tabular-nums text-[#B45309]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Owner Profile & Lock Footer */}
      <div className="border-t border-[#E2E8F0] p-4 space-y-3">
        <div className="flex items-center gap-3">
          {!imgError ? (
            <img
              src="/src/assets/images/avatar_vault_owner_1794550101652.jpg"
              alt={settings.ownerName}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-10 w-10 shrink-0 rounded-full border border-[#E2E8F0] object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[13px] font-bold text-[#0F172A]">
              {initials || 'LV'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[#0F172A]">
              {settings.ownerName}
            </p>
            <p className="truncate text-[12px] text-[#64748B]">
              {settings.ownerEmail}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLockVault}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] active:scale-[0.98]"
        >
          <Lock className="h-4 w-4 text-[#475569]" />
          Lock Vault
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
