"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/layout/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/liabilities", label: "Liabilities", icon: CreditCard },
  { href: "/settings/integrations", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-sidebar lg:fixed lg:inset-y-0">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          Adam Finance
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        ))}
        <div
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          aria-disabled="true"
        >
          <BarChart3 className="h-4 w-4" aria-hidden />
          Analytics
          <span className="ml-auto text-xs">Soon</span>
        </div>
      </nav>
      <div className="border-t p-4 space-y-2">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </aside>
  );
}
