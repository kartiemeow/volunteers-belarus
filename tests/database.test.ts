import assert from "node:assert/strict";
import { test, after } from "node:test";
import { db } from "../src/lib/db";
import {
  reserveApplication,
  transitionApplication,
  recomputeVolunteerHours,
} from "../src/lib/application-service";
import { completeRegistration } from "../src/lib/registration-service";
import { serializable } from "../src/lib/transaction";
import {
  hashVerificationCode,
  generateVerificationCode,
} from "../src/lib/email";
import { getNotifications } from "../src/lib/notification-data";
import { reliabilityFromCounts } from "../src/lib/reliability";

const url = new URL(process.env.DATABASE_URL!);
assert.ok(
  ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.pathname.endsWith("_test"),
  "Tests require an isolated local *_test database",
);
after(() => db.$disconnect());
let sequence = 0;
async function fixture(slots = 1) {
  const key = `${Date.now()}-${++sequence}`;
  const organizer = await db.user.create({
    data: {
      name: "Организация",
      email: `org-${key}@example.test`,
      password: "test",
      role: "ORGANIZER",
      organizationProfile: { create: { orgName: "Приют" } },
    },
    include: { organizationProfile: true },
  });
  const volunteer = await db.user.create({
    data: {
      name: "Волонтёр",
      email: `vol-${key}@example.test`,
      password: "test",
      volunteerProfile: { create: {} },
    },
    include: { volunteerProfile: true },
  });
  const opportunity = await db.opportunity.create({
    data: {
      title: "Помочь",
      description: "Тест",
      category: "SHELTER",
      city: "Минск",
      date: new Date(0),
      slots,
      organizerId: organizer.organizationProfile!.id,
    },
  });
  return {
    organizer,
    volunteer,
    opportunity,
    volunteerId: volunteer.volunteerProfile!.id,
  };
}

test("last reserved slot approves; concurrent rejection releases once; reactivation reserves; DONE exit removes hours", async () => {
  const f = await fixture();
  assert.equal(await reserveApplication(f.opportunity.id, f.volunteerId), true);
  const app = await db.application.findFirstOrThrow({
    where: { opportunityId: f.opportunity.id },
  });
  const actor = { organizerUserId: f.organizer.id };
  assert.equal(
    await transitionApplication(app.id, "APPROVED", actor),
    f.opportunity.id,
  );
  assert.equal(
    (
      await db.opportunity.findUniqueOrThrow({
        where: { id: f.opportunity.id },
      })
    ).filledSlots,
    1,
  );
  const results = await Promise.all([
    transitionApplication(app.id, "REJECTED", actor),
    transitionApplication(app.id, "REJECTED", actor),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(
    (
      await db.opportunity.findUniqueOrThrow({
        where: { id: f.opportunity.id },
      })
    ).filledSlots,
    0,
  );
  await transitionApplication(app.id, "PENDING", actor);
  assert.equal(
    (
      await db.opportunity.findUniqueOrThrow({
        where: { id: f.opportunity.id },
      })
    ).filledSlots,
    1,
  );
  await transitionApplication(app.id, "APPROVED", actor);
  await db.application.update({
    where: { id: app.id },
    data: { hoursLogged: 5 },
  });
  await transitionApplication(app.id, "DONE", actor);
  assert.equal(
    (
      await db.volunteerProfile.findUniqueOrThrow({
        where: { id: f.volunteerId },
      })
    ).totalHours,
    5,
  );
  await transitionApplication(app.id, "REJECTED", actor);
  assert.equal(
    (
      await db.volunteerProfile.findUniqueOrThrow({
        where: { id: f.volunteerId },
      })
    ).totalHours,
    0,
  );
});

test("two volunteers compete for one slot and duplicate application is idempotent", async () => {
  const f = await fixture();
  const other = await fixture();
  const results = await Promise.all([
    reserveApplication(f.opportunity.id, f.volunteerId),
    reserveApplication(f.opportunity.id, other.volunteerId),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  const app = await db.application.findFirstOrThrow({
    where: { opportunityId: f.opportunity.id },
  });
  assert.equal(
    await reserveApplication(f.opportunity.id, app.volunteerId),
    false,
  );
  assert.equal(
    await db.application.count({ where: { opportunityId: f.opportunity.id } }),
    1,
  );
  assert.equal(
    (
      await db.opportunity.findUniqueOrThrow({
        where: { id: f.opportunity.id },
      })
    ).filledSlots,
    1,
  );
});

test("closed opportunities cannot reserve; full opportunities cannot reactivate; ownership enforced", async () => {
  const f = await fixture();
  const other = await fixture();
  await db.opportunity.update({
    where: { id: f.opportunity.id },
    data: { status: "CLOSED" },
  });
  assert.equal(
    await reserveApplication(f.opportunity.id, f.volunteerId),
    false,
  );
  await db.opportunity.update({
    where: { id: f.opportunity.id },
    data: { status: "OPEN" },
  });
  await reserveApplication(f.opportunity.id, f.volunteerId);
  const app = await db.application.findFirstOrThrow({
    where: { opportunityId: f.opportunity.id },
  });
  assert.equal(
    await transitionApplication(app.id, "REJECTED", {
      organizerUserId: other.organizer.id,
    }),
    null,
  );
  await transitionApplication(app.id, "REJECTED", {
    organizerUserId: f.organizer.id,
  });
  await reserveApplication(f.opportunity.id, other.volunteerId);
  assert.equal(
    await transitionApplication(app.id, "APPROVED", {
      organizerUserId: f.organizer.id,
    }),
    null,
  );
});

test("concurrent decline after reschedule changes counter and notification only once", async () => {
  const f = await fixture();
  await reserveApplication(f.opportunity.id, f.volunteerId);
  const app = await db.application.findFirstOrThrow({
    where: { opportunityId: f.opportunity.id },
  });
  await db.application.update({
    where: { id: app.id },
    data: { needsReconfirmation: true },
  });
  await Promise.all(
    [1, 2].map(() =>
      transitionApplication(app.id, "REJECTED", {
        volunteerUserId: f.volunteer.id,
      }),
    ),
  );
  assert.equal(
    (
      await db.opportunity.findUniqueOrThrow({
        where: { id: f.opportunity.id },
      })
    ).filledSlots,
    0,
  );
  assert.equal(
    await db.notification.count({
      where: { userId: f.organizer.id, type: "PARTICIPATION_DECLINED" },
    }),
    1,
  );
});

test("failure after status and counter writes rolls the entire transition back", async () => {
  const f = await fixture();
  await reserveApplication(f.opportunity.id, f.volunteerId);
  const app = await db.application.findFirstOrThrow({
    where: { opportunityId: f.opportunity.id },
  });
  await transitionApplication(app.id, "APPROVED", {
    organizerUserId: f.organizer.id,
  });
  await db.$executeRawUnsafe(
    `CREATE FUNCTION fail_notification() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected notification failure'; END $$`,
  );
  await db.$executeRawUnsafe(
    `CREATE TRIGGER fail_notification BEFORE INSERT ON "Notification" FOR EACH ROW EXECUTE FUNCTION fail_notification()`,
  );
  try {
    await assert.rejects(
      transitionApplication(app.id, "DONE", {
        organizerUserId: f.organizer.id,
      }),
    );
    assert.equal(
      (await db.application.findUniqueOrThrow({ where: { id: app.id } }))
        .status,
      "APPROVED",
    );
    assert.equal(
      (
        await db.opportunity.findUniqueOrThrow({
          where: { id: f.opportunity.id },
        })
      ).filledSlots,
      1,
    );
  } finally {
    await db.$executeRawUnsafe(
      `DROP TRIGGER fail_notification ON "Notification"`,
    );
    await db.$executeRawUnsafe(`DROP FUNCTION fail_notification()`);
  }
});

test("hours aggregate remains consistent when two completed events change concurrently", async () => {
  const f = await fixture();
  const other = await fixture();
  for (const opportunityId of [f.opportunity.id, other.opportunity.id]) {
    await db.application.create({
      data: {
        opportunityId,
        volunteerId: f.volunteerId,
        status: "DONE",
        hoursLogged: 3,
      },
    });
  }
  await serializable((tx) => recomputeVolunteerHours(tx, f.volunteerId));
  const apps = await db.application.findMany({
    where: { volunteerId: f.volunteerId },
  });
  await Promise.all(
    apps.map((app) =>
      transitionApplication(app.id, "REJECTED", {
        organizerUserId:
          app.opportunityId === f.opportunity.id
            ? f.organizer.id
            : other.organizer.id,
      }),
    ),
  );
  assert.equal(
    (
      await db.volunteerProfile.findUniqueOrThrow({
        where: { id: f.volunteerId },
      })
    ).totalHours,
    0,
  );
});

async function verification(role: "VOLUNTEER" | "ORGANIZER" = "VOLUNTEER") {
  const email = `verify-${Date.now()}-${++sequence}@example.test`;
  await db.emailVerification.create({
    data: {
      email,
      name: "Тест",
      passwordHash: "test",
      role,
      codeHash: hashVerificationCode("123456"),
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  return email;
}

test("registration rollback leaves verification reusable and no orphan account", async () => {
  const email = await verification();
  await db.$executeRawUnsafe(
    `CREATE FUNCTION fail_verification_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected deletion failure'; END $$`,
  );
  await db.$executeRawUnsafe(
    `CREATE TRIGGER fail_verification_delete BEFORE DELETE ON "EmailVerification" FOR EACH ROW EXECUTE FUNCTION fail_verification_delete()`,
  );
  try {
    await assert.rejects(completeRegistration(email, "123456"));
    assert.equal(await db.user.findUnique({ where: { email } }), null);
    assert.ok(await db.emailVerification.findUnique({ where: { email } }));
  } finally {
    await db.$executeRawUnsafe(
      `DROP TRIGGER fail_verification_delete ON "EmailVerification"`,
    );
    await db.$executeRawUnsafe(`DROP FUNCTION fail_verification_delete()`);
  }
  assert.deepEqual(await completeRegistration(email, "123456"), {
    success: true,
  });
  const user = await db.user.findUniqueOrThrow({
    where: { email },
    include: { volunteerProfile: true },
  });
  assert.ok(user.volunteerProfile);
  assert.equal(
    await db.emailVerification.findUnique({ where: { email } }),
    null,
  );
});

test("organizer registration and concurrent verification create exactly one complete account", async () => {
  const email = await verification("ORGANIZER");
  const results = await Promise.allSettled([
    completeRegistration(email, "123456"),
    completeRegistration(email, "123456"),
  ]);
  assert.equal(
    results.filter((r) => r.status === "fulfilled" && "success" in r.value)
      .length,
    1,
  );
  const user = await db.user.findUniqueOrThrow({
    where: { email },
    include: { organizationProfile: true },
  });
  assert.ok(user.organizationProfile);
  assert.equal(
    await db.emailVerification.findUnique({ where: { email } }),
    null,
  );
});

test("expired codes and exhausted attempts cannot register", async () => {
  const email = await verification();
  await db.emailVerification.update({
    where: { email },
    data: { expiresAt: new Date(0) },
  });
  assert.ok("error" in (await completeRegistration(email, "123456")));
  await db.emailVerification.update({
    where: { email },
    data: { expiresAt: new Date(Date.now() + 60000), attempts: 5 },
  });
  assert.ok("error" in (await completeRegistration(email, "123456")));
  for (let i = 0; i < 100; i++)
    assert.match(generateVerificationCode(), /^\d{6}$/);
});

test("unread count includes older notifications outside the ten displayed", async () => {
  const f = await fixture();
  await db.notification.createMany({
    data: Array.from({ length: 25 }, (_, i) => ({
      userId: f.volunteer.id,
      title: `Test ${i}`,
      read: i >= 15,
      createdAt: new Date(1000 * i),
    })),
  });
  const snapshot = await getNotifications(f.volunteer.id);
  assert.equal(snapshot.notifications.length, 10);
  assert.equal(snapshot.unreadCount, 15);
  assert.ok(snapshot.notifications.every((notification) => notification.read));
});

test("reliability aggregate preserves the 60 percent boundary", () => {
  assert.equal(reliabilityFromCounts(0, 0).isUnreliable, false);
  assert.equal(reliabilityFromCounts(3, 2).isUnreliable, false);
  assert.equal(reliabilityFromCounts(2, 2).isUnreliable, true);
  assert.equal(reliabilityFromCounts(0, 3).isUnreliable, true);
});
