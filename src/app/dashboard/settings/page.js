import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import PasswordUpdateForm from './PasswordUpdateForm';

import ProfileUpdateForm from './ProfileUpdateForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();

  // Fetch complete user profile from DB to ensure we have the latest fields
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-foreground mb-1">Profile Settings</h1>
        <p className="text-sm text-text-secondary">Manage your account access.</p>
      </div>

      <section className="bg-card border border-border-subtle p-6 rounded-sm">
        <h3 className="text-base font-medium text-foreground mb-4">Account Information</h3>
        <ProfileUpdateForm user={user} />
      </section>

      <section className="bg-card border border-border-subtle p-6 rounded-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium text-foreground">Update Password</h3>
          <p className="text-xs text-text-secondary mt-1">
            Change your password. You will remain logged in on this device.
          </p>
        </div>

        <PasswordUpdateForm />
      </section>
    </div>
  );
}
