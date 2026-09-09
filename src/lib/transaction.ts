import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function serializable<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      // PostgreSQL aborts conflicting serializable transactions; retry the whole decision.
      if ((error as { code?: string }).code !== "P2034" || attempt >= 4)
        throw error;
    }
  }
}
