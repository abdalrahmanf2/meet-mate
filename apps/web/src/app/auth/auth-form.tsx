"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { login } from "./actions";
import LoadingSpinner from "@/components/loading-spinner";

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form action={login} onSubmit={() => setIsLoading(true)} className="w-full">
      <Button className="w-full" disabled={isLoading}>
        {isLoading && <LoadingSpinner />}
        <FaGithub />
        Sign In with GitHub
      </Button>
    </form>
  );
};

export default AuthForm;
