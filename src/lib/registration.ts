import type { Role } from "@/generated/prisma/client";
import { transaction } from "@/lib/transaction";
import { ActionError } from "@/lib/action-result";
import { CODE_TTL_MS, MAX_ATTEMPTS, RESEND_COOLDOWN_MS, codesEqual, generateVerificationCode, hashVerificationCode } from "@/lib/email";

export type PendingRegistration = {
  name: string; passwordHash: string; role: Role; phone: string | null; city: string | null;
};

export async function prepareRegistrationCode(email: string, pending?: PendingRegistration) {
  const code = generateVerificationCode();
  await transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email } })) throw new ActionError("Пользователь с таким email уже зарегистрирован");
    const existing = await tx.emailVerification.findUnique({ where: { email } });
    if (!pending && (!existing?.passwordHash || !existing.name)) {
      throw new ActionError("Регистрация не найдена. Зарегистрируйтесь заново.");
    }
    const now = new Date();
    if (existing && now.getTime() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new ActionError("Подождите минуту перед повторной отправкой кода");
    }
    const data = {
      ...(pending ?? { name: existing!.name, passwordHash: existing!.passwordHash,
        role: existing!.role, phone: existing!.phone, city: existing!.city }),
      codeHash: hashVerificationCode(code), attempts: 0, createdAt: now,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
    };
    await tx.emailVerification.upsert({ where: { email }, create: { email, ...data }, update: data });
  });
  return code;
}

export async function completeRegistration(email: string, code: string): Promise<{ error?: string }> {
  return transaction(async (tx) => {
    const pending = await tx.emailVerification.findUnique({ where: { email } });
    if (!pending?.passwordHash || !pending.name) return { error: "Регистрация не найдена. Зарегистрируйтесь заново." };
    if (pending.expiresAt <= new Date()) return { error: "Срок действия кода истёк. Запросите новый код." };
    if (pending.attempts >= MAX_ATTEMPTS) return { error: "Слишком много попыток. Запросите новый код." };
    if (!codesEqual(pending.codeHash, hashVerificationCode(code))) {
      await tx.emailVerification.update({ where: { email }, data: { attempts: { increment: 1 } } });
      return { error: `Неверный код. Осталось попыток: ${MAX_ATTEMPTS - pending.attempts - 1}.` };
    }
    if (await tx.user.findUnique({ where: { email } })) return { error: "Пользователь уже зарегистрирован" };
    await tx.user.create({ data: {
      name: pending.name, email, password: pending.passwordHash, role: pending.role,
      phone: pending.phone, city: pending.city, emailVerified: new Date(),
      ...(pending.role === "VOLUNTEER" ? { volunteerProfile: { create: {} } }
        : { organizationProfile: { create: { orgName: pending.name } } }),
    } });
    await tx.emailVerification.delete({ where: { email } });
    return {};
  });
}
