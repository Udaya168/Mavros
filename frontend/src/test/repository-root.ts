import { resolve } from "node:path";

export const repositoryRoot = process.cwd().toLowerCase().endsWith("\\frontend")
  ? resolve(process.cwd(), "..")
  : process.cwd();
