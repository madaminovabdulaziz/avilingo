'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { 
  Plane, 
  Home, 
  BookOpen, 
  Headphones, 
  Mic, 
  TrendingUp, 
  User, 
  LogOut, 
  Menu,
  Settings,
  HelpCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FullPageLoading } from '@/components/ui/query-states';
import { PageErrorBoundary } from '@/components/ui/error-boundary';
import { PageTransition } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { getProgressStats, getReviewQueue } from '@/lib/api';

// =============================================================================
// Types
// =============================================================================

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

// =============================================================================
// Navigation Items
// =============================================================================

const NAV_ITEMS: NavItem[] = [
  { href: '/app/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/app/vocabulary', icon: BookOpen, label: 'Vocabulary' },
  { href: '/app/listening', icon: Headphones, label: 'Listening' },
  { href: '/app/speaking', icon: Mic, label: 'Speaking' },
  { href: '/app/progress', icon: TrendingUp, label: 'Progress' },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/app/settings', icon: Settings, label: 'Settings' },
];

// =============================================================================
// Loading Screen (using centralized component)
// =============================================================================

function LoadingScreen() {
  return <FullPageLoading message="Loading AviLingo..." showLogo />;
}

// =============================================================================
// Streak Display Component
// =============================================================================

interface StreakDisplayProps {
  streak: number;
  isCollapsed: boolean;
}

function StreakDisplay({ streak, isCollapsed }: StreakDisplayProps) {
  const getStreakColor = () => {
    if (streak === 0) return 'text-muted-foreground';
    if (streak >= 30) return 'text-purple-500';
    if (streak >= 14) return 'text-blue-500';
    if (streak >= 7) return 'text-green-500';
    return 'text-orange-500';
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3">
        <Flame className={cn('w-5 h-5', getStreakColor())} />
        <span className={cn('text-xs font-bold mt-1', getStreakColor())}>
          {streak}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
        <Flame className={cn('w-5 h-5', getStreakColor())} />
      </div>
      <div>
        <p className={cn('text-lg font-bold', getStreakColor())}>{streak}</p>
        <p className="text-xs text-muted-foreground">day streak</p>
      </div>
    </div>
  );
}

// =============================================================================
// Sidebar Nav Item
// =============================================================================

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarNavItem({ item, isActive, isCollapsed }: SidebarNavItemProps) {
  const Icon = item.icon;
  
  return (
    <Link href={item.href}>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-primary/10',
          isActive && 'bg-primary/15 text-primary border-l-2 border-primary ml-[-1px]',
          !isActive && 'text-muted-foreground hover:text-foreground',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <div className="relative">
          <Icon className="w-5 h-5 flex-shrink-0" />
          {isCollapsed && item.badge != null && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </div>
        
        {!isCollapsed && (
          <>
            <span className="flex-1 font-medium text-sm">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <Badge variant="secondary" size="sm" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

// =============================================================================
// Mobile Nav Item
// =============================================================================

interface MobileNavItemProps {
  item: NavItem;
  isActive: boolean;
}

function MobileNavItem({ item, isActive }: MobileNavItemProps) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 transition-colors relative',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {item.badge != null && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
        )}
      </div>
      <span className="text-[10px] font-medium">{item.label}</span>
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
      )}
    </Link>
  );
}

// =============================================================================
// App Layout
// =============================================================================

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [vocabDue, setVocabDue] = useState(0);
  const [notifications, setNotifications] = useState(0);

  // Fetch streak and due items
  const fetchStats = useCallback(async () => {
    try {
      const [statsData, reviewData] = await Promise.all([
        getProgressStats().catch(() => null),
        getReviewQueue().catch(() => null),
      ]);
      
      if (statsData?.streak) {
        setStreak(statsData.streak.current_streak);
      }
      if (reviewData) {
        setVocabDue(reviewData.total_due || 0);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Add badge to vocabulary nav item
  const navItemsWithBadges = NAV_ITEMS.map(item => ({
    ...item,
    badge: item.href === '/app/vocabulary' ? vocabDue : undefined,
  }));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40',
          'bg-card border-r border-border transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'h-16 flex items-center border-b border-border',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4'
        )}>
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg">AviLingo</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItemsWithBadges.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              isCollapsed={sidebarCollapsed}
            />
          ))}
          
          {/* Divider */}
          <div className="my-4 border-t border-border" />
          
          {/* Secondary nav */}
          {SECONDARY_NAV.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              isCollapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* Streak Display */}
        <div className="border-t border-border">
          <StreakDisplay streak={streak} isCollapsed={sidebarCollapsed} />
        </div>

        {/* Collapse Button */}
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'w-full gap-2',
              sidebarCollapsed && 'justify-center'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Mobile Logo & Menu */}
            <div className="flex items-center gap-3 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Link href="/app/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plane className="w-4 h-4 text-primary" />
                </div>
                <span className="font-bold">AviLingo</span>
              </Link>
            </div>

            {/* Page Title (Desktop) */}
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold capitalize">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h1>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {notifications > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Streak (Mobile) */}
              <div className="md:hidden flex items-center gap-1 px-2">
                <Flame className={cn(
                  'w-4 h-4',
                  streak > 0 ? 'text-orange-500' : 'text-muted-foreground'
                )} />
                <span className={cn(
                  'text-sm font-bold',
                  streak > 0 ? 'text-orange-500' : 'text-muted-foreground'
                )}>
                  {streak}
                </span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user ? getInitials(user.full_name || user.email) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
                      {user?.full_name || user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.full_name || 'User'}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/help" className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Help & Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">
          <PageErrorBoundary>
            <PageTransition key={pathname}>
              {children}
            </PageTransition>
          </PageErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navItemsWithBadges.map((item) => (
            <MobileNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
            />
          ))}
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-card border-r border-border md:hidden animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <Link href="/app/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-lg">AviLingo</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user ? getInitials(user.full_name || user.email) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-2 space-y-1">
              {navItemsWithBadges.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                  isCollapsed={false}
                />
              ))}
              
              <div className="my-4 border-t border-border" />
              
              {SECONDARY_NAV.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  isCollapsed={false}
                />
              ))}
              
              <Link href="/app/profile">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10">
                  <User className="w-5 h-5" />
                  <span className="font-medium text-sm">Profile</span>
                </div>
              </Link>
              
              <Link href="/app/help">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium text-sm">Help & Support</span>
                </div>
              </Link>
            </nav>

            {/* Streak at bottom */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-border">
              <StreakDisplay streak={streak} isCollapsed={false} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
