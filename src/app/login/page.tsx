import { LoginForm } from "./login-form";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center grid-bg px-4 py-10">
      <div className="fixed top-4 end-4 z-10 flex gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/icons/icon-96.png" alt="Rich IT Solutions" width={56} height={56} className="rounded-2xl shadow-glow" />
          <h1 className="text-lg font-bold text-foreground">Rich IT Solutions</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
