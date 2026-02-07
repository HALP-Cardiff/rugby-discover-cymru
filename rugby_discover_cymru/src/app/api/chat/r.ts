import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

type Step = "AGE" | "EXPERIENCE" | "FITNESS" | "INTERESTS" | "AVAILABILITY" | "DONE";
type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type Answers = {
    ageGroup?: string;
    experience?: string;
    fitness?: string;
    interests?: string[]; // allow multiple interests
    availability?: string; // e.g. "Weekends", "Weekday evenings", etc.
};

type Session = {
    step : Step;
    messages: Msg[];
    answers: Answers;
};

const sessions = new Map<string, Session>();

function getOrCreateSession(sessionId: string | undefined): { id: string; session: Session } {
    const id = sessionId ?? crypto.randomUUID();
    
