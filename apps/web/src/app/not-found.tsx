import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  return (
    <main className="flex min-h-[calc(80vh)] items-center justify-center">
      <Card className="sm:min-w-[512px] mx-auto flex flex-col items-center">
        <CardHeader>
          <TriangleAlert size={96} />
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-xl">Not Found</h3>
        </CardContent>
        <CardFooter>
          <Link href="/" className={buttonVariants()}>
            Return to Home
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
};

export default NotFound;
