'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBookings, updateBookingStatus } from '@/actions/bookings';
import { getCalendarById } from '@/actions/calendars';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Mail, ChevronRight, CheckCircle2, XCircle, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function BookingsPage() {
  const { calendarId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadData();
  }, [calendarId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [calRes, bookRes] = await Promise.all([
        getCalendarById(calendarId),
        getBookings(calendarId)
      ]);
      setCalendar(calRes);
      setBookings(bookRes);
    } catch (err) {
      toast.error('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdating(true);
      await updateBookingStatus(id, newStatus);
      toast.success(`Booking ${newStatus.toLowerCase()}`);
      await loadData();
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          booking.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 w-full mx-auto flex gap-8 h-full">
      {/* List Panel */}
      <div className={`flex-1 flex flex-col h-full ${selectedBooking ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/dashboard/calendars')}
            className="p-2 bg-black/30 hover:bg-black/50 border border-white/5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Bookings</h1>
            <p className="text-sm text-text-secondary">{calendar?.name} - Manage your scheduled events</p>
          </div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-xl flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {['ALL', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === status 
                      ? 'bg-white text-black' 
                      : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto p-4 space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No bookings yet
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div 
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedBooking?.id === booking.id 
                      ? 'bg-accent-blue/10 border-accent-blue/30' 
                      : 'bg-black/30 border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                        <span className="text-sm font-semibold text-white">{booking.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{booking.name}</h3>
                        <p className="text-xs text-text-secondary">{booking.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                      booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-500' :
                      booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {dayjs(booking.startTime).format('MMM D, YYYY')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {dayjs(booking.startTime).format('h:mm A')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Details Panel */}
      {selectedBooking && (
        <div className="flex-[1.2] bg-black/20 border border-white/5 rounded-xl flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white">Booking Details</h2>
            <button 
              onClick={() => setSelectedBooking(null)}
              className="md:hidden p-2 text-text-secondary hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                 <span className="text-2xl font-bold text-white">{selectedBooking.name.charAt(0).toUpperCase()}</span>
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-white">{selectedBooking.name}</h2>
                 <a href={`mailto:${selectedBooking.email}`} className="text-accent-blue hover:underline flex items-center gap-2 mt-1">
                   <Mail className="w-4 h-4" />
                   {selectedBooking.email}
                 </a>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-text-secondary mb-1">Date</div>
                <div className="font-semibold text-white">{dayjs(selectedBooking.startTime).format('dddd, MMMM D, YYYY')}</div>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-text-secondary mb-1">Time & Zone</div>
                <div className="font-semibold text-white">{dayjs(selectedBooking.startTime).format('h:mm A')}</div>
                <div className="text-xs text-text-tertiary mt-1">{selectedBooking.timezone}</div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-white mb-4">Custom Questions</h3>
              <div className="space-y-4">
                {selectedBooking.answers && Object.keys(selectedBooking.answers).length > 0 ? (
                  Object.entries(selectedBooking.answers).map(([question, answer], i) => (
                    <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                      <div className="text-sm font-medium text-white mb-2">{question}</div>
                      <div className="text-sm text-text-secondary whitespace-pre-wrap">{answer || '-'}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-text-secondary italic">No custom questions answered.</div>
                )}
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/5">
               <h3 className="text-sm font-semibold text-white mb-4">Actions</h3>
               <div className="flex flex-wrap gap-3">
                 <button 
                    disabled={updating || selectedBooking.status === 'CONFIRMED'}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CONFIRMED')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                 >
                   <CheckCircle2 className="w-4 h-4" /> Confirm
                 </button>
                 <button 
                    disabled={updating || selectedBooking.status === 'CANCELLED'}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                 >
                   <XCircle className="w-4 h-4" /> Cancel
                 </button>
                 <button 
                    disabled={updating || selectedBooking.status === 'RESCHEDULED'}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'RESCHEDULED')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                 >
                   <RefreshCw className="w-4 h-4" /> Reschedule
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
