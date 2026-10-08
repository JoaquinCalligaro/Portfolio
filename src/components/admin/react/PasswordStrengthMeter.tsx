import { cn } from '@/lib/utils';
import type { PasswordStrength, Score } from '@/lib/admin-auth/password-strength';
import { MorphGlyph } from './MorphGlyph';

const SEGMENTS = 4;

const TONE: Record<Score, { bar: string; text: string }> = {
  0: { bar: 'bg-red-400', text: 'text-red-300' },
  1: { bar: 'bg-red-400', text: 'text-red-300' },
  2: { bar: 'bg-amber-300', text: 'text-amber-200' },
  3: { bar: 'bg-cyan-400', text: 'text-cyan-300' },
  4: { bar: 'bg-cyan-300', text: 'text-cyan-200' },
};

type Props = { password: string; strength: PasswordStrength };

export function PasswordStrengthMeter({ password, strength }: Props) {
  const empty = password.length === 0;
  const filled = empty ? 0 : Math.max(strength.score, 1);
  const tone = TONE[strength.score];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Seguridad de la contraseña</span>
          <span
            aria-live="polite"
            className={cn(
              'text-xs font-medium transition-colors duration-500 motion-reduce:transition-none',
              empty ? 'text-gray-400' : tone.text
            )}
          >
            {empty ? 'Sin definir' : strength.label}
          </span>
        </div>
        <div
          role="meter"
          aria-label="Seguridad de la contraseña"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={empty ? 0 : strength.score}
          aria-valuetext={empty ? 'Sin definir' : strength.label}
          className="flex gap-1.5"
        >
          {Array.from({ length: SEGMENTS }, (_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-500 motion-reduce:transition-none',
                index < filled ? tone.bar : 'bg-white/10'
              )}
            />
          ))}
        </div>
      </div>

      <ul className="m-0 grid list-none gap-x-4 gap-y-1.5 p-0 sm:grid-cols-2">
        {strength.checks.map((check) => {
          const state = check.passed
            ? 'passed'
            : !empty && check.required
              ? 'failed'
              : 'idle';
          return (
            <li
              key={check.id}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors duration-500 motion-reduce:transition-none',
                state === 'passed' && 'text-cyan-300',
                state === 'failed' && 'text-red-300',
                state === 'idle' && 'text-gray-400'
              )}
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {state === 'passed' && <MorphGlyph name="check" size={14} />}
                {state === 'failed' && <MorphGlyph name="x" size={14} />}
                {state === 'idle' && (
                  <span className="size-1.5 rounded-full bg-gray-500" aria-hidden />
                )}
              </span>
              <span>
                {check.label}
                <span className="sr-only">
                  {state === 'passed' ? ': cumple' : ': no cumple'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
