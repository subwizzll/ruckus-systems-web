import { practitioners } from "@workspace/database";
import { hashPassword } from "../src/lib/passwordUtils";

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME;

  if (!adminEmail || !adminPassword || !adminName) {
    throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME are required");
  }

  const existing = await practitioners.findByEmail(adminEmail);
  if (existing) {
    console.log(`Admin user already exists: ${adminEmail}`);
    return;
  }

  const passwordHash = await hashPassword(adminPassword);
  const user = await practitioners.createWithPassword(adminEmail, passwordHash, adminName);
  if (!user) {
    throw new Error("Failed to create admin user");
  }
  console.log(`Admin user created successfully: ${adminEmail}`);
}

seedAdminUser().catch((error) => {
  console.error(error);
  process.exit(1);
});
