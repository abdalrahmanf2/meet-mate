import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Logo from "./logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeftSquare } from "lucide-react";
import { Button } from "./ui/button";

const logout = async () => {
  "use server";
  await signOut();
  redirect("/auth");
};

const Navbar = async () => {
  const session = await auth();

  if (!session) {
    redirect("/auth");
  }

  return (
    <nav className="flex items-center justify-between">
      <Link href="/home">
        <Logo />
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="size-8 rounded-full">
            <AvatarImage
              src={session.user?.image as string}
              alt="User Profile Picture"
            />
            <AvatarFallback></AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="font-normal">
            <p>{session.user?.name}</p>
            <p className="text-muted-foreground">{session.user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logout} className="w-full">
              <Button
                className="justify-start w-full h-4"
                size="sm"
                variant="ghost"
              >
                <ArrowLeftSquare />
                Log Out
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default Navbar;
