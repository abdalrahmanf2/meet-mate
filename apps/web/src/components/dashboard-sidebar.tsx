"use client";

import { cn } from "@/lib/utils";
import { DoorOpen, Home, Plus } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { usePathname } from "next/navigation";

interface DashboardSidebarProps {
  className?: string;
}

const SIDEBAR_ITEMS = [
  {
    name: "Home",
    url: "/home",
    icon: Home,
  },
  {
    name: "Create Meetings",
    url: "/create-meeting",
    icon: Plus,
  },
  {
    name: "Join Meetings",
    url: "/join-meeting",
    icon: DoorOpen,
  },
];

const DashboardSidebar = ({ className }: DashboardSidebarProps) => {
  const path = usePathname();

  return (
    <aside className={cn("flex md:flex-col gap-4", className)}>
      {SIDEBAR_ITEMS.map((item) => (
        <Link
          key={item.name}
          href={item.url}
          className={cn(
            buttonVariants({
              variant: path === item.url ? "secondary" : "ghost",
              size: "lg",
            }),
            "flex-1 md:flex-none md:justify-start font-semibold",
            path !== item.url && "text-muted-foreground"
          )}
        >
          <item.icon />
          <span className="hidden md:block">{item.name}</span>
        </Link>
      ))}
    </aside>
  );
};

export default DashboardSidebar;
