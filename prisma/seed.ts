import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
// import {
//   cloneTemplateWithNewPageIds,
//   createDocumentTemplateWithIds,
// } from "../src/lib/document-template";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  const hashedPassword = await bcrypt.hash("Christ2315!", SALT_ROUNDS);

  const [admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "sarahrichfit23@gmail.com" },
      update: {},
      create: {
        email: "sarahrichfit23@gmail.com",
        password: hashedPassword,
        name: "Sarah Richardson",
        role: Role.ADMIN,
        isPasswordChanged: true,
        isActive: true,
      },
    }),
    // prisma.user.upsert({
    //   where: { email: "coach@example.com" },
    //   update: {},
    //   create: {
    //     email: "coach@example.com",
    //     password: hashedPassword,
    //     name: "Coach Carter",
    //     role: Role.COACH,
    //     isPasswordChanged: true,
    //     isActive: true,
    //   },
    // }),
    // prisma.user.upsert({
    //   where: { email: "client@example.com" },
    //   update: {},
    //   create: {
    //     email: "client@example.com",
    //     password: hashedPassword,
    //     name: "Client Cole",
    //     role: Role.CLIENT,
    //     isPasswordChanged: true,
    //     isActive: true,
    //   },
    // }),
  ]);

  // const coachTemplate = createDocumentTemplateWithIds();
  // const clientDocument = cloneTemplateWithNewPageIds(coachTemplate);
  // const coachTemplateJson = coachTemplate as unknown as Prisma.InputJsonValue;
  // const clientDocumentJson = clientDocument as unknown as Prisma.InputJsonValue;

  // const coachProfile = await prisma.coachProfile.upsert({
  //   where: { userId: coachUser.id },
  //   update: {
  //     template: coachTemplateJson,
  //     isProfileComplete: true,
  //   },
  //   create: {
  //     userId: coachUser.id,
  //     template: coachTemplateJson,
  //     isProfileComplete: true,
  //   },
  // });

  // const clientProfile = await prisma.clientProfile.upsert({
  //   where: { userId: clientUser.id },
  //   update: {
  //     coachId: coachProfile.id,
  //     document: clientDocumentJson,
  //   },
  //   create: {
  //     userId: clientUser.id,
  //     coachId: coachProfile.id,
  //     document: clientDocumentJson,
  //     totalPhases: 3,
  //   },
  // });

  // await Promise.all(
  //   [1, 2, 3].map((phaseNumber) =>
  //     prisma.progress.upsert({
  //       where: {
  //         clientProfileId_phaseNumber: {
  //           clientProfileId: clientProfile.id,
  //           phaseNumber,
  //         },
  //       },
  //       update: {},
  //       create: {
  //         clientProfileId: clientProfile.id,
  //         phaseNumber,
  //         isCompleted: phaseNumber === 1,
  //       },
  //     })
  //   )
  // );

  console.log("Seed data created:", {
    adminEmail: admin.email,
    // coachEmail: coachUser.email,
    // clientEmail: clientUser.email,
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
