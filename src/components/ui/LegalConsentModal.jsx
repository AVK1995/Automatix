'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Checkbox from '@/components/ui/Checkbox';

export default function LegalConsentModal({ isOpen, onClose, onAccept, provider }) {
  const [hasAgreed, setHasAgreed] = React.useState(false);

  // Reset agreement state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setHasAgreed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (hasAgreed) {
      onAccept();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Third-Party Terms & Liability</h3>
                  <p className="text-xs text-text-secondary">Important disclaimer regarding {provider} integration</p>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar text-sm text-text-secondary leading-relaxed">
                <p>
                  Automatix acts strictly as an infrastructure provider and a technological "middle-man." By connecting your {provider} account, you acknowledge and agree to the following:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Zero Liability:</strong> Automatix is completely isolated from and holds zero legal liability for any bans, suspensions, account restrictions, or policy violations applied to your accounts by {provider}.</li>
                  <li><strong>Your Responsibility:</strong> You are solely responsible for ensuring that your automated workflows and messages comply with {provider}'s Developer Policies and Terms of Service.</li>
                  <li><strong>Data Security:</strong> Any credentials (like App Secrets or Access Tokens) you provide will be heavily encrypted (AES-256) at rest, but providing them is done at your own risk.</li>
                  <li><strong>Concierge Setup:</strong> If you utilize our optional Concierge service, you acknowledge you are granting our administrators temporary access to your third-party accounts solely for technical configuration.</li>
                </ul>
              </div>

              <div className="p-6 pt-4 border-t border-white/5 bg-black/20 space-y-5">
                <Checkbox
                  checked={hasAgreed}
                  onChange={(checked) => setHasAgreed(checked)}
                  label={
                    <span className="text-xs sm:text-[13px] text-text-secondary leading-relaxed block">
                      I have read and agree to the <Link href="/terms" target="_blank" className="text-accent-blue hover:underline">Terms & Conditions</Link> and <Link href="/privacy" target="_blank" className="text-accent-blue hover:underline">Privacy Policy</Link>. I understand Automatix is not liable for issues with my {provider} account.
                    </span>
                  }
                />

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 border border-border-subtle transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={!hasAgreed}
                    className="flex-1 bg-accent-blue hover:bg-accent-blue/90 disabled:bg-accent-blue/50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-accent-blue/20"
                  >
                    Accept & Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
