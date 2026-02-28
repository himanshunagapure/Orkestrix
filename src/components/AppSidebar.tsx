import { PlusCircle, LayoutGrid, Settings, BookOpen, CreditCard, Loader2 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useCredits } from '@/hooks/useCredits';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const topItems = [
  { title: 'Create App', url: '/create', icon: PlusCircle },
  { title: 'Apps', url: '/apps', icon: LayoutGrid },
];

const bottomItems = [
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Documentation', url: '/docs', icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { data: credits, isLoading: creditsLoading } = useCredits();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight truncate">AI Screen Builder</span>
          )}
          {collapsed && (
            <span className="text-lg font-bold mx-auto">AI</span>
          )}
        </div>

        {/* Top nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Credits */}
        <div className="px-3 py-3 mx-2 mb-2 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-sidebar-primary shrink-0" />
            {!collapsed && <span className="text-xs font-medium">Credits</span>}
          </div>
          {!collapsed && (
            creditsLoading ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading...
              </div>
            ) : credits ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consumed</span>
                  <span className="font-medium">{credits.credits.total_consumed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium text-sidebar-primary">{credits.available_credits}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )
          )}
        </div>

        {/* Bottom nav */}
        <SidebarFooter>
          <SidebarMenu>
            {bottomItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <NavLink
                    to={item.url}
                    className="hover:bg-sidebar-accent/50"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <item.icon className="h-4 w-4 mr-2 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
