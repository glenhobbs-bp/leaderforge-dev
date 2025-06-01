import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

export const env = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  API_PORT: parseInt(process.env.API_PORT || "3001", 10),
};
