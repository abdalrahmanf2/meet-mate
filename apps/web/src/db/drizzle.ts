import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users } from "./schema/users";
import { meetings } from "./schema/meetings";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema: { ...users, ...meetings } });
