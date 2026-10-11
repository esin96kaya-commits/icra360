export const BRAND = {
  productName: "İcra360",
  codeName: "Icra360",
  packageScope: "@icra360",
  slogan: "Personel icra süreçleri tek yerde.",
  description: "İşverenler için personel icra tebligatı, cevap yazısı ve maaş kesintisi takip sistemi.",
  mailFromName: "İcra360",
  documentHeader: "İcra360",
} as const;

/** Phase 1 placeholder: outbound mail is not sent yet. Sender display name is İcra360. */
export function mailFromName(): string {
  const fromEnv = process.env.MAIL_FROM_NAME?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : BRAND.mailFromName;
}

export const BRAND_COLORS = {
  navy: "#142B4A",
  teal: "#16A6A1",
  background: "#F4F7F9",
  text: "#18212F",
  success: "#238A65",
  warning: "#E8A23A",
  error: "#C94A4A",
} as const;
