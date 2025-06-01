import type { NextApiRequest, NextApiResponse } from "next";
import { ContentSchema } from "../../../../packages/agent-core/types/contentSchema";

const mockAgent = (navOptionId: string): ContentSchema => {
  switch (navOptionId) {
    case "dashboard":
      return {
        type: "Panel",
        props: {
          heading: "My Dashboard",
          description: "At a glance..",
          widgets: [
            {
              type: "StatCard",
              props: {
                title: "Bold Actions",
                value: 0,
                description: "No active bold actions",
              },
            },
            {
              type: "Leaderboard",
              props: {
                title: "Top performers this month",
                items: [
                  { name: "Admin Account", score: 21 },
                  { name: "Matt Higham", score: 11 },
                ],
              },
            },
          ],
        },
      };
    case "library":
      return {
        type: "Grid",
        props: {
          columns: 3,
          items: [
            {
              type: "Card",
              props: {
                image: "/thumb1.png",
                title: "Video One",
                subtitle: "Module 1",
                description: "Moving From Success to Prime",
                progress: 0.7,
                actions: [
                  { label: "Rewatch", action: "rewatch" },
                  { label: "Complete", action: "complete" }
                ]
              }
            },
            {
              type: "Card",
              props: {
                image: "/thumb2.png",
                title: "Video Two",
                subtitle: "Module 1",
                description: "The Power of Reframing",
                progress: 0.2,
                actions: [
                  { label: "Watch", action: "watch" },
                  { label: "Complete", action: "complete" }
                ]
              }
            },
            {
              type: "Card",
              props: {
                image: "/thumb1.png",
                title: "Video Three",
                subtitle: "Module 1",
                description: "Leading 3 Types of People",
                progress: 0,
                actions: [
                  { label: "Watch", action: "watch" },
                  { label: "Complete", action: "complete" }
                ]
              }
            }
          ]
        }
      };
    default:
      return {
        type: "Panel",
        props: {
          heading: "Welcome",
          description: "Select a section to get started.",
        },
      };
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { navOptionId } = req.body;
  const schema = mockAgent(navOptionId);
  res.status(200).json(schema);
}