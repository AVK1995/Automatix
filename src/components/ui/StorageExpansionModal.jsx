'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  HardDrive, 
  Check, 
  Copy, 
  Upload, 
  Loader2, 
  ShieldCheck, 
  QrCode, 
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Film,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_PACKS = [
  { 
    id: 'starter_100', 
    name: 'Starter Pack (+100 MB)', 
    mb: 100, 
    price: 99, 
    images: 15, 
    videos: 2, 
    videoMaxMB: 25, 
    docs: 20, 
    badge: 'Popular',
    desc: 'Perfect for regular social posts & campaign assets' 
  },
  { 
    id: 'growth_250', 
    name: 'Growth Pack (+250 MB)', 
    mb: 250, 
    price: 199, 
    images: 40, 
    videos: 5, 
    videoMaxMB: 35, 
    docs: 50, 
    badge: 'Best Value',
    desc: 'Ideal for multi-channel video ads & product drops' 
  },
  { 
    id: 'power_500', 
    name: 'Power Pack (+500 MB)', 
    mb: 500, 
    price: 349, 
    images: 80, 
    videos: 8, 
    videoMaxMB: 50, 
    docs: 100, 
    badge: 'Power User',
    desc: 'High-volume marketing asset automation' 
  },
  { 
    id: 'ultra_1000', 
    name: 'Ultra Pack (+1 GB)', 
    mb: 1000, 
    price: 599, 
    images: 180, 
    videos: 15, 
    videoMaxMB: 75, 
    docs: 200, 
    badge: 'Maximum',
    desc: 'Enterprise storage capacity for large automated libraries' 
  },
];

export default function StorageExpansionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('growth_250');
  const [receiptScreenshot, setReceiptScreenshot] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const upiId = 'billing@automatix.local';
  const selectedPack = STORAGE_PACKS.find(p => p.id === selectedPackId) || STORAGE_PACKS[1];

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail?.packId) {
        setSelectedPackId(e.detail.packId);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-storage-modal', handleOpen);
    return () => window.removeEventListener('open-storage-modal', handleOpen);
  }, []);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be under 5 MB');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptScreenshot(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!receiptScreenshot) {
      toast.error('Please attach a screenshot of your completed UPI payment receipt');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/media/quota-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: `Storage Expansion (${selectedPack.name})`,
          storageAddon: selectedPack.id,
          message: notes.trim() || `User requested ${selectedPack.name} (+${selectedPack.mb} MB storage). Amount: ₹${selectedPack.price}`,
          receiptScreenshot
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit storage expansion request');
      }

      toast.success('Storage expansion request submitted! Admin will verify and activate your quota within 24 hours.');
      setIsOpen(false);
      setReceiptScreenshot(null);
      setReceiptFileName('');
      setNotes('');
    } catch (err) {
      toast.error(err.message || 'Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=Automatix&am=${selectedPack.price}&cu=INR`
  )}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Simple dimming overlay per AGENTS.md rule: bg-black/60, no backdrop-blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* Solid dark modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative w-full max-w-2xl bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue shrink-0">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Expand Storage Quota
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
                      Instant Add-on
                    </span>
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Select a storage pack to increase your media bucket capacity for videos, images, and docs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto max-h-[78vh]">
              {/* Pack Selector Grid */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Choose Storage Pack
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STORAGE_PACKS.map((pack) => {
                    const isSelected = selectedPackId === pack.id;
                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-accent-blue/10 border-accent-blue shadow-md shadow-accent-blue/10 ring-1 ring-accent-blue'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-text-secondary border border-white/5">
                              {pack.badge}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1.5">{pack.name}</h4>
                            <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{pack.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-base font-extrabold text-white">₹{pack.price}</span>
                            <span className="text-[10px] text-text-tertiary block font-mono">one-time</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Film size={11} className="text-sky-400" /> {pack.videos} Vids ({pack.videoMaxMB}MB)
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon size={11} className="text-emerald-400" /> {pack.images} Imgs
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText size={11} className="text-amber-400" /> {pack.docs} Docs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Section */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-accent-blue" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Direct UPI Payment</span>
                  </div>
                  <span className="text-sm font-bold text-accent-blue">
                    Total Payable: ₹{selectedPack.price}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* QR Code */}
                  <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                    <img
                      src={qrUrl}
                      alt="UPI QR Code"
                      width={130}
                      height={130}
                      className="w-32 h-32 rounded-lg object-contain"
                    />
                  </div>

                  {/* UPI Details */}
                  <div className="flex-1 space-y-2.5 w-full text-xs">
                    <p className="text-text-secondary text-[11px] leading-relaxed">
                      Scan the QR code with any UPI application (GPay, PhonePe, Paytm) or pay directly to our registered UPI ID:
                    </p>

                    <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
                      <span className="font-mono text-white font-semibold flex-1 truncate">{upiId}</span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white rounded transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedUpi ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copiedUpi ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="text-[10px] text-text-tertiary flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Zero recurring lock-in. Storage is added permanently to your active cycle.</span>
                    </div>
                  </div>
                </div>

                {/* Receipt Upload Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-medium text-text-secondary">
                    Attach Payment Screenshot <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      receiptScreenshot
                        ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400'
                        : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04] text-text-secondary hover:text-white'
                    }`}
                  >
                    {receiptScreenshot ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium truncate max-w-xs">{receiptFileName || 'Receipt attached'}</span>
                        <span className="text-[10px] underline ml-2">Replace</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="shrink-0" />
                        <span className="text-xs">Click to upload payment screenshot (PNG, JPG max 5MB)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-text-tertiary">
                    Optional Transaction Note / UTR Reference
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. UTR / Transaction reference number..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !receiptScreenshot}
                  className="px-5 py-2 text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 rounded-lg shadow-lg shadow-accent-blue/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Submit Expansion Request (₹{selectedPack.price})
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
