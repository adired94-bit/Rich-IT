/** Bilingual document/UI labels shared between the PDF generator and the public approval page. */
export const DOC_LABELS = {
  he: {
    title: "דף שירות / סיכום ביצוע", docNumber: "מסמך מס'", date: "תאריך", client: "לקוח", contact: "איש קשר",
    phone: "טלפון", address: "כתובת", performer: "מבצע", description: "תיאור", qty: "כמות", unitPrice: "מחיר יחידה",
    total: "סה\"כ", subtotal: "סכום ביניים", discount: "הנחה", vat: (r: number) => `מע"מ (${Math.round(r * 100)}%)`,
    grandTotal: "סה\"כ לתשלום", summary: "סיכום ביצוע", nextSteps: "המשך טיפול", timeSpent: "זמן עבודה",
    terms: "תנאים", termsText: "המחירים בש\"ח וכוללים מע\"מ כמפורט. התשלום בהתאם לתנאי ההתקשרות. אחריות על ציוד לפי תנאי היצרן. אישור המסמך מהווה הסכמה לביצוע העבודה ולחיוב בהתאם.",
    clientSignature: "חתימת הלקוח", engineerSignature: "חתימת המבצע", signedDigitally: (d: string) => `נחתם דיגיטלית ב-${d}`,
    vatId: "ח.פ", hours: "שעות",
  },
  ru: {
    title: "Акт выполненных работ", docNumber: "Документ №", date: "Дата", client: "Клиент", contact: "Контакт",
    phone: "Телефон", address: "Адрес", performer: "Исполнитель", description: "Описание", qty: "Кол-во", unitPrice: "Цена",
    total: "Сумма", subtotal: "Промежуточный итог", discount: "Скидка", vat: (r: number) => `НДС (${Math.round(r * 100)}%)`,
    grandTotal: "Итого к оплате", summary: "Описание работ", nextSteps: "Дальнейшие шаги", timeSpent: "Затраченное время",
    terms: "Условия", termsText: "Цены указаны в шекелях, НДС включён. Оплата согласно условиям договора. Гарантия на оборудование по условиям производителя. Подтверждение документа означает согласие с работами и оплатой.",
    clientSignature: "Подпись клиента", engineerSignature: "Подпись исполнителя", signedDigitally: (d: string) => `Подписано цифровой подписью ${d}`,
    vatId: "Рег. №", hours: "ч",
  },
} as const;

export type DocLang = "he" | "ru";
