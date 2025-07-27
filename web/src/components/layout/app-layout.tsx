'use client';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import Header from '@/components/layout/header';
import { Home, Lightbulb, Wallet } from 'lucide-react';

export default function AppLayout({
  children,
  active,
}: {
  children: React.ReactNode;
  active: 'dashboard' | 'suggestion';
}) {
    const { isMobile } = useSidebar();
  return (
    <>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                    <Wallet className="h-6 w-6" />
                </div>
                 <h1 className="text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden">WalletWise AI</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard">
                        <SidebarMenuButton tooltip="Dashboard" isActive={active === 'dashboard'}>
                            <Home />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/suggestions">
                        <SidebarMenuButton tooltip="For You" isActive={active === 'suggestion'}>
                            <Lightbulb />
                            <span>For You</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header/>
        {children}
      </SidebarInset>
    </>
  );
}