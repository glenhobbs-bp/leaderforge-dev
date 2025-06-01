// File: apps/web/app/page.tsx

import { loadContextConfig } from "@lib/server/loadContextConfig";
import DynamicContextPage from "@/components/DynamicContextPage";

export default async function Page() {
  const config = await loadContextConfig();
  return <DynamicContextPage config={config} />;
}
