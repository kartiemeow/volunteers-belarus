import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Category, VolunteerProfile } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const password = await bcrypt.hash("Volunteer-2026!", 10);

  console.log("Seeding users...");

  const admin = await db.user.upsert({
    where: { email: "admin@volunteers-belarus.by" },
    update: {},
    create: {
      name: "Администратор",
      email: "admin@volunteers-belarus.by",
      password,
      role: "ADMIN",
    },
  });

  const orgs = await Promise.all(
    [
      {
        name: "Приют «Доброе сердце»",
        email: "dobroe@example.by",
        description:
          "Приют для бездомных кошек и собак под Минском. Более 120 животных ждут заботы и нового дома каждую неделю.",
        categories: ["SHELTER"],
        city: "Минск",
        phone: "+375 29 111-22-33",
        website: "https://example.by",
      },
      {
        name: "Центр «Тёплый дом»",
        email: "teply-dom@example.by",
        description:
          "Помогаем одиноким пожилым людям в Гродно: продукты, лекарства, сопровождение и просто тёплое общение.",
        categories: ["ELDERLY"],
        city: "Гродно",
        phone: "+375 29 222-33-44",
        website: null,
      },
      {
        name: "Поисково-спасательный отряд «Ориентир»",
        email: "orientir@example.by",
        description:
          "Добровольческий отряд, ищущий пропавших людей в городах и за городом по всей стране.",
        categories: ["PSO"],
        city: "Могилёв",
        phone: "+375 33 333-44-55",
        website: "https://example.by",
      },
      {
        name: "Инициатива «Мой двор»",
        email: "moi-dvor@example.by",
        description:
          "Городское сообщество, которое организует субботники, озеленение и ремонт во дворах Бреста.",
        categories: ["URBAN", "SHELTER"],
        city: "Брест",
        phone: "+375 29 444-55-66",
        website: null,
      },
    ].map((o) =>
      db.user.upsert({
        where: { email: o.email },
        update: {},
        create: {
          name: o.name,
          email: o.email,
          password,
          role: "ORGANIZER",
          phone: o.phone,
          city: o.city,
          organizationProfile: {
            create: {
              orgName: o.name,
              description: o.description,
              website: o.website,
              verified: true,
              category: o.categories as Category[],
            },
          },
        },
      })
    )
  );

  const orgProfiles = await db.organizationProfile.findMany({
    where: { userId: { in: orgs.map((u) => u.id) } },
  });
  const byName = new Map(orgProfiles.map((p) => [p.orgName, p]));

  const volunteerSeed = [
    {
      name: "Анна Волошина",
      email: "anna@example.by",
      city: "Минск",
      phone: "+375 29 555-66-77",
      bio: "Помогаю в приютах и на городских акциях. Обожаю собак.",
      skills: ["выгул животных", "фото"],
      interests: ["SHELTER", "URBAN"],
      availability: ["Выходные", "Вечер буднего дня"],
    },
    {
      name: "Дмитрий Козлов",
      email: "dmitry@example.by",
      city: "Могилёв",
      phone: "+375 29 666-77-88",
      bio: "Участвую в поиске пропавших, обучаюсь на оператора БПЛА.",
      skills: ["навигация", "работа в лесу", "первая помощь"],
      interests: ["PSO", "ELDERLY"],
      availability: ["По вызову", "На связи 24/7"],
    },
    {
      name: "Елена Соколова",
      email: "elena@example.by",
      city: "Гродно",
      phone: "+375 33 777-88-99",
      bio: "Навещаю одиноких бабушек и дедушек, помогаю по дому.",
      skills: ["общение с пожилыми", "помощь по дому"],
      interests: ["ELDERLY"],
      availability: ["Суббота", "Воскресенье"],
    },
  ];

  const volunteers = await Promise.all(
    volunteerSeed.map((v) =>
      db.user.upsert({
        where: { email: v.email },
        update: {},
        create: {
          name: v.name,
          email: v.email,
          password,
          role: "VOLUNTEER",
          city: v.city,
          phone: v.phone,
          volunteerProfile: {
            create: {
              bio: v.bio,
              skills: v.skills,
              interests: v.interests as Category[],
              availability: v.availability,
            },
          },
        },
      })
    )
  );

  console.log("Seeding opportunities...");

  const shelter = byName.get("Приют «Доброе сердце»");
  const elderly = byName.get("Центр «Тёплый дом»");
  const pso = byName.get("Поисково-спасательный отряд «Ориентир»");
  const urban = byName.get("Инициатива «Мой двор»");

  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  const opportunities = [
    {
      organizerId: shelter!.id,
      title: "Помощь в приюте: выгул собак в выходные",
      description:
        "Ищем волонтёров на выходные, чтобы выгуливать собак и помогать по хозяйству в приюте. Старшие волонтёры покажут, что делать. Нужна сменная удобная одежда и обувь.",
      category: "SHELTER",
      city: "Минск",
      address: "ул. Лесная, 12",
      date: inDays(3),
      slots: 6,
      requirements: ["Возраст от 16 лет", "Любовь к животным", "Сменная одежда"],
      contactInfo: "Telegram @dobroe_serdce",
    },
    {
      organizerId: shelter!.id,
      title: "Фотосессия животных для пристройства",
      description:
        "Нужны волонтёры с фотоаппаратом или хорошим телефоном, чтобы снять красивые фотографии животных для объявлений и соцсетей. Терпение и любовь к животным важнее опыта.",
      category: "SHELTER",
      city: "Минск",
      address: "ул. Лесная, 12",
      date: inDays(7),
      slots: 3,
      requirements: ["Свой фотоаппарат/телефон", "Обработка фото приветствуется"],
      contactInfo: null,
    },
    {
      organizerId: elderly!.id,
      title: "Дружеские визиты к одиноким пенсионерам",
      description:
        "Навещаем пожилых людей в районе Советском. Достаточно друга и пары часов времени: поболтать, помочь с покупками. Регулярность важнее разовых визитов.",
      category: "ELDERLY",
      city: "Гродно",
      address: null,
      date: inDays(10),
      slots: 5,
      requirements: ["Доброжелательность", "Готовность слушать"],
      contactInfo: "hello@teply-dom.by",
    },
    {
      organizerId: pso!.id,
      title: "Информационный поиск: городская зона",
      description:
        "Прочесывание прилегающих районов, просмотр записей камер и опрос жителей. Работа проходит небольшими группами, инструктаж на месте. Можно участвовать без специальной подготовки.",
      category: "PSO",
      city: "Могилёв",
      address: "сбор у штаба отряда",
      date: inDays(5),
      slots: 10,
      requirements: ["Физическая выносливость", "Смартфон с зарядкой"],
      contactInfo: "112 (привлечение отряда)",
    },
    {
      organizerId: pso!.id,
      title: "Учебный выезд для новичков отряда",
      description:
        "Обучающий семинар и полевая тренировка для тех, кто хочет впервые принять участие в поисках. Расскажем про снаряжение, радиообмен и работу в квадратах.",
      category: "PSO",
      city: "Могилёв",
      address: null,
      date: inDays(14),
      slots: 15,
      requirements: ["Спортивная обувь", "Возраст от 18 лет"],
      contactInfo: null,
    },
    {
      organizerId: urban!.id,
      title: "Субботник в парке Победы",
      description:
        "Совместно с жителями приводим в порядок парк: уборка прошлогодней листвы, покраска скамеек, посадка молодых деревьев. Инвентарь и перчатки выдаём на месте.",
      category: "URBAN",
      city: "Брест",
      address: "парк Победы, центральный вход",
      date: inDays(6),
      slots: 20,
      requirements: ["Рабочая одежда", "Хорошее настроение"],
      contactInfo: null,
    },
  ];

  const createdOpps = [];
  for (const o of opportunities) {
    const existing = await db.opportunity.findFirst({
      where: { title: o.title, organizerId: o.organizerId },
    });
    if (existing) {
      createdOpps.push(existing);
      continue;
    }
    const created = await db.opportunity.create({
      data: {
        title: o.title,
        description: o.description,
        category: o.category as Category,
        city: o.city,
        address: o.address,
        date: o.date,
        slots: o.slots,
        requirements: o.requirements,
        contactInfo: o.contactInfo,
        organizerId: o.organizerId,
      },
    });
    createdOpps.push(created);
  }

  console.log("Seeding applications...");

  const volProfiles = await db.volunteerProfile.findMany({
    where: { userId: { in: volunteers.map((u) => u.id) } },
  });
  const byVolName = new Map(
    volProfiles.map((p) => [
      volunteers.find((u) => u.id === p.userId)?.name,
      p,
    ])
  );

  const appPlans: {
    volunteer: VolunteerProfile;
    oppTitle: string;
    status: "APPROVED" | "PENDING" | "DONE";
    message: string;
    hoursLogged?: number;
  }[] = [
    {
      volunteer: byVolName.get("Анна Волошина")!,
      oppTitle: "Помощь в приюте: выгул собак в выходные",
      status: "APPROVED",
      message: "Буду рада помочь! Могу приезжать каждые выходные.",
    },
    {
      volunteer: byVolName.get("Анна Волошина")!,
      oppTitle: "Фотосессия животных для пристройства",
      status: "PENDING",
      message: "Есть хороший телефон, могу снимать и обрабатывать.",
    },
    {
      volunteer: byVolName.get("Дмитрий Козлов")!,
      oppTitle: "Информационный поиск: городская зона",
      status: "APPROVED",
      message: "Готов выйти. Опыт участия в прошлых поисках есть.",
    },
    {
      volunteer: byVolName.get("Елена Соколова")!,
      oppTitle: "Дружеские визиты к одиноким пенсионерам",
      status: "DONE",
      message: "С удовольствием навещаю бабушек по субботам.",
      hoursLogged: 6,
    },
  ];

  for (const plan of appPlans) {
    const opp = createdOpps.find((o) => o.title === plan.oppTitle);
    if (!opp) continue;
    await db.application.upsert({
      where: {
        opportunityId_volunteerId: {
          opportunityId: opp.id,
          volunteerId: plan.volunteer.id,
        },
      },
      update: { status: plan.status, hoursLogged: plan.hoursLogged ?? 0 },
      create: {
        opportunityId: opp.id,
        volunteerId: plan.volunteer.id,
        status: plan.status,
        message: plan.message,
        hoursLogged: plan.hoursLogged ?? 0,
      },
    });
  }

  console.log("Seeding news...");

  const news = [
    {
      title: "Запускаем волонтёрскую платформу",
      slug: "zapusk-platformy",
      excerpt:
        "Единый координационный центр объединяет приюты, помощь пожилым, ПСО и благоустройство городов.",
      content:
        "Сегодня мы открываем единую площадку, где организации размещают заявки, а волонтёры находят помощь, которая им близка.\n\nЧетыре направления — приюты для животных, помощь пожилым, поисково-спасательные отряды и благоустройство городов. Каждое из них постоянно нуждается в руках и времени, и теперь процесс стал проще: регистрируйтесь, заполняйте профиль и откликайтесь в один клик.\n\nМы верим, что вместе сможем помочь большему числу людей и животных по всей стране.",
    },
    {
      title: "Первый учебный выезд отряда «Ориентир»",
      slug: "uchebnyy-vyezd-orientir",
      excerpt:
        "15 новичков отряда прошли полевую тренировку и познакомились с работой в квадратах.",
      content:
        "В прошедшие выходные отряд «Ориентир» провёл учебный выезд для новичков.\n\nУчились ориентироваться на местности, работать с радиообменом, а также прочёсывать квадраты поисковыми цепочками. Самых активных участников ждёт полевая стажировка на настоящих выездах.\n\nСледите за новостями — следующий учебный выезд появится в ближайшее время.",
    },
    {
      title: "Субботник в парке Победы: итоги",
      slug: "subbotnik-park-pobedy",
      excerpt:
        "20 волонтёров убрали парк, покрасили скамейки и посадили 14 молодых деревьев.",
      content:
        "Больше двух десятков волонтёров вышли в выходные в парк Победы.\n\nВместе мы вывезли около 30 мешков листвы, покрасили 8 скамеек и посадили 14 саженцев липы. Парк стал заметно уютнее, а местные жители уже спрашивают, когда будет следующий субботник.\n\nБлагодарим каждого, кто нашёл время, — без вас это было бы невозможно!",
    },
  ];

  for (const n of news) {
    await db.newsPost.upsert({
      where: { slug: n.slug },
      update: { published: true },
      create: {
        ...n,
        published: true,
        authorId: admin.id,
        excerpt: n.excerpt,
      },
    });
  }

  // Recompute totalHours for all volunteers so counters are consistent.
  for (const p of volProfiles) {
    const agg = await db.application.aggregate({
      where: { volunteerId: p.id, status: "DONE" },
      _sum: { hoursLogged: true },
    });
    await db.volunteerProfile.update({
      where: { id: p.id },
      data: { totalHours: agg._sum.hoursLogged ?? 0 },
    });
  }

  console.log("Seeding complete 🎉");
  console.log("");
  console.log("Demo accounts (password: Volunteer-2026!):");
  console.log(`  Admin:       admin@volunteers-belarus.by`);
  console.log(`  Org:         ${orgs[0].email}`);
  console.log(`  Volunteer:   ${volunteers[0].email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
