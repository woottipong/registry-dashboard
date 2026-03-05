import { getIronSession, SessionOptions } from "iron-session"
import { cookies } from "next/headers"
import { config } from "@/lib/config"

export interface SessionData {
  user?: {
    username: string
  }
}

const sessionOptions: SessionOptions = {
  password: config.SESSION_SECRET,
  cookieName: "registry-dashboard-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
}

export async function getSession(): Promise<import("iron-session").IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function getSessionData(): Promise<SessionData> {
  const session = await getSession()
  return session
}
