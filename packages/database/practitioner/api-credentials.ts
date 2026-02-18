import { sql } from "../neon";

export interface ApiCredential {
  id: string;
  practitioner_id: string;
  provider: "google" | "zoom" | "stripe";
  external_account_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: Date | null;
  scope: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export const apiCredentials = {
  async upsert(
    practitionerId: string,
    provider: "google" | "zoom" | "stripe",
    externalAccountId: string,
    data: {
      access_token?: string | null;
      refresh_token?: string | null;
      token_expires_at?: Date | null;
      scope?: string[] | null;
    },
  ): Promise<ApiCredential> {
    const result = await sql`
      INSERT INTO practitioner.api_credentials (
        practitioner_id,
        provider,
        external_account_id,
        access_token,
        refresh_token,
        token_expires_at,
        scope,
        updated_at
      ) VALUES (
        ${practitionerId},
        ${provider},
        ${externalAccountId},
        ${data.access_token || null},
        ${data.refresh_token || null},
        ${data.token_expires_at || null},
        ${data.scope || null},
        NOW()
      )
      ON CONFLICT (practitioner_id, provider, external_account_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        scope = EXCLUDED.scope,
        updated_at = NOW()
      RETURNING *
    `;
    return result[0] as ApiCredential;
  },
};
