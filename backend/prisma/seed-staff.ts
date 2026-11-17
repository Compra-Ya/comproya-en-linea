/**
 * Siembra de la cuenta interna del Coordinador de Canal Digital (alcance reducido, docs/alcance; REQ-017).
 *
 * Uso:
 *   npm run seed:staff            → crea la cuenta, o actualiza su nombre y su contraseña si ya existe
 *
 * Variables (backend/.env; los valores de ejemplo están en .env.example):
 *   STAFF_SEED_EMAIL      correo con el que inicia sesión
 *   STAFF_SEED_PASSWORD   contraseña (mínimo 8 caracteres). No hay valor por defecto a propósito: en un entorno
 *                         desplegado nadie debe quedar con una contraseña conocida.
 *   STAFF_SEED_NAME       nombre que se muestra en el panel (opcional)
 */
import "dotenv/config";
import { PrismaClient, StaffRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

async function main() {
  const email = process.env.STAFF_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.STAFF_SEED_PASSWORD;
  const name = process.env.STAFF_SEED_NAME?.trim() || "Coordinador de Canal Digital";

  if (!email || !password) {
    throw new Error("Define STAFF_SEED_EMAIL y STAFF_SEED_PASSWORD en backend/.env (ver .env.example) antes de sembrar la cuenta interna");
  }
  if (password.length < 8) {
    throw new Error("STAFF_SEED_PASSWORD debe tener al menos 8 caracteres");
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await prisma.staffUser.upsert({
      where: { email },
      update: { name, passwordHash, active: true },
      create: { email, name, passwordHash, role: StaffRole.CHANNEL_COORDINATOR },
    });
    console.log(`✓ Cuenta interna lista: ${staff.email} (${staff.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
