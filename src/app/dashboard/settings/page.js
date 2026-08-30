import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import PasswordUpdateForm from './PasswordUpdateForm';
import ProfileUpdateForm from './ProfileUpdateForm';
import AiRadahnSettingsForm from './AiRadahnSettingsForm';
import { User, ShieldCheck, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();

  // Fetch complete user profile from DB to ensure we have the latest fields
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-xl font-medium text-foreground mb-1">Profile & Security Settings</h1>
        <p className="text-sm text-text-secondary">Manage your personal account profile, contact details, AI Radahn BYOK engine, and authentication security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
        {/* Column 1: Account Information */}
        <section className="bg-card border border-border-subtle p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
            <User size={18} className="text-accent-blue" />
            <h3 className="text-base font-semibold text-foreground">Account Information</h3>
          </div>
          <ProfileUpdateForm user={user} />
        </section>

        {/* Column 2: Password Update & Security */}
        <section className="bg-card border border-border-subtle p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <h3 className="text-base font-semibold text-foreground">Update Password</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Change your account password securely.
              </p>
            </div>
          </div>

          <PasswordUpdateForm />
        </section>
      </div>

      {/* Row 2: AI Radahn Engine & BYOK Configuration */}
      <section className="bg-card border border-border-subtle p-6 rounded-xl space-y-4 w-full">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-accent-blue flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">AI Radahn Engine & BYOK Settings</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI Radahn Brain
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Configure your AI Radahn inference mode. Free users utilize the Native Core Brain; Paid subscribers can connect BYOK credentials (Gemini, OpenAI, Claude) for True AI reasoning.
              </p>
            </div>
          </div>
        </div>

        <AiRadahnSettingsForm user={user} />
      </section>
    </div>
  );
}
