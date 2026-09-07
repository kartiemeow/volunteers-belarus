-- Чистим пользователей, созданных до ввода кода (аккаунты появляются только после подтверждения почты)
DELETE FROM "User" WHERE "emailVerified" IS NULL;

-- Удаляем неактуальные записи верификации
DELETE FROM "EmailVerification";

-- AlterTable: до подтверждения регистрация хранится здесь
ALTER TABLE "EmailVerification" ADD COLUMN "name" TEXT NOT NULL;
ALTER TABLE "EmailVerification" ADD COLUMN "passwordHash" TEXT NOT NULL;
ALTER TABLE "EmailVerification" ADD COLUMN "role" "Role" NOT NULL;
ALTER TABLE "EmailVerification" ADD COLUMN "phone" TEXT;
ALTER TABLE "EmailVerification" ADD COLUMN "city" TEXT;