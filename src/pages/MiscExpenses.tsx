
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import PageWrapper from '@/components/layout/PageWrapper';

const formSchema = z.object({
  name: z.string().min(2, { message: "Expense name is required" }),
  fee: z.coerce.number().min(1, { message: "Fee must be at least 1" }),
  date: z.date()
});

type FormValues = z.infer<typeof formSchema>;

const MiscExpenses = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      fee: 0,
      date: new Date()
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from('misc_expenses').insert({
        name: data.name,
        fee: data.fee,
        date: data.date.toISOString()
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Miscellaneous expense has been added successfully",
      });
      
      form.reset({
        name: '',
        fee: 0,
        date: new Date()
      });
    } catch (error) {
      console.error('Error adding misc expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add miscellaneous expense. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Miscellaneous Expenses"
      subtitle="Manage general expenses"
    >
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Add Miscellaneous Expense</CardTitle>
            <CardDescription>Record a new general expense</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter expense name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Expense"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default MiscExpenses;
