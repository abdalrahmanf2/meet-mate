"use server";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

export const getUserById = async (userId: string) => {
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

  return user || null;
};
