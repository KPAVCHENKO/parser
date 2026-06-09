/**
 * Сид БД: создаёт администратора для доступа в админку.
 * Логин/пароль берутся из env (SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD) или дефолтные.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";
import { createUser, findUserByEmail } from "../src/server/services/users";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@marketpulse.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";

  let user = await findUserByEmail(email);
  if (!user) {
    const passwordHash = await hashPassword(password);
    user = await createUser({
      email,
      passwordHash,
      name: "Администратор",
      emailVerified: true,
    });
    console.log(`Создан админ: ${email} / ${password}`);
  } else {
    console.log(`Пользователь ${email} уже существует — повышаю до ADMIN.`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  console.log("Готово. Войдите и откройте /admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
