import { serializable } from "@/lib/transaction";
import { MAX_ATTEMPTS, codesEqual, hashVerificationCode } from "@/lib/email";

export async function completeRegistration(
  email: string,
  code: string,
): Promise<{ error: string } | { success: true }> {
  return serializable(
    async (tx): Promise<{ error: string } | { success: true }> => {
      const verification = await tx.emailVerification.findUnique({
        where: { email },
      });
      if (!verification) {
        return { error: "Регистрация не найдена. Зарегистрируйтесь заново." };
      }
      if (Date.now() > verification.expiresAt.getTime()) {
        return { error: "Срок действия кода истёк. Запросите новый код." };
      }
      if (verification.attempts >= MAX_ATTEMPTS) {
        return {
          error: "Слишком много неудачных попыток. Запросите новый код.",
        };
      }

      if (!codesEqual(verification.codeHash, hashVerificationCode(code))) {
        await tx.emailVerification.update({
          where: { email },
          data: { attempts: { increment: 1 } },
        });
        const left = MAX_ATTEMPTS - (verification.attempts + 1);
        return {
          error:
            left > 0
              ? `Неверный код. Осталось попыток: ${left}.`
              : "Слишком много неудачных попыток. Запросите новый код.",
        };
      }

      await tx.user.create({
        data: {
          name: verification.name,
          email,
          password: verification.passwordHash,
          role: verification.role,
          phone: verification.phone,
          city: verification.city,
          emailVerified: new Date(),
          ...(verification.role === "VOLUNTEER"
            ? { volunteerProfile: { create: {} } }
            : {
                organizationProfile: { create: { orgName: verification.name } },
              }),
        },
      });
      await tx.emailVerification.delete({ where: { email } });
      return { success: true } as const;
    },
  );
}
