import { MessageCircle, Phone } from 'lucide-react';

export interface ContactCustomerProps {
  phone?: string;
  className?: string;
}

export function toWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

const LINK_BASE_CLASSES =
  'inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-2';

const CALL_LINK_CLASSES = `${LINK_BASE_CLASSES} bg-[#2D3139] text-[#E0E2E6] hover:bg-[#3D4149] hover:text-white focus:ring-[#2D3139]`;

const WHATSAPP_LINK_CLASSES = `${LINK_BASE_CLASSES} bg-[#22C55E15] text-[#22C55E] border border-[#22C55E30] hover:bg-[#22C55E25] focus:ring-[#22C55E]`;

const NO_PHONE_CLASSES = `${LINK_BASE_CLASSES} cursor-not-allowed bg-[#1C2028] border border-[#2D3139] text-[#8E949F] opacity-60`;

export function ContactCustomer({ phone, className = '' }: ContactCustomerProps) {
  const trimmedPhone = phone?.trim() ?? '';
  const whatsAppNumber = toWhatsAppNumber(trimmedPhone);
  const hasPhone = whatsAppNumber.length > 0;

  if (!hasPhone) {
    return (
      <span
        className={`${NO_PHONE_CLASSES} ${className}`}
        title="No hay teléfono registrado para contactar al cliente"
      >
        <Phone className="h-4 w-4 shrink-0" />
        Sin teléfono registrado
      </span>
    );
  }

  const phoneHref = `tel:${trimmedPhone.replace(/\s+/g, '')}`;

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <a href={phoneHref} className={CALL_LINK_CLASSES}>
        <Phone className="h-4 w-4 shrink-0" />
        Llamar
      </a>
      <a
        href={`https://wa.me/${whatsAppNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className={WHATSAPP_LINK_CLASSES}
      >
        <MessageCircle className="h-4 w-4 shrink-0" />
        WhatsApp
      </a>
    </div>
  );
}