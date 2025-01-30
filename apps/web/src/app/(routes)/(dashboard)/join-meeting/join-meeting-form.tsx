"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DoorOpen } from "lucide-react";
import { useTransition } from "react";
import LoadingSpinner from "@/components/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { meetingExist } from "@/data/meetings";

const JoinMeetingFormSchema = z.object({
  code: z.string().uuid({ message: "this isn't a valid meeting code" }),
});

export type TJoinMeetingFormSchema = z.infer<typeof JoinMeetingFormSchema>;

const JoinMeetingForm = () => {
  const form = useForm<TJoinMeetingFormSchema>({
    resolver: zodResolver(JoinMeetingFormSchema),
    defaultValues: {
      code: "",
    },
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const onSubmit = async (values: TJoinMeetingFormSchema) => {
    startTransition(async () => {
      const exist = await meetingExist(values.code);
      if (exist) {
        router.replace(`/${values.code}`);
      } else {
        toast({ title: "Meeting not found!", variant: "destructive" });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-3/4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting Code</FormLabel>
              <div className="w-full flex gap-4">
                <FormControl>
                  <Input
                    placeholder="4d4ca334-db41-4718-ad41-e8bd0c7ab73e"
                    {...field}
                  />
                </FormControl>
                <Button className="min-w-32" type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <LoadingSpinner /> Joining...
                    </>
                  ) : (
                    <>
                      <DoorOpen />
                      Join Meeting
                    </>
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default JoinMeetingForm;
