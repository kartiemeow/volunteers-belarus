"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { transaction } from "@/lib/transaction";
import { reserveParticipation } from "@/lib/reserve-participation";
import { changeParticipation, ACTIVE_STATUSES } from "@/lib/participation";
import { ActionError, actionError, type ActionResult } from "@/lib/action-result";

export type ApplicationState = ActionResult;
const applySchema = z.object({ opportunityId: z.string().min(1), message: z.string().max(2000).optional() });

function refresh(id: string) {
  for (const path of ["/volunteer", "/organizer", "/zayavki", `/zayavki/${id}`, `/organizer/opportunities/${id}`]) revalidatePath(path);
  revalidatePath("/", "layout");
}

export async function applyToOpportunity(prev: ApplicationState, formData: FormData): Promise<ApplicationState> {
  const session = await auth();
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(`/zayavki/${formData.get("opportunityId")}`)}`);
  if (session.user.role !== "VOLUNTEER") return { error: "Откликнуться могут только волонтёры" };
  const parsed = applySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Проверьте данные отклика" };
  const { opportunityId, message } = parsed.data;
  try {
    await reserveParticipation(session.user.id, opportunityId, message);

    refresh(opportunityId);
    return { success: "Отклик отправлен! Следите за решением в личном кабинете." };
  } catch (error) { return actionError(error); }
}

export async function toggleOpportunityStatus(prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user.role !== "ORGANIZER") return { error: "Доступно только организациям" };
  const status = z.enum(["OPEN", "CLOSED"]).safeParse(formData.get("status"));
  if (!status.success) return { error: "Неизвестный статус" };
  const id = String(formData.get("id") ?? "");
  try {
    await transaction(async (tx) => {
      const changed = await tx.opportunity.updateMany({ where: {
        id, organizer: { userId: session.user.id }, status: { not: "COMPLETED" },
        ...(status.data === "OPEN" ? { date: { gt: new Date() } } : {}),
      }, data: { status: status.data } });
      if (!changed.count) throw new ActionError("Прошедшую или завершённую заявку нельзя открыть заново");
    });
    refresh(id);
    return { success: "Статус набора обновлён" };
  } catch (error) { return actionError(error); }
}

export async function confirmParticipation(prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user.role !== "VOLUNTEER") return { error: "Нужно войти как волонтёр" };
  try {
    const id = await transaction(async (tx) => {
      const app = await tx.application.findFirst({ where: { id: String(formData.get("applicationId") ?? ""), volunteer: { userId: session.user.id } }, include: { opportunity: true } });
      if (!app || !ACTIVE_STATUSES.includes(app.status)) throw new ActionError("Активный отклик не найден");
      if (app.opportunity.date.toISOString() !== formData.get("eventDate")) throw new ActionError("Дата снова изменилась. Обновите страницу");
      if (app.opportunity.date <= new Date()) throw new ActionError("Срок подтверждения истёк. Отмените участие или свяжитесь с организатором");
      await tx.application.update({ where: { id: app.id }, data: { needsReconfirmation: false } });
      return app.opportunityId;
    });
    refresh(id);
    return { success: "Участие подтверждено" };
  } catch (error) { return actionError(error); }
}

export async function declineParticipation(prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user.role !== "VOLUNTEER") return { error: "Нужно войти как волонтёр" };
  try {
    const app = await transaction((tx) => changeParticipation(tx, String(formData.get("applicationId") ?? ""), session.user.id, "VOLUNTEER", "WITHDRAWN"));
    refresh(app.opportunityId);
    return { success: "Вы отменили участие. Организатор уведомлён" };
  } catch (error) { return actionError(error); }
}
