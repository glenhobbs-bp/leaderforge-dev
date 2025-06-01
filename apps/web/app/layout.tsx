import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";

export const metadata = {
  title: 'LeaderForge',
  description: 'Building something epic!',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent="default"
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  )
}
