'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Search, Filter, Loader2, MessageSquare, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function GlobalSupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetcher = (url) => fetch(url).then(r => r.json());
  const { data, error, isLoading } = useSWR(`/api/admin/support?status=${statusFilter}&search=${debouncedSearch}`, fetcher, { refreshInterval: 10000 });

  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-xl font-medium text-foreground mb-1">Global Support Tickets</h2>
        <p className="text-sm text-text-secondary">View and manage all user support requests.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search by subject, name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-sm pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-text-secondary" />
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none hover:border-white/20 transition-colors min-w-[140px] text-left flex justify-between items-center"
            >
              <span>
                {statusFilter === 'ALL' ? 'All Statuses' : 
                 statusFilter === 'OPEN' ? 'Open' : 
                 statusFilter === 'IN_PROGRESS' ? 'In Progress' : 
                 statusFilter === 'RESOLVED' ? 'Resolved' : 
                 'Closed'}
              </span>
              <ChevronDown className={`w-4 h-4 ml-2 opacity-50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-1 w-full bg-[#111111] border border-white/10 rounded-sm shadow-xl z-50 py-1 overflow-hidden">
                  {[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'OPEN', label: 'Open' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'RESOLVED', label: 'Resolved' },
                    { value: 'CLOSED', label: 'Closed' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 transition-colors ${statusFilter === opt.value ? 'text-accent-blue bg-accent-blue/5' : 'text-text-secondary hover:text-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border-subtle rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm">Failed to load tickets.</div>
        ) : data?.tickets?.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">No support tickets found matching your criteria.</div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {data.tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-text-secondary">#{ticket.id.slice(-6).toUpperCase()}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${
                      ticket.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                      ticket.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                      'bg-white/5 text-text-secondary border border-white/10'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                      {ticket.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">{ticket.subject}</h3>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span>{ticket.user.name || 'Unknown User'} ({ticket.user.email})</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </div>
                
                <Link href={`/admin/users/${ticket.userId}`} className="shrink-0">
                  <button className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-sm transition-colors flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    View & Respond
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
