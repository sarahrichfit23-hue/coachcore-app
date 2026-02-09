import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Gate seed in non-development environments
  if (process.env.ALLOW_SEED !== "true" && process.env.NODE_ENV === "production") {
    console.log("Seed disabled in production (set ALLOW_SEED=true to enable)");
    process.exit(0);
  }

  const [admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "sarahrichfit23@gmail.com" },
      update: {
        role: Role.ADMIN,
        isActive: true,
        isPasswordChanged: true, // optional
        name: "Sarah Richardson",
      },
      create: {
        email: "sarahrichfit23@gmail.com",
        role: Role.ADMIN,
        isActive: true,
        isPasswordChanged: true, // optional
        name: "Sarah Richardson",
      },
    }),
  ]);

  console.log("Seed data created/updated:", {
    adminEmail: admin.email,
  });
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
