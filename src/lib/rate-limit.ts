import { createHash } from "node:crypto";
import { transaction } from "@/lib/transaction";

export async function consumeRateLimit(scope: string, identity: string, limit: number, windowMs: number) {
  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  return transaction(async (tx) => {
    const now = new Date();
    const current = await tx.rateLimit.findUnique({ where: { key } });
    if (current && current.expiresAt > now && current.count >= limit) return false;
    const expired = !current || current.expiresAt <= now;
    await tx.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt: new Date(now.getTime() + windowMs) },
      update: expired ? { count: 1, expiresAt: new Date(now.getTime() + windowMs) } : { count: { increment: 1 } },
    });
    return true;
  });
}

export async function allowAuthRequest(scope: string, email: string, requestHeaders: Headers) {
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!await consumeRateLimit(`${scope}:ip`, address, 30, 15 * 60 * 1000)) return false;
  return consumeRateLimit(`${scope}:email`, email, 10, 15 * 60 * 1000);
}
