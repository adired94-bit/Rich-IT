import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main dir="rtl" className="grid min-h-dvh place-items-center bg-background text-foreground px-6">
      <div className="glass max-w-sm rounded-xl p-8 text-center">
        <WifiOff className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h1 className="text-lg font-semibold">אין חיבור לאינטרנט</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rich IT Solutions ממשיכה לעבוד במצב לא מקוון. הנתונים יסונכרנו אוטומטית כשהחיבור יחזור.
        </p>
      </div>
    </main>
  );
}
