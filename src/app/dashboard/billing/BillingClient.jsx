'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  CreditCard, 
  HardDrive, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ArrowUpRight, 
  Clock, 
  RefreshCw, 
  Zap, 
  Download, 
  X, 
  Printer,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function BillingClient({ initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [isUpdatingAutoPay, setIsUpdatingAutoPay] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const storagePercentage = Math.min((user.totalStorageUsedMB / user.maxStorageMB) * 100, 100);
  const isGracePeriod = user.storageStatus === 'GRACE_PERIOD';

  const now = new Date();
  const subExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const isExpiringSoon = subExpiry && (subExpiry.getTime() - now.getTime()) <= (5 * 24 * 60 * 60 * 1000) && (subExpiry.getTime() - now.getTime()) > 0;

  const handleToggleAutoPay = async () => {
    setIsUpdatingAutoPay(true);
    const newStatus = !user.autoPayEnabled;
    try {
      const res = await fetch('/api/user/autopay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update AutoPay');
      setUser(prev => ({ ...prev, autoPayEnabled: newStatus }));
      toast.success(newStatus ? 'AutoPay enabled successfully' : 'AutoPay disabled');
    } catch (e) {
      toast.error('Failed to update AutoPay status');
    } finally {
      setIsUpdatingAutoPay(false);
    }
  };

  const openStorageModal = () => {
    window.dispatchEvent(new CustomEvent('open-storage-modal'));
  };

  const openRenewalModal = () => {
    const rawTier = (user.subscriptionTier || 'pro').toLowerCase();
    const planKey = rawTier.includes('ent') ? 'enterprise' : 'pro';
    window.dispatchEvent(new CustomEvent('open-plan-modal', {
      detail: {
        plan: planKey,
        cycle: user.subscriptionCycle || 'monthly',
        step: 4
      }
    }));
  };

  const getSubPrice = () => {
    const tier = (user.subscriptionTier || 'starter').toLowerCase();
    if (tier === 'professional' || tier === 'pro') return '₹499/mo';
    if (tier === 'enterprise') return '₹1,499/mo';
    return '₹0/mo (Free)';
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your subscription, storage capacity, AutoPay preferences, and payment receipts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(isExpiringSoon || isGracePeriod) && (
            <button
              onClick={openRenewalModal}
              className="px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <RefreshCw size={14} />
              Renew / Resend Payment Status
            </button>
          )}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-plan-modal', { detail: { step: 1 } }))}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-all shadow-lg shadow-accent-blue/20 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} />
            Upgrade Plan & Addons
          </button>
        </div>
      </div>

      {/* Grace Period Alert Banner */}
      {isGracePeriod && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-400">Payment Overdue — 5-Day Grace Period Active</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Your subscription payment is past due. Your storage bucket has been placed in a 5-day grace period. 
                If payment is not completed before <strong>{user.storageGraceExpiresAt ? new Date(user.storageGraceExpiresAt).toLocaleDateString() : '5 days'}</strong>, 
                your account will revert to the 50 MB free tier.
              </p>
            </div>
          </div>
          <button
            onClick={openRenewalModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer"
          >
            Renew Plan Now
          </button>
        </div>
      )}

      {/* Expiring Soon Alert Banner */}
      {isExpiringSoon && !isGracePeriod && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-400">Subscription Renewal Due Soon</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Your <strong>{user.subscriptionTier || 'Professional'}</strong> plan expires on <strong>{subExpiry ? subExpiry.toLocaleDateString() : 'soon'}</strong>. 
                Click below to complete renewal transfer and resend your payment status.
              </p>
            </div>
          </div>
          <button
            onClick={openRenewalModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer"
          >
            Renew / Resend Payment
          </button>
        </div>
      )}

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Card 1: Subscription Tier */}
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Main Subscription</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 capitalize">
                {user.subscriptionTier || 'Starter'}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {getSubPrice()}
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Billing Cycle: <span className="text-white capitalize">{user.subscriptionCycle || 'Monthly'}</span>
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Next Renewal:</span>
              <span className="text-white font-medium">
                {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'Free Forever'}
              </span>
            </div>
            {(isExpiringSoon || isGracePeriod) ? (
              <button
                type="button"
                onClick={openRenewalModal}
                className="w-full block text-center py-2 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all cursor-pointer shadow-sm"
              >
                Renew / Resend Payment Status
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-plan-modal', { detail: { step: 1 } }));
                }}
                className="w-full block text-center py-2 px-3 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 cursor-pointer"
              >
                Change Subscription Plan
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Storage Bucket Allocation */}
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Storage Capacity</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isGracePeriod 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {isGracePeriod ? 'Grace Period' : 'Active'}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-bold text-white">{user.totalStorageUsedMB} MB</span>
              <span className="text-xs text-text-tertiary">/ {user.maxStorageMB} MB max</span>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 75 ? 'bg-amber-500' : 'bg-accent-blue'
                }`}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-text-secondary">
              {user.imageCount} Images ({user.maxImageMB}MB max) • {user.videoCount} Videos ({user.maxVideoMB}MB max)
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Storage Pack:</span>
              <span className="text-accent-blue font-medium">{user.quotaTier || 'Free Plan (50 MB)'}</span>
            </div>
            <button
              type="button"
              onClick={openStorageModal}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue transition-colors border border-accent-blue/20 cursor-pointer"
            >
              Expand Storage Quota
            </button>
          </div>
        </div>

        {/* Card 3: AutoPay & Payment Settings */}
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">AutoPay Settings</span>
              <div className="flex items-center gap-1">
                {user.autoPayEnabled ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                )}
                <span className="text-[10px] font-bold text-text-tertiary ml-1">
                  {user.autoPayEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 bg-white/[0.02] border border-white/5 p-3 rounded-lg">
              <div>
                <span className="text-sm font-semibold text-white block">Auto-Renew Services</span>
                <span className="text-[11px] text-text-tertiary">Automatically renew monthly plans</span>
              </div>
              <button
                onClick={handleToggleAutoPay}
                disabled={isUpdatingAutoPay}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  user.autoPayEnabled ? 'bg-accent-blue' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    user.autoPayEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              When enabled, subscription and storage renewals are charged automatically to prevent grace periods or file purging.
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-text-tertiary">
            <span>Currency:</span>
            <span className="text-white font-medium">INR (₹)</span>
          </div>
        </div>
      </div>

      {/* Invoices & Payment History Section */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText size={18} className="text-accent-blue" />
              Invoices & Payment History
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Review all past payments, subscription receipts, and add-on transactions.
            </p>
          </div>
        </div>

        {user.invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-xl text-center">
            <CreditCard size={36} className="text-text-tertiary mb-3" />
            <h3 className="text-sm font-medium text-white mb-1">No Invoices Yet</h3>
            <p className="text-xs text-text-secondary max-w-sm">
              When you subscribe to a paid plan or purchase a storage add-on pack, your invoices and receipts will appear here in ₹ (INR).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase font-semibold text-text-secondary">
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Billing Date</th>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {user.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-white font-medium">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-white">
                      {inv.serviceName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      ₹{inv.amountRs}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {inv.status === 'PAID' && <CheckCircle2 size={10} />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-1.5"
                      >
                        <FileText size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Receipt Modal (Solid Dark Background, No Blur as per UI Rules) */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedInvoice && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/70" 
                onClick={() => setSelectedInvoice(null)} 
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl p-6 space-y-6 z-10 my-auto"
              >
                {/* Receipt Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Payment Receipt</h3>
                    <span className="font-mono text-xs text-text-tertiary">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Receipt Details */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-3.5 rounded-lg border border-white/5">
                    <div>
                      <span className="text-text-tertiary block mb-0.5">Billed To:</span>
                      <span className="text-white font-medium block">{user.name || user.email}</span>
                      <span className="text-text-secondary">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block mb-0.5">Payment Date:</span>
                      <span className="text-white font-medium block">
                        {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-text-secondary">Method: {selectedInvoice.paymentMethod || 'UPI / Card'}</span>
                    </div>
                  </div>

                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    <div className="flex justify-between p-3 bg-black/40 border-b border-white/10 font-semibold text-text-secondary">
                      <span>Description</span>
                      <span>Amount</span>
                    </div>
                    <div className="flex justify-between p-3 text-white">
                      <span>{selectedInvoice.serviceName}</span>
                      <span className="font-bold">₹{selectedInvoice.amountRs}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/[0.02] border-t border-white/5 text-sm font-bold text-accent-blue">
                      <span>Total Paid</span>
                      <span>₹{selectedInvoice.amountRs}</span>
                    </div>
                  </div>
                </div>

                {/* Receipt Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
                  >
                    <Printer size={14} />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      </div>
  );
}
