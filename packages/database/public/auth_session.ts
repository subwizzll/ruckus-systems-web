import { sql } from "../neon";

export interface AuthSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export const authSessions = {
  async create(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await sql`
      INSERT INTO public.auth_session (user_id, token, expires_at, created_at)
      VALUES (${userId}, ${token}, ${expiresAt}, NOW())
    `;
  },

  async findByToken(token: string): Promise<AuthSession | null> {
    const result = await sql`
      SELECT * FROM public.auth_session
      WHERE token = ${token} AND expires_at > NOW()
    `;
    return result.length > 0 ? (result[0] as AuthSession) : null;
  },

  async delete(token: string): Promise<void> {
    await sql`DELETE FROM public.auth_session WHERE token = ${token}`;
  },
};
