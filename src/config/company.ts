/** Company profile used in documents, PDFs and WhatsApp messages. Override via env. */
export const company = {
  name: process.env.COMPANY_NAME ?? "Rich IT Solutions",
  tagline: {
    he: "תשתיות IT, סייבר וענן ברמה ארגונית",
    ru: "IT-инфраструктура, кибербезопасность и облако корпоративного уровня",
  },
  phone: process.env.COMPANY_PHONE ?? "",
  email: process.env.COMPANY_EMAIL ?? "",
  address: process.env.COMPANY_ADDRESS ?? "",
  vatId: process.env.COMPANY_VAT_ID ?? "",
  engineerName: process.env.ENGINEER_NAME ?? "",
  website: process.env.COMPANY_WEBSITE ?? "",
  defaultVatRate: Number(process.env.DEFAULT_VAT_RATE ?? 0.18),
  currency: "ILS",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
