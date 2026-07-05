import { useEffect, useRef } from 'react';
import { LiquidGlass } from '@ybouane/liquidglass';
import { Sparkles, Droplets, Palette } from 'lucide-react';

interface Props {
  enabled: boolean;
}

/**
 * Real @ybouane/liquidglass WebGL preview. Glass elements MUST be direct
 * children of the root — we scope this component's own container as the
 * root so it never conflicts with the rest of the app.
 */
const LQGlassPreview = ({ enabled }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const glassRefs = useRef<Array<HTMLDivElement | null>>([]);
  const instanceRef = useRef<Awaited<ReturnType<typeof LiquidGlass.init>> | null>(null);

  useEffect(() => {
    let disposed = false;
    async function boot() {
      if (!enabled || !rootRef.current) return;
      const glassEls = glassRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!glassEls.length) return;
      // WebGL may be unavailable in some environments — fail gracefully.
      try {
        const inst = await LiquidGlass.init({
          root: rootRef.current,
          glassElements: glassEls,
          defaults: { blurAmount: 0.2, cornerRadius: 20, refraction: 0.7, chromAberration: 0.06, edgeHighlight: 0.15 },
        });
        if (disposed) inst.destroy();
        else instanceRef.current = inst;
      } catch (e) {
        console.warn('LQ Glass unavailable:', e);
      }
    }
    boot();
    return () => {
      disposed = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [enabled]);

  return (
    <div
      ref={rootRef}
      className="relative rounded-2xl p-6 overflow-hidden min-h-[220px]"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--primary)/0.6), hsl(var(--accent)/0.4) 40%, hsl(var(--primary)/0.3) 80%), radial-gradient(circle at 20% 20%, hsl(var(--accent)/0.5), transparent 50%)',
      }}
    >
      {/* Background text so the refraction has something to bend */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <p className="text-4xl md:text-6xl font-black text-white/30 tracking-tight">LQ&nbsp;GLASS</p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Sparkles className="h-4 w-4" />, title: 'Frosted Cards', desc: 'Translucent surfaces' },
          { icon: <Droplets className="h-4 w-4" />, title: 'Blur Effects', desc: 'Background blur & glow' },
          { icon: <Palette className="h-4 w-4" />, title: 'Glass Borders', desc: 'Light-refracting edges' },
        ].map((c, i) => (
          <div
            key={i}
            ref={(el) => (glassRefs.current[i] = el)}
            className="rounded-xl p-4"
            style={
              enabled
                ? { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)' }
                : { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }
            }
          >
            <div className="w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center mb-2 text-white">
              {c.icon}
            </div>
            <p className="text-sm font-semibold text-white drop-shadow">{c.title}</p>
            <p className="text-xs text-white/80 mt-1 drop-shadow">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LQGlassPreview;