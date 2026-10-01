import { z } from "zod";

import {
  CITY_MESSAGE,
  PASSWORD_MESSAGE,
  PASSWORD_REGEX,
  isBelarusCity,
  normalizeBelarusCity,
} from "@/lib/validation";

/** Пароль по общим правилам: минимум 8 символов, латиница и цифры, хотя бы одна цифра. */
export const passwordSchema = z
  .string()
  .max(72, "Пароль слишком длинный (максимум 72 символа)")
  .regex(PASSWORD_REGEX, PASSWORD_MESSAGE);

/** Город необязателен, но если указан — только из списка городов Беларуси. */
export const belarusCityOptionalSchema = z
  .string()
  .max(150)
  .refine((v) => v.trim() === "" || isBelarusCity(v), CITY_MESSAGE)
  .optional()
  .transform((v) => (v && v.trim() !== "" ? normalizeBelarusCity(v) : undefined));

/** Город обязателен и должен быть из списка городов Беларуси. */
export const belarusCityRequiredSchema = z
  .string()
  .min(1, "Укажите город")
  .max(150)
  .refine((v) => isBelarusCity(v), CITY_MESSAGE)
  .transform((v) => normalizeBelarusCity(v));
