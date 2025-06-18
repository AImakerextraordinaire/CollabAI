

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, Settings, Archive, BarChart3, Sparkles, Bot, BrainCircuit, CreditCard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User } from "@/api/entities";
import { syncStripeSubscription } from "@/api/functions";

const mainNavItems = [
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
  {
    title: "Billing",
    url: createPageUrl("Billing"),
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

const chatNavItems = [
  {
    title: "Collaborative Chat",
    url: createPageUrl("Chat"),
    icon: MessageSquare,
  },
  {
    title: "Avatar Chat",
    url: createPageUrl("AvatarChat"),
    icon: BrainCircuit,
  },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        // First, sync with stripe to ensure status is up-to-date
        const { data: syncedUser } = await syncStripeSubscription();
        setUser(syncedUser);
      } catch (error) {
        console.log("Not authenticated", error); // Log error for debugging
        setUser(null); // Ensure user is null if not authenticated
      }
    };
    loadUser();
  }, []);

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --background: 8 8 16;
            --foreground: 250 250 250;
            --card: 12 12 20;
            --card-foreground: 250 250 250;
            --popover: 12 12 20;
            --popover-foreground: 250 250 250;
            --primary: 142 78 255;
            --primary-foreground: 255 255 255;
            --secondary: 30 30 42;
            --secondary-foreground: 250 250 250;
            --muted: 20 20 28;
            --muted-foreground: 161 161 170;
            --accent: 30 30 42;
            --accent-foreground: 250 250 250;
            --destructive: 239 68 68;
            --destructive-foreground: 250 250 250;
            --border: 30 30 42;
            --input: 30 30 42;
            --ring: 142 78 255;
            --radius: 0.75rem;
          }
          
          body {
            background: linear-gradient(135deg, rgb(8, 8, 16) 0%, rgb(16, 12, 32) 100%);
            min-height: 100vh;
          }
          
          .glass-effect {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #8E4EFF 0%, #4ECFFF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}
      </style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Sidebar className="border-r border-white/10 glass-effect">
          <SidebarHeader className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg gradient-text">CollabAI</h2>
                <p className="text-xs text-gray-400">Multi-Model Intelligence</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-2">
                Chat Modes
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {chatNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-white/10 hover:text-white transition-all duration-300 rounded-xl ${
                          location.pathname === item.url ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-white/10' : 'text-gray-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 py-2 mt-4">
                Application
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-white/10 hover:text-white transition-all duration-300 rounded-xl ${
                          location.pathname === item.url ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-white/10' : 'text-gray-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl glass-effect">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {user?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400 truncate">
                    {user?.subscription_status === 'pro' ? 'Pro User' : 'Free User'}
                  </p>
                  {user?.is_admin && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-white/10 p-2 rounded-lg transition-colors duration-200 text-white" />
              <h1 className="text-xl font-semibold text-white">CollabAI</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

