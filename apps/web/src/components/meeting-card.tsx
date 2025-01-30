import { Calendar, Copy } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const MeetingCard = () => {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Meeting Name</CardTitle>
        <Badge className="items-center gap-2 w-fit">
          <Calendar size={16} />
          2025-01-25
        </Badge>
      </CardHeader>
      <CardContent className="flex">
        <p className="text-muted-foreground">Meeting Description</p>
      </CardContent>
      <CardFooter>
        <Button disabled className="font-semibold ml-auto" size="sm">
          <Copy />
          Copy Meeting&apos;s Link
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MeetingCard;
