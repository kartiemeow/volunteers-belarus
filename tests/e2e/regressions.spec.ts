import { expect, test, type Page } from "@playwright/test";

let errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});

test.afterEach(async ({ page }, info) => {
  expect(errors).toEqual([]);
  if (process.env.PREVIEW_SLOW_MO) await page.screenshot({ path: info.outputPath("preview.png"), fullPage: false });
});

async function login(page: Page, role: "organizer" | "volunteer" | "admin") {
  await page.goto(`/login?next=/${role}`);
  await page.getByLabel("Email").fill(`${role}@example.test`);
  await page.getByLabel("Пароль").fill("PreviewOnly123!");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}$`));
}

test("catalog: bounded results, search Back category, filtered map and pagination", async ({
  page,
}) => {
  let mapRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/opportunity-map")) mapRequests++;
  });
  await page.goto("/zayavki");
  await expect(page.getByText("Найдено: 1201")).toBeVisible();
  await expect(
    page
      .locator('main a[href^="/zayavki/preview-"]')
      .filter({ has: page.locator("h3") }),
  ).toHaveCount(24);
  expect(mapRequests).toBe(0);
  const search = page.getByPlaceholder("Поиск по названию или описанию...");
  await search.fill("приют");
  await search.press("Enter");
  await expect(page.getByText("Найдено: 1", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(search).toHaveValue("");
  await page
    .getByRole("button", { name: "Благоустройство", exact: true })
    .click();
  await expect(page.getByText("Найдено: 1200")).toBeVisible();
  await expect(page).not.toHaveURL(/q=/);
  await page.getByRole("button", { name: "Показать на карте" }).click();
  await expect(
    page.getByRole("button", { name: "Скрыть карту" }),
  ).toBeVisible();
  await expect.poll(() => mapRequests).toBe(1);
  const response = await page.request.get(
    "/api/opportunity-map?category=URBAN",
  );
  const cities = await response.json();
  expect(cities).toHaveLength(3);
  expect(
    cities.every(
      (city: { count: number; apps: unknown[] }) =>
        city.count === 400 && city.apps.length === 3,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Далее →", exact: true }).click();
  await expect(page.getByText("Страница 2 из 50")).toBeVisible();
  await expect(
    page
      .locator('main a[href^="/zayavki/preview-"]')
      .filter({ has: page.locator("h3") }),
  ).toHaveCount(24);
});

test("mobile: cards precede deferred map without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zayavki");
  const card = page.locator('main a[href^="/zayavki/preview-"]').first();
  await expect(card).toBeVisible();
  expect((await card.boundingBox())!.y).toBeLessThan(844);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByPlaceholder("Поиск по названию или описанию...")
    .fill("приют");
  await page
    .getByPlaceholder("Поиск по названию или описанию...")
    .press("Enter");
  await page.getByRole("button", { name: "Показать на карте" }).click();
  await expect(
    page.getByRole("button", { name: "Скрыть карту" }),
  ).toBeVisible();
});

test("public pages: news and organizations paginate with cached dates and aggregate totals", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Помогать стало проще/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Свежие заявки" }),
  ).toBeVisible();
  await page.goto("/novosti");
  await expect(page.locator("main article")).toHaveCount(24);
  await page.getByRole("link", { name: "Далее →", exact: true }).click();
  await expect(page.locator("main article")).toHaveCount(6);
  await page.locator('main a[href^="/novosti/preview-news-"]').first().click();
  await expect(
    page.getByText("Спасибо всем участникам!", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Спасибо всем участникам!", { exact: true }),
  ).toBeVisible();
  await page.goto("/organizacii");
  await expect(
    page.getByRole("heading", { name: "Приют «Добрые лапы»", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("2403", { exact: true })).toBeVisible();
  await expect(page.getByText("5.0", { exact: false }).first()).toBeVisible();
  await page.getByRole("link", { name: "Далее →", exact: true }).click();
  await expect(page.getByText("Страница 2 из 2")).toBeVisible();
});

test("organizer: total unread, refresh on reopen, approve last slot, DONE and hours", async ({
  page,
}) => {
  await login(page, "organizer");
  const bell = page
    .getByRole("button", { name: "Уведомления", exact: true })
    .first();
  await expect(bell.getByText("9+")).toBeVisible();
  await bell.click();
  await page.getByRole("button", { name: "Отметить всё прочитанным" }).click();
  await expect(bell.getByText("9+")).toHaveCount(0);
  await bell.click();
  await bell.click();
  await expect(
    page.getByRole("button", { name: "Отметить всё прочитанным" }),
  ).toHaveCount(0);
  await page.goto("/organizer/opportunities/preview-last-slot");
  await expect(page.getByText("мест: 1/1")).toBeVisible();
  await page.getByRole("button", { name: "Одобрить", exact: true }).click();
  await expect(page.getByText("Одобрено", { exact: true })).toBeVisible();
  await expect(page.getByText("мест: 1/1")).toBeVisible();
  await page.getByRole("button", { name: /Явился/ }).click();
  await expect(page.getByText("Выполнено", { exact: true })).toBeVisible();
  await page.goto("/zayavki/preview-last-slot");
  await expect(page.getByText("1 из 1", { exact: true })).toBeVisible();
});

test("volunteer: paginated history, tab counts and hours independent of page", async ({
  page,
}) => {
  await login(page, "volunteer");
  await expect(page.getByText("31", { exact: true })).toBeVisible();
  await expect(page.getByText("16 ч", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Далее →", exact: true }).click();
  await expect(page.getByText("Страница 2 из 2")).toBeVisible();
  await expect(page.getByText("31", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Выполненные", exact: true }).click();
  await expect(page.locator('main a[href^="/zayavki/preview-"]')).toHaveCount(
    4,
  );
  await expect(page.getByText("16 ч", { exact: true })).toBeVisible();
});

test("admin: independent lists paginate and private routes reject anonymous access", async ({
  page,
  browser,
}) => {
  await login(page, "admin");
  await expect(
    page.getByRole("heading", { name: "Администрирование" }),
  ).toBeVisible();
  await page.locator('a[href*="orgPage=2"]').click();
  await expect(page).toHaveURL(/orgPage=2/);
  await page.locator('a[href*="userPage=2"]').click();
  await expect(page).toHaveURL(/userPage=2/);
  await page.goto("/admin/news");
  await page.getByRole("link", { name: "Далее →", exact: true }).click();
  await expect(page.getByText("Страница 2 из 2")).toBeVisible();
  const anonymous = await browser.newPage();
  await anonymous.goto("http://localhost:3107/organizer");
  await expect(anonymous).toHaveURL(/\/login/);
  await anonymous.goto("http://localhost:3107/admin");
  await expect(anonymous).toHaveURL(/\/login/);
  await anonymous.close();
});

test("news cache: publish, unpublish, republish, delete and anonymous session isolation", async ({
  page,
  browser,
}) => {
  await login(page, "admin");
  const anonymous = await browser.newContext();
  await anonymous.request.get("http://localhost:3107/novosti");
  await page.goto("/admin/news");
  await page
    .getByLabel("Заголовок", { exact: true })
    .fill("Проверка обновления новостей");
  await page
    .getByLabel("Короткий адрес (slug)")
    .fill("cache-regression-preview-checked");
  await page
    .getByLabel("Текст новости")
    .fill("Публичная новость для проверки свежести кэша после изменений.");
  await page
    .getByRole("button", { name: "Создать новость", exact: true })
    .click();
  await expect(
    page.getByText("Новость опубликована", { exact: true }),
  ).toBeVisible();
  const url = "http://localhost:3107/novosti/cache-regression-preview-checked";
  expect(await (await anonymous.request.get(url)).text()).toContain(
    "Проверка обновления новостей",
  );
  const row = page.locator("div.rounded-2xl").filter({ hasText: "/novosti/cache-regression-preview-checked," }).last();
  await row
    .getByRole("button", { name: "Снять с публикации", exact: true })
    .click();
  await expect(
    row.getByRole("button", { name: "Опубликовать", exact: true }),
  ).toBeVisible();
  expect(await (await anonymous.request.get(url)).text()).not.toContain(
    "Проверка обновления новостей",
  );
  await row.getByRole("button", { name: "Опубликовать", exact: true }).click();
  await expect(
    row.getByRole("button", { name: "Снять с публикации", exact: true }),
  ).toBeVisible();
  expect(await (await anonymous.request.get(url)).text()).toContain(
    "Проверка обновления новостей",
  );
  await row.getByRole("button", { name: "Удалить", exact: true }).click();
  await expect(row).toHaveCount(0);
  expect(await (await anonymous.request.get(url)).text()).not.toContain(
    "Проверка обновления новостей",
  );
  await page.goto("/");
  expect(
    await (await anonymous.request.get("http://localhost:3107/")).text(),
  ).not.toContain("Администратор");
  await anonymous.close();
});

test("reschedule atomically flags active participants and updates public cached date", async ({
  page,
}) => {
  await login(page, "organizer");
  await page.goto("/zayavki/preview-opportunity-0000");
  await page.goto("/organizer/opportunities/preview-opportunity-0000");
  const tomorrow = new Date(Date.now() + 86400000);
  const value = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}T12:00`;
  await page.getByLabel("Новая дата и время").fill(value);
  await page
    .getByRole("button", { name: "Изменить дату", exact: true })
    .click();
  await expect(
    page.getByText("Дата события изменена. Волонтёры уведомлены (2).", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/zayavki/preview-opportunity-0000");
  const expectedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tomorrow);
  await expect(page.getByText(expectedDate, { exact: true })).toBeVisible();
});
