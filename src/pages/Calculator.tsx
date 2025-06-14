
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageWrapper from '@/components/layout/PageWrapper';
import { Calculator as CalculatorIcon } from 'lucide-react';

const Calculator = () => {
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
    if (firstOperand === null) {
      return secondOperand;
    }

    switch (op) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return firstOperand / secondOperand;
      case '%':
        return firstOperand % secondOperand;
      default:
        return secondOperand;
    }
  };

  const calculateResult = () => {
    if (firstOperand === null || operator === null) {
      return;
    }

    const inputValue = parseFloat(display);
    const result = performCalculation(operator, inputValue);
    
    setDisplay(String(result));
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;

      // Prevent default behavior for calculator keys
      if (/[0-9+\-*/.%=]/.test(key) || key === 'Enter' || key === 'Escape' || key === 'Backspace') {
        event.preventDefault();
      }

      // Handle number keys
      if (/[0-9]/.test(key)) {
        inputDigit(key);
      }
      // Handle decimal point
      else if (key === '.') {
        inputDecimal();
      }
      // Handle operators
      else if (key === '+') {
        handleOperator('+');
      }
      else if (key === '-') {
        handleOperator('-');
      }
      else if (key === '*') {
        handleOperator('*');
      }
      else if (key === '/') {
        handleOperator('/');
      }
      else if (key === '%') {
        handleOperator('%');
      }
      // Handle equals/enter
      else if (key === '=' || key === 'Enter') {
        calculateResult();
      }
      // Handle clear
      else if (key === 'Escape' || key === 'c' || key === 'C') {
        clear();
      }
      // Handle backspace (delete last digit)
      else if (key === 'Backspace') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [display, firstOperand, operator, waitingForSecondOperand]);

  return (
    <PageWrapper 
      title="Calculator" 
      subtitle="Perform basic arithmetic operations"
      icon={<CalculatorIcon size={24} />}
    >
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input 
                value={display}
                readOnly
                className="text-right text-xl py-6 font-mono bg-background"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" onClick={() => clear()}>C</Button>
              <Button variant="outline" onClick={() => handleOperator('%')}>%</Button>
              <Button variant="outline" onClick={() => {
                const value = parseFloat(display);
                setDisplay(String(-value));
              }}>+/-</Button>
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
    </PageWrapper>
  );
};

export default Calculator;
