import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd().endsWith("\\backend")
  ? resolve(process.cwd(), "..")
  : process.cwd();

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("backend server-only boundary", () => {
  it("keeps the extracted Supabase client in the backend directory", () => {
    expect(existsSync(resolve(repositoryRoot, "backend/lib/supabase.server.ts"))).toBe(true);
    expect(readFileSync(resolve(repositoryRoot, "frontend/src/lib/supabase.server.ts"), "utf8")).toContain(
      'export { createSupabaseServerClient } from "../../../backend/lib/supabase.server";',
    );
  });

  it("does not introduce service-role credentials into backend source", () => {
    const source = readFileSync(resolve(repositoryRoot, "backend/lib/supabase.server.ts"), "utf8");
    expect(source).not.toMatch(/service[_-]?role/i);
    expect(source).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
    expect(source).toContain("VITE_SUPABASE_ANON_KEY");
  });

  it("preserves the server-only module naming boundary", () => {
    expect(resolve(repositoryRoot, "backend/lib/supabase.server.ts")).toMatch(
      /supabase\.server\.ts$/,
    );
    expect(readFileSync(resolve(repositoryRoot, "frontend/src/lib/supabase.server.ts"), "utf8")).toMatch(
      /backend\/lib\/supabase\.server/,
    );
  });

  it("keeps Developer Portal server adapters pointed at backend services", () => {
    for (const service of ["developer-data", "leads-data", "workspace-data"]) {
      const adapter = readFileSync(
        resolve(repositoryRoot, `frontend/src/developer-portal/${service}.server.ts`),
        "utf8",
      );
      expect(adapter).toContain(`../../backend/services/${service}.server`);
    }
  });

  it("does not leak backend server implementations into browser-facing source", () => {
    const allowedAdapters = new Set([
      resolve(repositoryRoot, "frontend/src/lib/supabase.server.ts"),
      resolve(repositoryRoot, "frontend/src/lib/control-auth.server.ts"),
      resolve(repositoryRoot, "frontend/src/lib/developer-auth.server.ts"),
      resolve(repositoryRoot, "frontend/src/lib/public-auth.server.ts"),
      resolve(repositoryRoot, "frontend/src/developer-portal/developer-data.server.ts"),
      resolve(repositoryRoot, "frontend/src/developer-portal/leads-data.server.ts"),
      resolve(repositoryRoot, "frontend/src/developer-portal/workspace-data.server.ts"),
    ]);
    const backendServerImport =
      /(?:from|import\()\s*["'][^"']*backend\/(?:auth|services|lib)\/[^"']*\.server["']/;
    const leaks =     collectSourceFiles(resolve(repositoryRoot, "frontend/src"))
      .filter((path) => !allowedAdapters.has(path))
      .filter((path) => backendServerImport.test(readFileSync(path, "utf8")));

    expect(leaks).toEqual([]);
  });

  it("keeps backend implementations independent from src server adapters", () => {
    const backendServerImport =
      /(?:from|import\()\s*["'][^"']*src\/(?:lib|developer-portal)\/[^"']*\.server["']/;
    const leaks = collectSourceFiles(resolve(repositoryRoot, "backend")).filter((path) =>
      backendServerImport.test(readFileSync(path, "utf8")),
    );

    expect(leaks).toEqual([]);
  });
});
