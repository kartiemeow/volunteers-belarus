import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CITY_MESSAGE,
  PASSWORD_REGEX,
  isBelarusCity,
  normalizeBelarusCity,
} from "../src/lib/validation";
import {
  belarusCityOptionalSchema,
  belarusCityRequiredSchema,
  passwordSchema,
} from "../src/lib/validation-schemas";

test("password: минимум 8 символов, только латиница и цифры, хотя бы одна цифра", () => {
  for (const value of ["password1", "Passw0rd", "a1b2c3d4", "ABCDEFG7"]) {
    assert.equal(passwordSchema.safeParse(value).success, true, value);
    assert.equal(PASSWORD_REGEX.test(value), true, value);
  }

  for (const value of [
    "Pa1", // короче 8
    "password", // нет цифры
    "12345678", // нет латинской буквы
    "пароль12", // кириллица
    "password 1", // пробел
    "password-1", // символ вне латиницы и цифр
    "Пароль123",
  ]) {
    assert.equal(passwordSchema.safeParse(value).success, false, value);
    assert.equal(PASSWORD_REGEX.test(value), false, value);
  }
});

test("город: только названия из списка городов Беларуси, регистр не важен", () => {
  assert.equal(isBelarusCity("Минск"), true);
  assert.equal(isBelarusCity("  минск "), true);
  assert.equal(isBelarusCity("МОГИЛЁВ"), true);
  assert.equal(isBelarusCity("Minsk"), false);
  assert.equal(isBelarusCity("Москва"), false);
  assert.equal(isBelarusCity("Атлантида"), false);
  assert.equal(isBelarusCity(""), false);

  assert.equal(normalizeBelarusCity("  гомель "), "Гомель");
});

test("необязательный город: пустое значение допустимо, произвольный — нет", () => {
  assert.equal(belarusCityOptionalSchema.safeParse(undefined).success, true);
  assert.equal(belarusCityOptionalSchema.safeParse("").success, true);

  const parsed = belarusCityOptionalSchema.parse("брест");
  assert.equal(parsed, "Брест");
  assert.equal(belarusCityOptionalSchema.parse(""), undefined);

  const failed = belarusCityOptionalSchema.safeParse("Москва");
  assert.equal(failed.success, false);
  if (!failed.success) assert.equal(failed.error.issues[0]?.message, CITY_MESSAGE);
});

test("обязательный город: пустое значение и произвольный город отклоняются", () => {
  assert.equal(belarusCityRequiredSchema.parse("солигорск"), "Солигорск");
  assert.equal(belarusCityRequiredSchema.safeParse("").success, false);
  assert.equal(belarusCityRequiredSchema.safeParse("Париж").success, false);
});
