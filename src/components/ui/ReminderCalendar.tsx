import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/calculateUtils';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  user_id: string;
}

const ReminderCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', description: '' });
  const queryClient = useQueryClient();

  const currentMonth = selectedDate || new Date();

  // Fetch all reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      return data as Reminder[];
    },
  });

  // Fetch monthly data for calendar tooltips
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: calApplications } = useQuery({
    queryKey: ['cal-applications', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('applications').select('*')
        .gte('date', monthStart).lte('date', monthEnd + 'T23:59:59.999');
      return data || [];
    },
  });

  const { data: calPhotostats } = useQuery({
    queryKey: ['cal-photostats', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('photostats').select('*')
        .gte('date', monthStart).lte('date', monthEnd + 'T23:59:59.999');
      return data || [];
    },
  });

  const { data: calExpenses } = useQuery({
    queryKey: ['cal-expenses', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('*')
        .gte('date', monthStart).lte('date', monthEnd + 'T23:59:59.999');
      return data || [];
    },
  });

  const { data: calPending } = useQuery({
    queryKey: ['cal-pending', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('pending_balances').select('*')
        .gte('date', monthStart).lte('date', monthEnd + 'T23:59:59.999');
      return data || [];
    },
  });

  const { data: calOnline } = useQuery({
    queryKey: ['cal-online', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('online_services').select('*')
        .gte('date', monthStart).lte('date', monthEnd + 'T23:59:59.999');
      return data || [];
    },
  });

  const { data: calBanking } = useQuery({
    queryKey: ['cal-banking', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('banking_services').select('*')
        .gte('date', monthStart).lte('date', monthEnd + 'T23:59:59.999');
      return data || [];
    },
  });

  // Build a map of date -> summary
  const daySummaryMap = useMemo(() => {
    const map: Record<string, {
      applications: number;
      photostat: number;
      expenses: number;
      pending: number;
      online: number;
      bankingAmount: number;
      bankingMargin: number;
      hasData: boolean;
    }> = {};

    const addToDate = (dateStr: string, field: string, value: number) => {
      const key = dateStr.split('T')[0];
      if (!map[key]) {
        map[key] = { applications: 0, photostat: 0, expenses: 0, pending: 0, online: 0, bankingAmount: 0, bankingMargin: 0, hasData: false };
      }
      (map[key] as any)[field] += value;
      map[key].hasData = true;
    };

    calApplications?.forEach(i => addToDate(i.date, 'applications', Number(i.amount)));
    calPhotostats?.forEach(i => addToDate(i.date, 'photostat', Number(i.margin)));
    calExpenses?.forEach(i => addToDate(i.date, 'expenses', Number(i.amount)));
    calPending?.forEach(i => addToDate(i.date, 'pending', Number(i.amount)));
    calOnline?.forEach(i => addToDate(i.date, 'online', Number(i.total)));
    calBanking?.forEach(i => {
      addToDate(i.date, 'bankingAmount', Number(i.amount));
      addToDate(i.date, 'bankingMargin', Number(i.margin));
    });

    return map;
  }, [calApplications, calPhotostats, calExpenses, calPending, calOnline, calBanking]);

  // Get reminders for selected date
  const selectedDateReminders = reminders.filter(
    (reminder) =>
      selectedDate && isSameDay(new Date(reminder.reminder_date), selectedDate)
  );

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: async (reminder: { title: string; description: string; reminder_date: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('reminders').insert({
        ...reminder,
        user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder added successfully');
      setShowAddDialog(false);
      setNewReminder({ title: '', description: '' });
    },
    onError: () => {
      toast.error('Failed to add reminder');
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete reminder');
    },
  });

  const handleAddReminder = () => {
    if (!newReminder.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    addReminderMutation.mutate({
      title: newReminder.title,
      description: newReminder.description,
      reminder_date: format(selectedDate, 'yyyy-MM-dd'),
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const hasReminders = reminders.some((reminder) =>
        isSameDay(new Date(reminder.reminder_date), date)
      );
      if (hasReminders) {
        setShowViewDialog(true);
      }
    }
  };

  // Custom day content to show dots on dates with reminders
  const modifiers = {
    hasReminder: reminders.map((reminder) => new Date(reminder.reminder_date)),
  };

  const modifiersClassNames = {
    hasReminder: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
  };

  return (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Calendar
          </h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="h-8 w-8 p-0"
          disabled={!selectedDate}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <TooltipProvider delayDuration={200}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border w-full"
          components={{
            DayContent: ({ date: dayDate, ...props }) => {
              const dateKey = format(dayDate, 'yyyy-MM-dd');
              const summary = daySummaryMap[dateKey];
              
              if (summary?.hasData) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="relative w-full h-full flex items-center justify-center">
                        {dayDate.getDate()}
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-chart-1 rounded-full" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] p-3 text-xs space-y-1.5 z-50">
                      <p className="font-semibold text-foreground mb-1">{format(dayDate, 'dd MMM yyyy')}</p>
                      {summary.applications > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Applications</span>
                          <span className="font-medium text-foreground">{formatCurrency(summary.applications)}</span>
                        </div>
                      )}
                      {summary.photostat > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Photostat</span>
                          <span className="font-medium text-foreground">{formatCurrency(summary.photostat)}</span>
                        </div>
                      )}
                      {summary.expenses > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Expenses</span>
                          <span className="font-medium text-destructive">{formatCurrency(summary.expenses)}</span>
                        </div>
                      )}
                      {summary.pending > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Pending Bal.</span>
                          <span className="font-medium text-destructive">{formatCurrency(summary.pending)}</span>
                        </div>
                      )}
                      {summary.online > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Online Svc.</span>
                          <span className="font-medium text-foreground">{formatCurrency(summary.online)}</span>
                        </div>
                      )}
                      {summary.bankingAmount > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Banking</span>
                          <span className="font-medium text-foreground">{formatCurrency(summary.bankingAmount)}</span>
                        </div>
                      )}
                      {summary.bankingMargin > 0 && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Bank Margin</span>
                          <span className="font-medium text-primary">{formatCurrency(summary.bankingMargin)}</span>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              
              return <span>{dayDate.getDate()}</span>;
            },
          }}
        />
      </TooltipProvider>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
            <DialogDescription>
              {selectedDate && `For ${format(selectedDate, 'PPP')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter reminder title"
                value={newReminder.title}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter reminder description"
                value={newReminder.description}
                onChange={(e) =>
                  setNewReminder({ ...newReminder, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddReminder}
              disabled={addReminderMutation.isPending}
            >
              Add Reminder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Reminders Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reminders</DialogTitle>
            <DialogDescription>
              {selectedDate && `For ${format(selectedDate, 'PPP')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {selectedDateReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reminders for this date
              </p>
            ) : (
              selectedDateReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {reminder.title}
                      </h4>
                      {reminder.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {reminder.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteReminderMutation.mutate(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowViewDialog(false);
                setShowAddDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReminderCalendar;
