import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { z } from "zod";

// Exercise the actual action entry points; any attempted write fails this test.
function actions(role: string) {
  const source = readFileSync("src/lib/actions/profile-actions.ts", "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const compiled = { exports: {} };
  const dependencies: Record<string, unknown> = {
    zod: { z }, "next/cache": { revalidatePath() {} },
    "@/lib/auth": { auth: async () => ({ user: { id: "user", role } }) },
    "@/lib/constants": { CATEGORY_ORDER: ["SHELTER", "ELDERLY", "PSO", "URBAN"] },
    "@/lib/transaction": { transaction() { throw new Error("Unauthorized database write"); } },
    "@/lib/action-result": { actionError(error: Error) { throw error; } },
  };
  vm.runInNewContext(code, { exports: compiled.exports, require: (id: string) => {
    if (!(id in dependencies)) throw new Error(`Unexpected import ${id}`);
    return dependencies[id];
  } });
  return compiled.exports as Record<string, (state: undefined, data: FormData) => Promise<{ error: string }>>;
}

test("volunteers cannot create an organization profile through the server action", async () => {
  const result = await actions("VOLUNTEER").updateOrganizationProfile(undefined, new FormData());
  assert.equal(result.error, "Доступно только организациям");
});

test("organizers cannot create a volunteer profile through the server action", async () => {
  const result = await actions("ORGANIZER").updateVolunteerProfile(undefined, new FormData());
  assert.equal(result.error, "Доступно только волонтёрам");
});
