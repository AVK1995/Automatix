import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Database } from 'lucide-react';
import Link from 'next/link';

export default async function AdminGlobalStoragePage() {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    include: {
      media: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Global Storage Buckets</h1>
        <p className="text-sm text-text-secondary">Monitor storage usage across all tenant accounts.</p>
      </div>

      <div className="bg-[#111] border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Tenant</th>
                <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Plan</th>
                <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Videos</th>
                <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Images</th>
                <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Storage Usage</th>
                <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const videoCount = u.media.filter(m => m.type === 'VIDEO').length;
                const imageCount = u.media.filter(m => m.type === 'IMAGE').length;
                const totalUsedMB = u.media.reduce((sum, m) => sum + m.sizeMB, 0);
                const percent = Math.min((totalUsedMB / u.maxStorageMB) * 100, 100);

                return (
                  <tr key={u.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold text-xs uppercase">
                          {u.email.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{u.name || 'Unnamed Tenant'}</div>
                          <div className="text-xs text-text-secondary">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-white/5 border border-white/10 text-white">
                        {u.quotaTier}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary">
                      <span className={videoCount >= u.maxVideos ? 'text-red-400 font-medium' : ''}>{videoCount}</span> / {u.maxVideos}
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary">
                      <span className={imageCount >= u.maxImages ? 'text-red-400 font-medium' : ''}>{imageCount}</span> / {u.maxImages}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[120px] h-1.5 bg-black rounded-full overflow-hidden border border-white/10">
                          <div 
                            className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-yellow-500' : 'bg-accent-blue'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-text-tertiary w-16">
                          {totalUsedMB > 1000 ? (totalUsedMB/1024).toFixed(1) + 'GB' : totalUsedMB.toFixed(1) + 'MB'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center justify-center p-2 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                        title="Manage Tenant"
                      >
                        <Database size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
