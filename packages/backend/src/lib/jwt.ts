import jwt from "jsonwebtoken";

const CLIENT_SECRET = import.meta.env.CLIENT_SECRET || process.env.CLIENT_SECRET || "";
const JWT_EXPIRES_IN = "7d";

if (!CLIENT_SECRET) {
  throw new Error("CLIENT_SECRET is required for JWT signing");
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export interface BookingTokenPayload {
  bookingId: string;
  action: "reschedule" | "cancel";
  email: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, CLIENT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, CLIENT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/** Fallback TTL when startTime is invalid or in the past so API can return policy errors instead of "Token expired". */
const BOOKING_TOKEN_FALLBACK_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
/** Minimum TTL so token is valid at least 1 hour from now. */
const BOOKING_TOKEN_MIN_TTL_SECONDS = 60 * 60;
/** Maximum TTL so token does not live forever. */
const BOOKING_TOKEN_MAX_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function computeBookingTokenTTL(startTime: Date): number {
  const date = startTime instanceof Date ? startTime : new Date(startTime);
  const now = new Date();
  const nowMs = now.getTime();
  const startMs = date.getTime();
  if (Number.isNaN(startMs)) {
    return BOOKING_TOKEN_FALLBACK_TTL_SECONDS;
  }
  if (startMs <= nowMs) {
    return BOOKING_TOKEN_FALLBACK_TTL_SECONDS;
  }
  const secondsUntilStart = Math.floor((startMs - nowMs) / 1000);
  return Math.min(
    Math.max(secondsUntilStart, BOOKING_TOKEN_MIN_TTL_SECONDS),
    BOOKING_TOKEN_MAX_TTL_SECONDS,
  );
}

export function generateRescheduleToken(
  bookingId: string,
  email: string,
  startTime: Date,
): string {
  const expiry = computeBookingTokenTTL(startTime);
  return jwt.sign({ bookingId, action: "reschedule" as const, email }, CLIENT_SECRET, {
    expiresIn: expiry,
  });
}

export function generateCancelToken(
  bookingId: string,
  email: string,
  startTime: Date,
): string {
  const expiry = computeBookingTokenTTL(startTime);
  return jwt.sign({ bookingId, action: "cancel" as const, email }, CLIENT_SECRET, {
    expiresIn: expiry,
  });
}

export function validateBookingToken(
  token: string,
  expectedAction: "reschedule" | "cancel",
): { valid: boolean; payload?: BookingTokenPayload; error?: string } {
  try {
    const decoded = jwt.verify(token, CLIENT_SECRET) as BookingTokenPayload;
    if (decoded.action !== expectedAction) {
      return { valid: false, error: `Invalid token action ${decoded.action}` };
    }
    if (!decoded.bookingId || !decoded.email) {
      return { valid: false, error: "Invalid token payload" };
    }
    return { valid: true, payload: decoded };
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return { valid: false, error: "Token has expired" };
    }
    return { valid: false, error: "Invalid token" };
  }
}

export function decodeBookingToken(token: string): BookingTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1] || "", "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}
