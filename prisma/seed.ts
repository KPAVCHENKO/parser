/**
 * Сид БД: создаёт (или повышает) администратора для доступа в админку.
 * Логин/пароль можно переопределить через SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";
import { createUser, findUserByEmail } from "../src/server/services/users";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "kravshenkomaks@gmail.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin";

  const passwordHash = await hashPassword(password);
  let user = await findUserByEmail(email);

  if (!user) {
    user = await createUser({
      email,
      passwordHash,
      name: "Администратор",
      emailVerified: true,
    });
    console.log(`Создан админ: ${email}`);
  } else {
    console.log(`Пользователь ${email} найден — обновляю пароль и повышаю до ADMIN.`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN", passwordHash, emailVerified: new Date() },
  });

  // Админу — Pro без срока (до 2099 года), автосписаний не будет.
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: "PRO",
      status: "ACTIVE",
      interval: "YEAR",
      currentPeriodEnd: new Date("2099-12-31T00:00:00Z"),
      autoRenew: false,
    },
    update: {
      plan: "PRO",
      status: "ACTIVE",
      interval: "YEAR",
      currentPeriodEnd: new Date("2099-12-31T00:00:00Z"),
      autoRenew: false,
    },
  });

  console.log("Готово: админ с тарифом PRO (бессрочно). Откройте /admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
