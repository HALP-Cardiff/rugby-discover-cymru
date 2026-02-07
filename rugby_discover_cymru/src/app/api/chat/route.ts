import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

type Step = "AGE" | "EXPERIENCE" | "FITNESS" | "INTERESTS" | "AVAILABILITY" | "DONE";
type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type Answers = {
  ageGroup?: string;
  experience?: string;
  fitness?: string;
  interests?: string[]; 
  availability?: string; 
};

type Session = {
  step: Step;
  messages: Msg[];
  answers: Answers;
};

const sessions = new Map<string, Session>();

function getOrCreateSession(sessionId: string | undefined): { id: string; session: Session } {
  const id = sessionId ?? crypto.randomUUID();
  const existing = sessions.get(id);
  if (existing) return { id, session: existing };

  const session: Session = {
    step: "AGE",
    messages: [
      {
        role: "assistant",
        content:
          "Hi! Let's start with some quick questions so I can recommend suitable clubs/teams.\n\nFirst: what’s your age group?",
      },
    ],
    answers: {},
  };
  sessions.set(id, session);
  return { id, session };
}

function quickRepliesForStep(step: Step): string[] {
  switch (step) {
    case "AGE":
      return ["Under 18", "18–25", "26–35", "36–45", "46+"];
    case "EXPERIENCE":
      return ["Beginner", "Casual", "Intermediate", "Competitive"];
    case "FITNESS":
      return ["Low", "Medium", "High"];
    case "INTERESTS":
      return ["Competitive", "Social", "Inclusive", "Volunteering", "Done selecting"];
    case "AVAILABILITY":
      return ["Weekday evenings", "Weekends", "Flexible"];
    default:
      return [];
  }
}

function normalize(text: string) {
  return text.trim();
}

function recommend(answers: Answers): string {
  const interests = answers.interests?.join(", ") ?? "—";
  return [
    "Got it. Here're your choices:",
    "",
    `• Age group: ${answers.ageGroup ?? "—"}`,
    `• Experience: ${answers.experience ?? "—"}`,
    `• Fitness: ${answers.fitness ?? "—"}`,
    `• Interests: ${interests}`,
    `• Availability: ${answers.availability ?? "—"}`,
    "",
    "Here is the recommended club/team list:",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ message: "" }));
  const userMessage: string = typeof body?.message === "string" ? body.message : "";

  const cookieSessionId = req.cookies.get("session_id")?.value;
  const { id, session } = getOrCreateSession(cookieSessionId);

  if (!userMessage && session.messages.length > 0 && session.step === "AGE") {
    const res = NextResponse.json({
      messages: session.messages,
      quickReplies: quickRepliesForStep(session.step),
    });
    res.cookies.set("session_id", id, { httpOnly: true, path: "/" });
    return res;
  }

  const text = normalize(userMessage);
  if (text) session.messages.push({ role: "user", content: text });


  switch (session.step) {
    case "AGE": {
      session.answers.ageGroup = text || session.answers.ageGroup;
      session.step = "EXPERIENCE";
      session.messages.push({
        role: "assistant",
        content: "Nice. What’s your playing experience?",
      });
      break;
    }

    case "EXPERIENCE": {
      session.answers.experience = text || session.answers.experience;
      session.step = "FITNESS";
      session.messages.push({
        role: "assistant",
        content: "Cool. How would you rate your fitness level?",
      });
      break;
    }

    case "FITNESS": {
      session.answers.fitness = text || session.answers.fitness;
      session.step = "INTERESTS";
      session.answers.interests = session.answers.interests ?? [];
      session.messages.push({
        role: "assistant",
        content:
          "What are you mainly looking for? You can pick multiple.\nTap options below, or type your own. When finished, click “Done selecting”.",
      });
      break;
    }

    case "INTERESTS": {
      session.answers.interests = session.answers.interests ?? [];

      if (text.toLowerCase() === "done selecting" || text.toLowerCase() === "done") {
        session.step = "AVAILABILITY";
        session.messages.push({
          role: "assistant",
          content:
            "Great. What’s your availability?",
        });
        break;
      }

      if (text) {
        const existing = new Set(session.answers.interests.map((x) => x.toLowerCase()));
        if (!existing.has(text.toLowerCase())) {
          session.answers.interests.push(text);
          session.messages.push({
            role: "assistant",
            content: `Added: ${text}\nAnything else? Or press “Done selecting”`,
          });
        } else {
          session.messages.push({
            role: "assistant",
            content: `You already added “${text}”. Add more or press “Done selecting”.`,
          });
        }
      }
      break;
    }

    case "AVAILABILITY": {
      session.answers.availability = text || session.answers.availability;
      session.step = "DONE";
      session.messages.push({
        role: "assistant",
        content: recommend(session.answers),
      });
      break;
    }

    case "DONE": {
      session.messages.push({
        role: "assistant",
        content:
          "You’re already done. If you want to restart, refresh the page.",
      });
      break;
    }
  }

  sessions.set(id, session);

  const res = NextResponse.json({
    messages: session.messages,
    quickReplies: quickRepliesForStep(session.step),
  });

  res.cookies.set("session_id", id, { httpOnly: true, path: "/" });
  return res;
}
