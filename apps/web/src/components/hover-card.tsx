import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface HoverCardProps {
  title: string;
  url: string;
  children: ReactNode;
}

const HoverCard = ({ title, url, children }: HoverCardProps) => {
  return (
    <Link href={url}>
      <Card className="flex flex-col justify-between h-full group hover:border-zinc-500 transition">
        <CardHeader className="text-xl font-semibold">{title}</CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground">{children}</p>
        </CardContent>
        <CardFooter>
          <ArrowRight className="ml-auto group-hover:translate-x-1 transition-transform" />
        </CardFooter>
      </Card>
    </Link>
  );
};

export default HoverCard;
