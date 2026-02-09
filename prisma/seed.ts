import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Gate seed in non-development environments
  if (
    process.env.ALLOW_SEED !== "true" &&
    process.env.NODE_ENV === "production"
  ) {
    console.log("Seed disabled in production (set ALLOW_SEED=true to enable)");
    process.exit(0);
  }

  // IMPORTANT: This seed only creates/updates the app user record in Prisma.
  // For login to work, a corresponding user MUST exist in Supabase Auth.
  // Create the Supabase Auth user manually via:
  //   1. Supabase Dashboard → Authentication → Users → Add User
  //   2. Or use supabase.auth.admin.createUser() in a separate script
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
  console.log(
    "\n⚠️  IMPORTANT: Ensure this user exists in Supabase Auth for login to work!",
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
