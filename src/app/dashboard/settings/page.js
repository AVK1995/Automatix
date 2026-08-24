import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import PasswordUpdateForm from './PasswordUpdateForm';
import ProfileUpdateForm from './ProfileUpdateForm';
import { User, ShieldCheck } from 'lucide-react';

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
        <p className="text-sm text-text-secondary">Manage your personal account profile, contact details, and authentication security.</p>
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
    </div>
  );
}
