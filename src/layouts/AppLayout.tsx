import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

function AppLayoutShell() {
  const { isMobile, openMobile } = useSidebar();

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {isMobile && !openMobile && (
          <SidebarTrigger
            className="fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full border border-border bg-background shadow-md"
            aria-label="Open menu"
          />
        )}
        <main className="flex-1 flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutShell />
    </SidebarProvider>
  );
}
