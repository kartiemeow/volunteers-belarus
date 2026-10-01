import { BELARUS_CITIES } from "@/lib/constants";

/**
 * Требования к паролю: минимум 8 символов, только латинские буквы и цифры,
 * обязательно хотя бы одна цифра.
 *
 * Модуль намеренно не импортирует zod — им пользуются и клиентские компоненты,
 * чтобы в браузерный бандл не попадала библиотека валидации.
 */
export const PASSWORD_PATTERN = "(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{8,}";
export const PASSWORD_REGEX = new RegExp(`^${PASSWORD_PATTERN}$`);
export const PASSWORD_HINT =
  "Минимум 8 символов: латинские буквы и цифры, хотя бы одна цифра";
export const PASSWORD_MESSAGE =
  "Пароль должен быть не короче 8 символов и содержать только латинские буквы и цифры, минимум одну цифру";

export const CITY_MESSAGE = "Выберите город из списка";

/** Разрешён ли такой город: точное совпадение с городом Беларуси, без учёта регистра. */
export function isBelarusCity(value: string): boolean {
  const city = value.trim().toLowerCase();
  return BELARUS_CITIES.some((c) => c.toLowerCase() === city);
}

/** Каноническое написание города из списка (или исходная строка, если совпадения нет). */
export function normalizeBelarusCity(value: string): string {
  const city = value.trim().toLowerCase();
  return BELARUS_CITIES.find((c) => c.toLowerCase() === city) ?? value.trim();
}
