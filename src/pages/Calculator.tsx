
import { useState, useEffect } from 'react';
import { differenceInYears, differenceInMonths, differenceInDays, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageWrapper from '@/components/layout/PageWrapper';
import { Calculator as CalculatorIcon } from 'lucide-react';

const CalculatorTab = () => {
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = performCalculation(operator, inputValue);
      setDisplay(String(result));
      setFirstOperand(result);
    }
    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const performCalculation = (op: string, secondOperand: number): number => {
    if (firstOperand === null) return secondOperand;
    switch (op) {
      case '+': return firstOperand + secondOperand;
      case '-': return firstOperand - secondOperand;
      case '*': return firstOperand * secondOperand;
      case '/': return firstOperand / secondOperand;
      case '%': return firstOperand % secondOperand;
      default: return secondOperand;
    }
  };

  const calculateResult = () => {
    if (firstOperand === null || operator === null) return;
    const inputValue = parseFloat(display);
    const result = performCalculation(operator, inputValue);
    setDisplay(String(result));
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      if (/[0-9+\-*/.%=]/.test(key) || key === 'Enter' || key === 'Escape' || key === 'Backspace') {
        event.preventDefault();
      }
      if (/[0-9]/.test(key)) inputDigit(key);
      else if (key === '.') inputDecimal();
      else if (key === '+') handleOperator('+');
      else if (key === '-') handleOperator('-');
      else if (key === '*') handleOperator('*');
      else if (key === '/') handleOperator('/');
      else if (key === '%') handleOperator('%');
      else if (key === '=' || key === 'Enter') calculateResult();
      else if (key === 'Escape' || key === 'c' || key === 'C') clear();
      else if (key === 'Backspace') {
        if (display.length > 1) setDisplay(display.slice(0, -1));
        else setDisplay('0');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [display, firstOperand, operator, waitingForSecondOperand]);

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input value={display} readOnly className="text-right text-xl py-6 font-mono bg-background" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => clear()}>C</Button>
            <Button variant="outline" onClick={() => handleOperator('%')}>%</Button>
            <Button variant="outline" onClick={() => { const value = parseFloat(display); setDisplay(String(-value)); }}>+/-</Button>
            <Button variant="secondary" onClick={() => handleOperator('/')}>÷</Button>
            <Button onClick={() => inputDigit('7')}>7</Button>
            <Button onClick={() => inputDigit('8')}>8</Button>
            <Button onClick={() => inputDigit('9')}>9</Button>
            <Button variant="secondary" onClick={() => handleOperator('*')}>×</Button>
            <Button onClick={() => inputDigit('4')}>4</Button>
            <Button onClick={() => inputDigit('5')}>5</Button>
            <Button onClick={() => inputDigit('6')}>6</Button>
            <Button variant="secondary" onClick={() => handleOperator('-')}>-</Button>
            <Button onClick={() => inputDigit('1')}>1</Button>
            <Button onClick={() => inputDigit('2')}>2</Button>
            <Button onClick={() => inputDigit('3')}>3</Button>
            <Button variant="secondary" onClick={() => handleOperator('+')}>+</Button>
            <Button onClick={() => inputDigit('0')} className="col-span-2">0</Button>
            <Button onClick={() => inputDecimal()}>.</Button>
            <Button variant="default" onClick={() => calculateResult()}>=</Button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground text-center">
            <p>Keyboard shortcuts: Numbers (0-9), Operators (+, -, *, /, %), Enter/= (calculate), Esc (clear), Backspace (delete)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AgeCalculatorTab = () => {
  const [birthDate, setBirthDate] = useState<string>('');
  const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);
  const [error, setError] = useState<string>('');

  const calculateAge = () => {
    try {
      setError('');
      if (!birthDate) { setError('Please enter a birth date'); return; }
      const [day, month, year] = birthDate.split('-');
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isValid(parsedDate)) { setError('Invalid date format. Please use DD-MM-YYYY'); return; }
      if (parsedDate > new Date()) { setError('Birth date cannot be in the future'); return; }
      const today = new Date();
      const years = differenceInYears(today, parsedDate);
      const dateAtExactYears = new Date(parsedDate);
      dateAtExactYears.setFullYear(parsedDate.getFullYear() + years);
      const months = differenceInMonths(today, dateAtExactYears);
      const dateAtExactYearsAndMonths = new Date(dateAtExactYears);
      dateAtExactYearsAndMonths.setMonth(dateAtExactYears.getMonth() + months);
      const days = differenceInDays(today, dateAtExactYearsAndMonths);
      setAge({ years, months, days });
    } catch (err) {
      console.error('Error calculating age:', err);
      setError('Failed to calculate age');
    }
  };

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Age Calculator</CardTitle>
          <CardDescription>Enter a birth date to calculate age (DD-MM-YYYY)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input id="birthDate" type="text" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="DD-MM-YYYY" />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button onClick={calculateAge} className="w-full">Calculate Age</Button>
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
  );
};

const CalculatorPage = () => {
  return (
    <PageWrapper 
      title="Calculator" 
      subtitle="Calculator & Age Calculator"
      icon={<CalculatorIcon size={24} />}
    >
      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="age-calculator">Age Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value="calculator">
          <CalculatorTab />
        </TabsContent>
        <TabsContent value="age-calculator">
          <AgeCalculatorTab />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};

export default CalculatorPage;
