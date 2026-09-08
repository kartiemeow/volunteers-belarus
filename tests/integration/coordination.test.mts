import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Use a disposable TEST_DATABASE_URL with a database name ending in _test");
process.env.DATABASE_URL = url;
const { db } = await import("../../src/lib/db");
const { transaction } = await import("../../src/lib/transaction");
const { changeParticipation, recomputeVolunteerHours } = await import("../../src/lib/participation");
const { reserveParticipation } = await import("../../src/lib/reserve-participation");
const { prepareRegistrationCode, completeRegistration } = await import("../../src/lib/registration");
const { consumeRateLimit } = await import("../../src/lib/rate-limit");
const { deleteAccount } = await import("../../src/lib/delete-account");
const { sendAttendanceReminders } = await import("../../src/lib/reminders");

beforeEach(async () => {
  await db.user.deleteMany();
  await db.emailVerification.deleteMany();
  await db.rateLimit.deleteMany();
});
after(async () => { await db.$disconnect(); });

async function fixture(slots = 1) {
  const organizer = await db.user.create({ data: {
    name: "Тестовый организатор", email: `${randomUUID()}@example.test`, password: "unused", role: "ORGANIZER",
    organizationProfile: { create: { orgName: "Тестовая организация" } },
  }, include: { organizationProfile: true } });
  const volunteers = await Promise.all([1, 2].map(async () => db.user.create({ data: {
    name: "Тестовый волонтёр", email: `${randomUUID()}@example.test`, password: "unused", role: "VOLUNTEER",
    city: "Минск", phone: "+375290000000", volunteerProfile: { create: {} },
  }, include: { volunteerProfile: true } })));
  const opportunity = await db.opportunity.create({ data: {
    title: "Тестовая заявка", description: "Помощь на тестовом мероприятии", category: "URBAN", city: "Минск",
    date: new Date(Date.now() + 86400000), slots, organizerId: organizer.organizationProfile!.id,
  } });
  const apply = async (index = 0) => {
    await reserveParticipation(volunteers[index].id, opportunity.id);
    return db.application.findFirstOrThrow({ where: { opportunityId: opportunity.id, volunteerId: volunteers[index].volunteerProfile!.id } });
  };
  return { organizer, volunteers, opportunity, apply };
}

test("the final reserved place can be approved without increasing capacity", async () => {
  const f = await fixture(); const app = await f.apply();
  await transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "APPROVED"));
  assert.equal((await db.application.findUniqueOrThrow({ where: { id: app.id } })).status, "APPROVED");
  assert.equal((await db.opportunity.findUniqueOrThrow({ where: { id: f.opportunity.id } })).filledSlots, 1);
  assert.equal(await db.notification.count(), 1);
});

test("concurrent applicants cannot overbook the final place", async () => {
  const f = await fixture();
  const results = await Promise.allSettled([f.apply(0), f.apply(1)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await db.application.count(), 1);
  assert.equal((await db.opportunity.findUniqueOrThrow({ where: { id: f.opportunity.id } })).filledSlots, 1);
});

test("concurrent duplicate rejection releases exactly one place", async () => {
  const f = await fixture(); const app = await f.apply();
  await Promise.all([1, 2].map(() => transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "REJECTED"))));
  assert.equal((await db.opportunity.findUniqueOrThrow({ where: { id: f.opportunity.id } })).filledSlots, 0);
  await assert.rejects(transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "APPROVED")));
});

test("ordinary withdrawal is neutral, idempotent, and scoped to its owner", async () => {
  const f = await fixture(); const app = await f.apply();
  await assert.rejects(transaction((tx) => changeParticipation(tx, app.id, f.volunteers[1].id, "VOLUNTEER", "WITHDRAWN")));
  await Promise.all([1, 2].map(() => transaction((tx) => changeParticipation(tx, app.id, f.volunteers[0].id, "VOLUNTEER", "WITHDRAWN"))));
  assert.equal((await db.application.findUniqueOrThrow({ where: { id: app.id } })).status, "WITHDRAWN");
  assert.equal((await db.opportunity.findUniqueOrThrow({ where: { id: f.opportunity.id } })).filledSlots, 0);
  assert.equal(await db.notification.count({ where: { type: "PARTICIPATION_DECLINED" } }), 1);
});

test("past and closed events do not accept applications", async () => {
  const f = await fixture();
  await db.opportunity.update({ where: { id: f.opportunity.id }, data: { date: new Date(0) } });
  await assert.rejects(f.apply());
  await db.opportunity.update({ where: { id: f.opportunity.id }, data: { date: new Date(Date.now() + 86400000), status: "CLOSED" } });
  await assert.rejects(f.apply());
  assert.equal(await db.application.count(), 0);
});

test("attendance cannot penalize unconfirmed rescheduling; expiry is neutral", async () => {
  const f = await fixture(); const app = await f.apply();
  await db.application.update({ where: { id: app.id }, data: { status: "APPROVED", needsReconfirmation: true } });
  await db.opportunity.update({ where: { id: f.opportunity.id }, data: { date: new Date(0) } });
  await assert.rejects(transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "NO_SHOW")));
  await sendAttendanceReminders(); await sendAttendanceReminders();
  assert.equal((await db.application.findUniqueOrThrow({ where: { id: app.id } })).status, "WITHDRAWN");
  assert.equal((await db.opportunity.findUniqueOrThrow({ where: { id: f.opportunity.id } })).filledSlots, 0);
  assert.equal(await db.notification.count(), 2);
});

test("attendance reminders do not duplicate on retries", async () => {
  const f = await fixture(); const app = await f.apply();
  await db.application.update({ where: { id: app.id }, data: { status: "APPROVED" } });
  await db.opportunity.update({ where: { id: f.opportunity.id }, data: { date: new Date(0) } });
  await Promise.all([sendAttendanceReminders(), sendAttendanceReminders()]);
  assert.equal(await db.notification.count({ where: { type: "ATTENDANCE_REMINDER" } }), 1);
});

test("organizer approval cannot confirm a rescheduled date on behalf of the volunteer", async () => {
  const f = await fixture(); const app = await f.apply();
  await db.application.update({ where: { id: app.id }, data: { needsReconfirmation: true } });
  await transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "APPROVED"));
  assert.equal((await db.application.findUniqueOrThrow({ where: { id: app.id } })).needsReconfirmation, true);
  await db.opportunity.update({ where: { id: f.opportunity.id }, data: { date: new Date(0) } });
  await assert.rejects(transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "NO_SHOW")));
});

test("completed participation sums hours and disallows arbitrary terminal transitions", async () => {
  const f = await fixture(); const app = await f.apply();
  await db.application.update({ where: { id: app.id }, data: { status: "APPROVED", hoursLogged: 4 } });
  await db.opportunity.update({ where: { id: f.opportunity.id }, data: { date: new Date(0) } });
  await transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "DONE"));
  await assert.rejects(transaction((tx) => changeParticipation(tx, app.id, f.organizer.id, "ORGANIZER", "REJECTED")));
  assert.equal((await db.volunteerProfile.findUniqueOrThrow({ where: { id: app.volunteerId } })).totalHours, 4);
});

test("deleting participants restores places; deleting organizers restores hours", async () => {
  const f = await fixture(2); const a = await f.apply(0); const b = await f.apply(1);
  await deleteAccount(f.volunteers[0].id);
  assert.equal(await db.application.count({ where: { id: a.id } }), 0);
  assert.equal((await db.opportunity.findUniqueOrThrow({ where: { id: f.opportunity.id } })).filledSlots, 1);
  await db.application.update({ where: { id: b.id }, data: { status: "DONE", hoursLogged: 5 } });
  await transaction((tx) => recomputeVolunteerHours(tx, b.volunteerId));
  await deleteAccount(f.organizer.id);
  assert.equal((await db.volunteerProfile.findUniqueOrThrow({ where: { id: b.volunteerId } })).totalHours, 0);
});

const pending = { name: "Первый", role: "VOLUNTEER" as const, passwordHash: "hash-one", phone: null, city: null };
test("registration and resend share a persistent cooldown; unknown resend cannot create accounts", async () => {
  await prepareRegistrationCode("test@example.test", pending);
  await assert.rejects(prepareRegistrationCode("test@example.test", { ...pending, name: "Второй" }));
  await assert.rejects(prepareRegistrationCode("test@example.test"));
  await assert.rejects(prepareRegistrationCode("unknown@example.test"));
  assert.equal(await db.emailVerification.count(), 1);
});

test("a new registration replaces the entire payload and completes atomically", async () => {
  const email = "test@example.test";
  await prepareRegistrationCode(email, pending);
  await db.emailVerification.update({ where: { email }, data: { createdAt: new Date(0) } });
  const passwordHash = await bcrypt.hash("LatestPassword123", 10);
  const code = await prepareRegistrationCode(email, { ...pending, name: "Последний", passwordHash, role: "ORGANIZER" });
  assert.deepEqual(await completeRegistration(email, code), {});
  const user = await db.user.findUniqueOrThrow({ where: { email }, include: { organizationProfile: true } });
  assert.equal(user.name, "Последний"); assert.equal(user.role, "ORGANIZER");
  assert.equal(await bcrypt.compare("LatestPassword123", user.password), true);
  assert.ok(user.emailVerified); assert.ok(user.organizationProfile);
  assert.equal(await db.emailVerification.count(), 0);
});

test("verification attempts stay bounded under concurrent submissions", async () => {
  const email = "attempts@example.test"; const code = await prepareRegistrationCode(email, pending);
  await Promise.all(Array.from({ length: 6 }, () => completeRegistration(email, "000000")));
  assert.equal((await db.emailVerification.findUniqueOrThrow({ where: { email } })).attempts, 5);
  assert.ok((await completeRegistration(email, code)).error);
  assert.equal(await db.user.count(), 0);
});

test("concurrent verification creates one user and one profile", async () => {
  const email = "verify@example.test"; const code = await prepareRegistrationCode(email, pending);
  const results = await Promise.all([completeRegistration(email, code), completeRegistration(email, code)]);
  assert.equal(results.filter((r) => !r.error).length, 1);
  assert.equal(await db.user.count(), 1); assert.equal(await db.volunteerProfile.count(), 1);
});

test("shared rate limits cannot be bypassed by concurrent workers", async () => {
  const results = await Promise.all(Array.from({ length: 6 }, () => consumeRateLimit("test", "email", 3, 60000)));
  assert.equal(results.filter(Boolean).length, 3);
  assert.equal((await db.rateLimit.findFirstOrThrow()).count, 3);
});
