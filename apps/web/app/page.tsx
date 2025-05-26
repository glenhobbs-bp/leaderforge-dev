// File: apps/web/app/page.tsx

import { loadModuleConfig } from "@lib/server/loadModuleConfig";
import DynamicModulePage from "@/components/DynamicModulePage";

export default async function Page() {
  const config = await loadModuleConfig();
  return <DynamicModulePage config={config} />;
}