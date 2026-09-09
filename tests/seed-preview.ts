import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  assert.ok(
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
      url.pathname.endsWith("_test"),
  );
  await db.user.deleteMany();
  await db.emailVerification.deleteMany();
  const password = await bcrypt.hash("PreviewOnly123!", 4);
  const base = { password, emailVerified: new Date(), city: "Минск" };
  const org = await db.user.create({
    data: {
      ...base,
      id: "preview-organizer",
      name: "Приют «Добрые лапы»",
      email: "organizer@example.test",
      role: "ORGANIZER",
      organizationProfile: {
        create: {
          id: "preview-org",
          orgName: "Приют «Добрые лапы»",
          verified: true,
          description: "Помогаем животным вместе с волонтёрами.",
          category: ["SHELTER"],
        },
      },
    },
  });
  await db.user.create({
    data: {
      ...base,
      id: "preview-volunteer",
      name: "Анна Волонтёрова",
      email: "volunteer@example.test",
      volunteerProfile: { create: { id: "preview-vol", totalHours: 12 } },
    },
  });
  await db.user.create({
    data: {
      ...base,
      id: "preview-admin",
      name: "Администратор",
      email: "admin@example.test",
      role: "ADMIN",
    },
  });
  await db.user.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      ...base,
      id: `preview-user-${i}`,
      name: `Волонтёр ${i + 1}`,
      email: `volunteer-${i}@example.test`,
    })),
  });
  await db.volunteerProfile.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      id: `preview-profile-${i}`,
      userId: `preview-user-${i}`,
      skills: [],
      interests: [],
      availability: [],
    })),
  });
  for (let i = 0; i < 26; i++) {
    await db.user.create({
      data: {
        ...base,
        name: `Инициатива ${i + 1}`,
        email: `org-${i}@example.test`,
        role: "ORGANIZER",
        organizationProfile: {
          create: {
            orgName: `Инициатива ${i + 1}`,
            description: "Городская волонтёрская инициатива",
            category: ["URBAN"],
          },
        },
      },
    });
  }
  await db.opportunity.createMany({
    data: [
      {
        id: "preview-last-slot",
        title: "Помощь приюту: последнее место",
        description: "Прогулки с собаками и помощь в уходе за животными.",
        category: "SHELTER",
        city: "Минск",
        slots: 1,
        filledSlots: 1,
        date: new Date(Date.now() - 3600000),
        organizerId: "preview-org",
        requirements: [],
        createdAt: new Date(Date.now() + 1000),
      },
      ...Array.from({ length: 1200 }, (_, i) => ({
        id: `preview-opportunity-${String(i).padStart(4, "0")}`,
        title: `Благоустройство парка №${i + 1}`,
        description:
          "Уборка дорожек и посадка деревьев. Приглашаем волонтёров помочь сделать город уютнее.",
        category: "URBAN" as const,
        city: ["Минск", "Гомель", "Брест"][i % 3],
        slots: 40,
        filledSlots: 2,
        date: new Date(Date.now() - 86400000 * ((i % 5) + 1)),
        organizerId: "preview-org",
        requirements: [],
        createdAt: new Date(Date.now() - i * 1000),
      })),
    ],
  });
  await db.application.create({
    data: {
      id: "preview-application",
      opportunityId: "preview-last-slot",
      volunteerId: "preview-vol",
      status: "PENDING",
      hoursLogged: 4,
    },
  });
  await db.application.createMany({
    data: Array.from({ length: 1200 }, (_, i) =>
      [0, 1, 2, 3].map((j) => ({
        opportunityId: `preview-opportunity-${String(i).padStart(4, "0")}`,
        volunteerId: `preview-profile-${j}`,
        status: j < 2 ? ("PENDING" as const) : ("DONE" as const),
        hoursLogged: j < 2 ? 0 : 2,
      })),
    ).flat(),
  });
  await db.application.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      id: `preview-history-${i}`,
      opportunityId: `preview-opportunity-${String(i).padStart(4, "0")}`,
      volunteerId: "preview-vol",
      status: i < 3 ? ("DONE" as const) : ("REJECTED" as const),
      hoursLogged: i < 3 ? 4 : 0,
    })),
  });
  for (let i = 0; i < 3; i++)
    await db.rating.create({
      data: {
        organizationId: "preview-org",
        volunteerId: "preview-vol",
        applicationId: `preview-history-${i}`,
        score: 5,
      },
    });
  await db.newsPost.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      title: `Новости волонтёров №${i + 1}`,
      slug: `preview-news-${i}`,
      excerpt: "Волонтёры помогли сделать наш город лучше.",
      content: "История совместной помощи.\nСпасибо всем участникам!",
      published: true,
      authorId: org.id,
    })),
  });
  await db.notification.createMany({
    data: Array.from({ length: 25 }, (_, i) => ({
      userId: "preview-organizer",
      title: i < 15 ? "Новый отклик волонтёра" : "Участие подтверждено",
      body: "Тестовое уведомление для проверки счётчика.",
      read: i >= 15,
      createdAt: new Date(Date.now() - (25 - i) * 1000),
      link: "/organizer",
    })),
  });
  console.log(
    "Preview seeded: 1201 opportunities, 4831 applications, 27 organizations, 30 news posts; local test accounts only.",
  );
}
main().finally(() => db.$disconnect());
