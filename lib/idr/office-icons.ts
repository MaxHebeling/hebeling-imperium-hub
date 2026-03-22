import {
  Crown,
  Handshake,
  Landmark,
  Palette,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const DEFAULT_IDR_OFFICE_ICON = ShieldCheck;

export const IDR_OFFICE_ICONS: Record<string, LucideIcon> = {
  ceo: Crown,
  presidente: Landmark,
  "vice-presidente": ShieldCheck,
  finanzas: Wallet,
  "protocolo-y-avanzada": Handshake,
  "publicidad-y-diseno": Palette,
};
