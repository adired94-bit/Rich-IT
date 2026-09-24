import type { Service } from "@/db/schema";

export interface CatalogItemForPrompt {
  id: string;
  titleHe: string;
  titleRu: string;
  keywords: string[];
  defaultPrice: number;
  billingType: string;
  unit: string;
}

export function toCatalogPromptItem(s: Service): CatalogItemForPrompt {
  return {
    id: s.id,
    titleHe: s.titleHe,
    titleRu: s.titleRu,
    keywords: s.keywords,
    defaultPrice: s.defaultPrice,
    billingType: s.billingType,
    unit: s.unit,
  };
}

export function buildVoiceExtractionSystemPrompt(): string {
  return `אתה עוזר AI של "Rich IT Solutions", חברת שירותי IT, תשתיות ואבטחת מידע. \
המהנדס מקליט יומן עבודה קולי בעברית, ברוסית, או בשילוב של השתיים, מיד לאחר ביקור אצל לקוח או עבודה מרוחקת. \
המשימה שלך: לתמלל את התוכן ולחלץ ממנו רשומת עבודה מובנית.

הנחיות:
1. זהה את הלקוח שהוזכר בהקלטה (שם החברה או איש הקשר) והתאם אותו לרשימת הלקוחות שסופקה, אם אפשר. אם לא בטוח, החזר null.
2. זהה כל פעולה/שירות/חומר שהוזכר והתאם אותו לפריט המתאים ביותר במחירון שסופק, לפי הקטגוריה, השם ומילות המפתח. אם המהנדס ציין מחיר מפורש או הנחה, השתמש בו במקום מחיר ברירת המחדל וציין זאת ב-customPriceReason.
3. אם לא נמצאה התאמה טובה במחירון, החזר serviceId as null וצור שורה מותאמת אישית עם תיאור, יחידה ומחיר סביר על סמך ההקשר.
4. תרגם כל תיאור שורה גם לרוסית (descriptionRu) בצורה מקצועית ותמציתית, גם אם ההקלטה הייתה בעברית בלבד (ולהפך).
5. כתוב כותרת קצרה (title) וסיכום ביצוע מקצועי בעברית (summaryHe) ותרגומו לרוסית (summaryRu), בסגנון פורמלי המתאים למסמך ללקוח.
6. זהה זמן עבודה כולל בדקות אם הוזכר (למשל "שעתיים" = 120), אחרת 0.
7. זהה משימות המשך או עבודה עתידית שהוזכרה (nextSteps), אחרת null.
8. קבע את השפה שזוהתה בהקלטה (he / ru / mixed / other).
9. קבע רמת ביטחון כללית (confidence) בין 0 ל-1 לאיכות החילוץ.

החזר אך ורק מבנה JSON תואם לסכימה שסופקה. אל תמציא לקוחות או שירותים שלא הוזכרו בפועל.`;
}

export function buildVoiceExtractionUserMessage(opts: {
  transcript: string;
  catalog: CatalogItemForPrompt[];
  clients: { id: string; name: string }[];
  lockedClientName?: string | null;
}): string {
  const { transcript, catalog, clients, lockedClientName } = opts;
  return [
    lockedClientName
      ? `ההקלטה נעשתה מתוך תיק הלקוח "${lockedClientName}" — סמן clientMatchId בהתאם אם קיים ברשימה, אך עדיין נסה לזהות אזכור שם מפורש.`
      : "לא ידוע מראש עבור איזה לקוח ההקלטה — יש לזהות מהתמלול.",
    "",
    "רשימת לקוחות (id, name):",
    JSON.stringify(clients),
    "",
    "מחירון שירותים (id, titleHe, titleRu, keywords, defaultPrice, billingType, unit):",
    JSON.stringify(catalog),
    "",
    "תמלול ההקלטה:",
    "---",
    transcript,
    "---",
  ].join("\n");
}
