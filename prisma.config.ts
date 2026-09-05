import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Миграции и seed требуют реальный DATABASE_URL.
    // Плейсхолдер нужен, чтобы `prisma generate` работал без окружения
    // (например, на этапе npm install в Vercel до объявления env-переменных).
    url: process.env.DATABASE_URL ?? "postgresql://u:p@localhost:5432/placeholder",
  },
});
