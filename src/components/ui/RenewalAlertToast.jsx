'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CreditCard, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RenewalAlertToast() {
  const [billingData, setBillingData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem('renewal_toast_dismissed') === 'true') {
      return;
    }

    const checkBilling = async () => {
      try {
        const res = await fetch('/api/user/billing');
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.user) return;

        const user = data.user;
        const now = new Date();
        const subExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
        const storageExpiry = user.storagePlanExpiresAt ? new Date(user.storagePlanExpiresAt) : null;
        const isGracePeriod = user.storageStatus === 'GRACE_PERIOD';

        const targetExpiry = (subExpiry && subExpiry > now) ? subExpiry : storageExpiry;

        let shouldShow = false;
        let daysLeft = 0;
        let hoursLeft = 0;

        if (isGracePeriod) {
          shouldShow = true;
          if (user.storageGraceExpiresAt) {
            const graceExpiry = new Date(user.storageGraceExpiresAt);
            const diffMs = graceExpiry.getTime() - now.getTime();
            daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          } else {
            daysLeft = 5;
          }
        } else if (targetExpiry) {
          const diffMs = targetExpiry.getTime() - now.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays <= 5 && diffDays > 0) {
            shouldShow = true;
            daysLeft = Math.ceil(diffDays);
            hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
          }
        }

        if (shouldShow) {
          setBillingData({
            isGracePeriod,
            daysLeft,
            hoursLeft,
            autoPayEnabled: user.autoPayEnabled,
            tier: user.subscriptionTier,
            storageTier: user.quotaTier
          });
          setIsVisible(true);
        }
      } catch (e) {
        console.error('Renewal check error:', e);
      }
    };

    checkBilling();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('renewal_toast_dismissed', 'true');
  };

  if (!isVisible || !billingData || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-6 left-6 z-40 max-w-[340px] sm:max-w-sm w-full"
      >
        <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md bg-[#0d0d0d]/95 ${
          billingData.isGracePeriod 
            ? 'border-amber-500/40 shadow-amber-500/10' 
            : 'border-accent-blue/40 shadow-accent-blue/10'
        }`}>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {billingData.isGracePeriod ? (
                <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ShieldAlert size={14} />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-md bg-accent-blue/20 text-accent-blue flex items-center justify-center">
                  <Clock size={14} />
                </div>
              )}
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                billingData.isGracePeriod ? 'text-amber-400' : 'text-accent-blue'
              }`}>
                {billingData.isGracePeriod ? 'Payment Overdue' : 'Renewal Due Soon'}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            {billingData.isGracePeriod ? (
              <>Your plan is in a <strong>5-day grace period</strong>. Excess storage will be permanently purged in <strong>{billingData.daysLeft} days</strong> if payment is not completed.</>
            ) : (
              <>Your subscription & storage renews in <strong>{billingData.daysLeft === 1 ? `${billingData.hoursLeft} hours` : `${billingData.daysLeft} days`}</strong>.</>
            )}
          </p>

          {/* AutoPay Status Indicator */}
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-white/[0.03] border border-white/5 mb-3 text-[11px]">
            <span className="text-text-tertiary">AutoPay Status:</span>
            <div className="flex items-center gap-1 font-medium">
              {billingData.autoPayEnabled ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">ACTIVE (Auto-renews)</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} className="text-amber-400" />
                  <span className="text-amber-400">OFF (Action needed)</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/billing"
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                billingData.isGracePeriod
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-accent-blue hover:bg-accent-blue/90 text-white shadow-lg shadow-accent-blue/20'
              }`}
            >
              <CreditCard size={13} />
              {billingData.isGracePeriod ? 'Pay Now (Save Files)' : 'Review & Pay'}
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
