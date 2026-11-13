import React, { useEffect, useState } from 'react';
import { Delete, Lock, ShieldCheck } from 'lucide-react';

interface VaultLockOverlayProps {
  expectedPin: string;
  onUnlock: () => void;
}

export const VaultLockOverlay: React.FC<VaultLockOverlayProps> = ({
  expectedPin,
  onUnlock,
}) => {
  const [entered, setEntered] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const submitPin = (candidate: string) => {
    if (candidate === expectedPin) {
      setErrorMsg('');
      setEntered('');
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
      setEntered('');
    }
  };

  const handleDigit = (digit: string) => {
    if (entered.length >= 4) return;
    setErrorMsg('');
    const next = entered + digit;
    setEntered(next);
    if (next.length === 4) {
      setTimeout(() => submitPin(next), 120);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setEntered((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vault locked"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC]/95 p-4 backdrop-blur-md"
    >
      <div className="vault-modal-shadow w-full max-w-[380px] rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-[22px] font-bold tracking-tight text-[#0F172A]">
          LifeVault Locked
        </h1>
        <p className="mt-1 text-[14px] text-[#475569]">
          Enter your 4-digit security PIN to unmask and resume access.
        </p>

        {/* PIN Indicators */}
        <div className="mt-6 flex items-center justify-center gap-3.5" aria-live="polite">
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < entered.length;
            return (
              <div
                key={idx}
                className={`h-3.5 w-3.5 rounded-full border transition-all ${
                  filled
                    ? 'scale-110 border-[#2563EB] bg-[#2563EB]'
                    : 'border-[#CBD5E1] bg-[#F1F5F9]'
                }`}
              />
            );
          })}
        </div>

        {errorMsg ? (
          <p className="mt-3 text-[13px] font-semibold text-[#B91C1C]">{errorMsg}</p>
        ) : (
          <p className="mt-3 text-[12px] text-[#94A3B8]">
            {expectedPin === '2026'
              ? 'Default demo PIN: 2026 (customizable in Backup & Security)'
              : 'Type on keyboard or tap keypad below'}
          </p>
        )}

        {/* Keypad */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl border border-[#E2E8F0] bg-white text-[17px] font-semibold text-[#0F172A] tabular-nums transition-colors hover:bg-[#F8FAFC] active:scale-[0.97]"
            >
              {digit}
            </button>
          ))}
          <div className="flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-[#94A3B8]" />
          </div>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl border border-[#E2E8F0] bg-white text-[17px] font-semibold text-[#0F172A] tabular-nums transition-colors hover:bg-[#F8FAFC] active:scale-[0.97]"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Delete last digit"
            className="flex h-12 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] transition-colors hover:bg-[#F1F5F9] active:scale-[0.97]"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
