import { auth } from "@/auth";
import Logo from "@/components/logo";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import AuthForm from "./auth-form";

const Auth = async () => {
  const session = await auth();

  if (session) {
    return redirect("/home");
  }

  return (
    <div className="min-h-[calc(100vh-1px)] flex flex-col items-center justify-center">
      <Card className="sm:min-w-[512px]">
        <CardHeader>
          <Logo />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">Sign In</h3>
          <p className="text-muted-foreground">
            to continue to <span className="font-semibold">meetmate</span>
          </p>
        </CardContent>
        <CardFooter>
          <AuthForm />
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
