import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main dir="rtl" className="grid min-h-dvh place-items-center grid-bg px-6 text-center">
      <div>
        <p className="text-6xl font-bold text-primary">404</p>
        <p className="mt-2 text-sm text-muted-foreground">הדף המבוקש לא נמצא</p>
        <Button asChild className="mt-6">
          <Link href="/">חזרה לדשבורד</Link>
        </Button>
      </div>
    </main>
  );
}
