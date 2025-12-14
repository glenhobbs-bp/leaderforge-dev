"use client";
import { useState, useEffect } from "react";
import { CopilotPopup } from "@copilotkit/react-ui";

export default function AIExperience() {
  const [isMounted, setIsMounted] = useState(false);

  // Only render CopilotKit on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return nothing during SSR
  }

  return (
    <CopilotPopup
      instructions={
        "You are assisting the user as best as you can. Answer in the best way possible given the data you have."
      }
      labels={{
        title: "Popup Assistant",
        initial: "Need any help?",
      }}
    />
  );
}
