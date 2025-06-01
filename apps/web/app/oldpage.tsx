// File: apps/web/app/page.tsx

import { loadContextConfig } from "@lib/server/loadContextConfig";
import DynamicContextPage from "../components/DynamicContextPage";
import ClientRoot from "../components/ai/ClientRoot";

export default async function Page() {
  const config = await loadContextConfig();
  return (
    <ClientRoot>
      <DynamicContextPage config={config} />
    </ClientRoot>
  );
}