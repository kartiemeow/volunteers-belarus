"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { transaction } from "@/lib/transaction";
import { changeParticipation, recomputeVolunteerHours, ACTIVE_STATUSES } from "@/lib/participation";
import { ActionError, actionError, type ActionResult } from "@/lib/action-result";
import { parseEventDate, formatEventDate } from "@/lib/dates";
import type { OpportunityFormState } from "./opportunity-actions";

function refresh(id: string) {
  for (const path of ["/organizer", "/volunteer", "/zayavki", `/zayavki/${id}`, `/organizer/opportunities/${id}`]) revalidatePath(path);
  revalidatePath("/", "layout");
}

export async function setApplicationStatus(prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user.role !== "ORGANIZER") return { error: "Доступно только организациям" };
  const status = z.enum(["APPROVED", "REJECTED", "DONE", "NO_SHOW"]).safeParse(formData.get("status"));
  if (!status.success) return { error: "Неизвестный статус" };
  try {
    const app = await transaction((tx) => changeParticipation(tx, String(formData.get("applicationId") ?? ""), session.user.id, "ORGANIZER", status.data));
    refresh(app.opportunityId);
    return { success: "Статус обновлён" };
  } catch (error) { return actionError(error); }
}

export async function setApplicationHours(prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (session?.user.role !== "ORGANIZER") return { error: "Доступно только организациям" };
  const hours = z.coerce.number().int().min(0).max(24).safeParse(formData.get("hours"));
  if (!hours.success) return { error: "Укажите целое число часов от 0 до 24" };
  try {
    const id = await transaction(async (tx) => {
      const app = await tx.application.findFirst({ where: {
        id: String(formData.get("applicationId") ?? ""), status: "DONE",
        opportunity: { organizer: { userId: session.user.id } },
      } });
      if (!app) throw new ActionError("Выполненный отклик не найден");
      await tx.application.update({ where: { id: app.id }, data: { hoursLogged: hours.data } });
      await recomputeVolunteerHours(tx, app.volunteerId);
      return app.opportunityId;
    });
    refresh(id);
    return { success: "Часы сохранены" };
  } catch (error) { return actionError(error); }
}

export async function rescheduleOpportunity(prev: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const session = await auth();
  if (session?.user.role !== "ORGANIZER") return { error: "Доступно только организациям" };
  const date = parseEventDate(String(formData.get("date") ?? ""));
  if (!date || date <= new Date()) return { error: "Укажите будущие дату и время по Минску" };
  const id = String(formData.get("id") ?? "");
  try {
    const count = await transaction(async (tx) => {
      const opportunity = await tx.opportunity.findFirst({ where: { id, organizer: { userId: session.user.id } }, include: { organizer: true } });
      if (!opportunity || opportunity.status === "COMPLETED") throw new ActionError("Заявка не найдена или уже завершена");
      if (opportunity.date.getTime() === date.getTime()) return 0;
      const apps = await tx.application.findMany({ where: { opportunityId: id, status: { in: ACTIVE_STATUSES } }, include: { volunteer: true } });
      await tx.opportunity.update({ where: { id }, data: { date } });
      await tx.application.updateMany({ where: { opportunityId: id, status: { in: ACTIVE_STATUSES } }, data: { needsReconfirmation: true } });
      await tx.notification.createMany({ data: apps.map((app) => ({
        userId: app.volunteer.userId, type: "DATE_CHANGED" as const, title: "Дата события изменена",
        body: `«${opportunity.title}»: ${formatEventDate(date)}. Подтвердите участие до начала события или откажитесь.`, link: "/volunteer",
      })) });
      return apps.length;
    });
    refresh(id);
    return { success: `Дата сохранена. Уведомлений: ${count}.` };
  } catch (error) { return actionError(error); }
}
