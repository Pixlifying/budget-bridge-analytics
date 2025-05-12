
import React, { useState } from 'react';
import { differenceInYears, differenceInMonths, differenceInDays, parse, isValid } from 'date-fns';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageWrapper from '@/components/layout/PageWrapper';

const AgeCalculator = () => {
  const [birthDate, setBirthDate] = useState<string>('');
  const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);
  const [error, setError] = useState<string>('');

  const calculateAge = () => {
    try {
      setError('');
      
      if (!birthDate) {
        setError('Please enter a birth date');
        return;
      }
      
      // Parse the date in DD-MM-YYYY format
      const [day, month, year] = birthDate.split('-');
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (!isValid(parsedDate)) {
        setError('Invalid date format. Please use DD-MM-YYYY');
        return;
      }
      
      if (parsedDate > new Date()) {
        setError('Birth date cannot be in the future');
        return;
      }
      
      const today = new Date();
      const years = differenceInYears(today, parsedDate);
      
      // Calculate the date at exactly n years after birth
      const dateAtExactYears = new Date(parsedDate);
      dateAtExactYears.setFullYear(parsedDate.getFullYear() + years);
      
      // Calculate months between dateAtExactYears and today
      const months = differenceInMonths(today, dateAtExactYears);
      
      // Calculate the date at exactly n years and m months after birth
      const dateAtExactYearsAndMonths = new Date(dateAtExactYears);
      dateAtExactYearsAndMonths.setMonth(dateAtExactYears.getMonth() + months);
      
      // Calculate days between dateAtExactYearsAndMonths and today
      const days = differenceInDays(today, dateAtExactYearsAndMonths);
      
      setAge({ years, months, days });
    } catch (err) {
      console.error('Error calculating age:', err);
      setError('Failed to calculate age');
    }
  };

  return (
    <PageWrapper 
      title="Age Calculator" 
      subtitle="Calculate age based on birth date"
      action={<Calculator className="h-6 w-6" />}
    >
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Age Calculator</CardTitle>
            <CardDescription>Enter a birth date to calculate age (DD-MM-YYYY)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              
              <Button onClick={calculateAge} className="w-full">
                Calculate Age
              </Button>
              
              {age && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2">Result:</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-3xl font-bold">{age.years}</p>
                      <p className="text-sm text-muted-foreground">Years</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{age.months}</p>
                      <p className="text-sm text-muted-foreground">Months</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{age.days}</p>
                      <p className="text-sm text-muted-foreground">Days</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default AgeCalculator;
