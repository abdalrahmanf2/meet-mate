"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import LoadingSpinner from "@/components/loading-spinner";
import { createMeeting } from "@/data/meetings";

const CreateMeetingFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name is required" })
    .max(50, { message: "Name can't be more than 50 characters" }),
  description: z.string().max(256).optional(),
});

export type TCreateMeetingFormSchema = z.infer<typeof CreateMeetingFormSchema>;

const CreateMeetingForm = () => {
  const form = useForm<TCreateMeetingFormSchema>({
    resolver: zodResolver(CreateMeetingFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: TCreateMeetingFormSchema) => {
    setIsLoading(true);
    await createMeeting(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="A very Important Meeting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A very important meeting for important people just like me and you ;)"
                  className="h-32 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <LoadingSpinner />}
          Create Meeting
        </Button>
      </form>
    </Form>
  );
};

export default CreateMeetingForm;
