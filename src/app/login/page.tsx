import { LoginForm } from "./login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center grid-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/icons/icon-96.png" alt="Rich IT Solutions" width={56} height={56} className="rounded-2xl shadow-glow" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Rich IT Solutions</h1>
            <p className="text-xs text-muted-foreground">מערכת ניהול לקוחות ושירות</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
