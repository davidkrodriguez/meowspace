import { beforeEach, describe, expect, it, vi } from "vitest";

const { runWithDeps } = require("../scripts/migrate.js") as {
  runWithDeps: (deps: {
    fs: { readdir: (dir: string) => Promise<string[]>; readFile: (path: string, encoding: string) => Promise<string> };
    path: { resolve: (...parts: string[]) => string; join: (...parts: string[]) => string };
    Pool: new (options: { connectionString: string; ssl: false | undefined }) => { query: (sql: string) => Promise<void>; end: () => Promise<void> };
    env: Record<string, string | undefined>;
    cwd: () => string;
  }) => Promise<void>;
};

let mockReadDir: ReturnType<typeof vi.fn>;
let mockReadFile: ReturnType<typeof vi.fn>;
let mockQuery: ReturnType<typeof vi.fn>;
let mockEnd: ReturnType<typeof vi.fn>;

describe("migrate script", () => {
  beforeEach(() => {
    mockReadDir = vi.fn();
    mockReadFile = vi.fn();
    mockQuery = vi.fn();
    mockEnd = vi.fn();
  });

  it("runs sql migrations in filename order", async () => {
    mockReadDir.mockResolvedValue(["002_more.sql", "001_init.sql", "notes.txt"]);
    mockReadFile.mockResolvedValue("SELECT 1;");

    await runWithDeps({
      fs: { readdir: mockReadDir, readFile: mockReadFile },
      path: {
        resolve: (...parts: string[]) => parts.join("/"),
        join: (...parts: string[]) => parts.join("/"),
      },
      Pool: class MockPool {
        query = mockQuery;
        end = mockEnd;
        constructor(_options: { connectionString: string; ssl: false | undefined }) {}
      },
      env: {
        DATABASE_URL: "postgres://postgres:postgres@localhost:5432/meowspace",
        PGSSLMODE: "disable",
      },
      cwd: () => "/repo",
    });

    expect(mockReadFile).toHaveBeenCalledTimes(2);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it("requires DATABASE_URL", async () => {
    await expect(
      runWithDeps({
        fs: { readdir: mockReadDir, readFile: mockReadFile },
        path: {
          resolve: (...parts: string[]) => parts.join("/"),
          join: (...parts: string[]) => parts.join("/"),
        },
        Pool: class MockPool {
          query = mockQuery;
          end = mockEnd;
          constructor(_options: { connectionString: string; ssl: false | undefined }) {}
        },
        env: {},
        cwd: () => "/repo",
      }),
    ).rejects.toThrow("DATABASE_URL is required");
  });
});
