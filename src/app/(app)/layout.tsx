import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/lib/supabase/server";
import { QuickRecordDialog } from "@/features/voice/quick-record-dialog";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh grid-bg">
      <Sidebar />
      <div className="lg:ps-64">
        <Header email={user?.email} />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
      <QuickRecordDialog />
    </div>
  );
}
