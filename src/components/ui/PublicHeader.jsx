import Link from 'next/link';
import { auth } from '@/auth';
import Logo from '@/components/Logo';
import ProfileDropdown from '@/components/ProfileDropdown';
import { ArrowLeft } from 'lucide-react';

export default async function PublicHeader({ showBack = true, backHref = "/", backText = "Back to Home" }) {
  const session = await auth();

  return (
    <div className="w-full border-b border-border-subtle bg-background/80 backdrop-blur-md sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/">
            <Logo size={32} className="hover:scale-105 transition-transform" />
          </Link>
          {showBack && (
            <Link href={backHref} className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mt-2 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-medium">{backText}</span>
            </Link>
          )}
        </div>

        {session && (
          <div className="flex items-center gap-4">
            <ProfileDropdown user={session.user} />
          </div>
        )}
      </div>
    </div>
  );
}
