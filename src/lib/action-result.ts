export type ActionResult = { error?: string; success?: string } | undefined;

export class ActionError extends Error {}

export function actionError(error: unknown): { error: string } {
  if (error instanceof ActionError) return { error: error.message };
  console.error("Не удалось сохранить изменения", error instanceof Error ? error.name : "UnknownError");
  return { error: "Не удалось сохранить изменения. Попробуйте ещё раз." };
}
