"use server";
import { readFile } from "fs/promises";
import path from "path";

export async function loadModuleConfig() {
  const filePath = path.join(process.cwd(), "config/moduleConfig.json");
  const json = await readFile(filePath, "utf-8");
  return JSON.parse(json);
}