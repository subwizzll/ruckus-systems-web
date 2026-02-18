import { sql } from "../neon";

export interface Practitioner {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export const practitioners = {
  async findByEmail(email: string): Promise<Practitioner | null> {
    const result = await sql`
      SELECT * FROM practitioner.practitioners WHERE email = ${email}
    `;
    return result.length > 0 ? (result[0] as Practitioner) : null;
  },

  async findById(id: string): Promise<Practitioner | null> {
    const result = await sql`
      SELECT * FROM practitioner.practitioners WHERE id = ${id}
    `;
    return result.length > 0 ? (result[0] as Practitioner) : null;
  },

  async create(name: string, email: string): Promise<Practitioner> {
    const result = await sql`
      INSERT INTO practitioner.practitioners (name, email, created_at, updated_at)
      VALUES (${name}, ${email}, NOW(), NOW())
      RETURNING *
    `;
    return result[0] as Practitioner;
  },

  async createWithPassword(
    email: string,
    passwordHash: string,
    name: string,
  ): Promise<Practitioner | null> {
    try {
      const result = await sql`
        INSERT INTO practitioner.practitioners (email, password_hash, name, created_at, updated_at)
        VALUES (${email}, ${passwordHash}, ${name}, NOW(), NOW())
        RETURNING *
      `;

      return result[0] as Practitioner;
    } catch (error) {
      console.error("Practitioner creation failed:", error);
      return null;
    }
  },
};
