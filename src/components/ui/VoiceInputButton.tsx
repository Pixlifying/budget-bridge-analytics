import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  lang?: string;
  className?: string;
  append?: boolean;
}

const VoiceInputButton = ({
  onTranscript,
  currentValue = '',
  lang = 'en-IN',
  className,
  append = true,
}: VoiceInputButtonProps) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const supported =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop?.(); } catch {}
    };
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      try { recognitionRef.current?.stop?.(); } catch {}
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ').trim();
      if (!text) return;
      const base = currentValue?.toString() || '';
      const next = append && base ? `${base} ${text}`.trim() : text;
      onTranscript(next);
    };
    rec.onerror = (e: any) => {
      setListening(false);
      if (e?.error && e.error !== 'aborted' && e.error !== 'no-speech') {
        toast.error(`Voice input error: ${e.error}`);
      }
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (err) {
      setListening(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={listening ? 'Stop voice input' : 'Speak to fill'}
      className={cn(
        'h-8 w-8 shrink-0',
        listening && 'text-red-500 animate-pulse',
        className,
      )}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};

export default VoiceInputButton;