import { useEffect } from "react";
import useSWR from "swr";

export function useContextList() {
  console.log('Calling useContextList');
  const { data, error, isLoading } = useSWR(
    "/api/context/list",
    async (url) => {
      try {
        const res = await fetch(url, { credentials: "include" });
        console.log("[useContextList] Raw fetch response", res);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const json = await res.json();
        console.log("[useContextList] JSON", json);
        return json;
      } catch (err) {
        console.error("[useContextList] Fetch error", err);
        throw err;
      }
    }
  );

  useEffect(() => {
    console.log("[useContextList] SWR state", { data, error, isLoading });
  }, [data, error, isLoading]);

  return {
    contexts: data || [],
    error,
    loading: isLoading,
  };
}