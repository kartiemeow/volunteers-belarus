import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

const RETRYABLE = new Set(["P2034", "P2002"]);

async function run<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      if (
        attempt >= 4 ||
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        !RETRYABLE.has(error.code)
      ) {
        throw error;
      }
    }
  }
}

export const transaction = run;
export const serializable = run;