import { auth } from "@/auth";
import { redirect } from "next/navigation";

const Home = async () => {
  const session = await auth();

  if (session) {
    redirect("/home");
  }

  return redirect("/auth");
};

export default Home;
