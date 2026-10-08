import { useState } from 'react';
import { MorphGlyph } from './MorphGlyph';

// Mismo formato que maskEmail del servidor: "jo***@gmail.com".
const mask = (email: string) => {
  const [user = '', domain = ''] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
};

// Muestra el mail oculto por defecto; el ojito lo revela (útil al compartir pantalla).
export function MaskedEmail({ email }: { email: string }) {
  const [visible, setVisible] = useState(false);
  if (!email) return <strong>Sin configurar</strong>;
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <strong>{visible ? email : mask(email)}</strong>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar mail' : 'Mostrar mail'}
        aria-pressed={visible}
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors duration-500 hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
      >
        <MorphGlyph name={visible ? 'eyeOff' : 'eye'} size={16} />
      </button>
    </span>
  );
}
