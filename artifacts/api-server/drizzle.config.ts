import type { Config } from "drizzle-kit";

export default {
  schema: ["./drizzle/migrations/*.sql"],
  out: "./drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
} as Config;
