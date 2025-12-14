"use server";
import { readFile } from "fs/promises";
import path from "path";

export async function loadContextConfig() {
  const filePath = path.join(process.cwd(), "config/contextConfig.json");
  const json = await readFile(filePath, "utf-8");
  return JSON.parse(json);
}
