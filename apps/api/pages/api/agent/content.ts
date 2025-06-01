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
                description: "Creating a new paradigm of leadership with a team of leaders not just a team with a leader.",
                longDescription: "Creating a new paradigm of leadership with a team of leaders not just a team with a leader.",
                videoWatched: false,
                worksheetSubmitted: false,
                progress: 70,
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
                description: "Use this power tool to convert every challenge into a powerful possibility. This technique involves viewing a problem from different perspectives to generate a wider range of potential solutions. When leaders come across challenges, instead of approaching them with a fixed mindset, they can encourage their teams to look at them from various angles. This can lead to...",
                longDescription: "Use this power tool to convert every challenge into a powerful possibility. This technique involves viewing a problem from different perspectives to generate a wider range of potential solutions. When leaders come across challenges, instead of approaching them with a fixed mindset, they can encourage their teams to look at them from various angles. This can lead to breakthrough solutions and foster a culture of innovation.",
                videoWatched: true,
                worksheetSubmitted: false,
                progress: 20,
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
                description: "This video presents an effective approach to leading team members with diverse personalities and responses to feedback. Learn a practical framework for identifying and managing three distinct types of people in your team, based on how they handle constructive criticism. In this video, you'll learn: A key factor in effective leadership and management How to...",
                longDescription: "This video presents an effective approach to leading team members with diverse personalities and responses to feedback. Learn a practical framework for identifying and managing three distinct types of people in your team, based on how they handle constructive criticism. In this video, you'll learn: A key factor in effective leadership and management How to adapt your approach for each type Practical tips for building a high-trust, high-performance team.",
                videoWatched: false,
                worksheetSubmitted: true,
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