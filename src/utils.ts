import fs from "fs";
import * as path from "path";
import { z } from "zod";

export const logInfoStep = (...details: unknown[]) => {
  console.log("\x1b[36m%s\x1b[0m", "  •", ...details);
};

export const logSuccessStep = (...details: unknown[]) => {
  console.log("\x1b[32m%s\x1b[0m", "  ✓", ...details);
};

export const logErrorStep = (...details: unknown[]) => {
  console.log("\x1b[31m%s\x1b[0m", "  ×", ...details);
};

const readFile = (filePath: string): string => {
  const resolver = process.platform === "win32" ? path.win32.resolve : path.resolve;
  return fs.readFileSync(resolver(process.cwd(), filePath), "utf-8");
};

export const safelyReadFile = (description: string, filePath?: string): string | undefined => {
  if (!filePath) return undefined;

  try {
    return readFile(filePath);
  } catch (e: unknown) {
    logErrorStep(`Error reading ${description}: ${filePath}`, e);
  }
};

export const readEnvVar = (name: string): string => {
  const value = process.env[name];
  try {
    return z.string().parse(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    logErrorStep(`Couldn't read environment variable: ${name}`);
    throw new Error(`Couldn't read environment variable: ${name}`);
  }
};
