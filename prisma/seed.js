require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.role.upsert({
      where: { roleid: 1 },
      update: { rolename: "normal" },
      create: { roleid: 1, rolename: "normal" }
    });

    await tx.role.upsert({
      where: { roleid: 2 },
      update: {},
      create: { roleid: 2, rolename: "ADMIN" }
    });

    await tx.memberShip.upsert({
      where: { mid: 1 },
      update: {},
      create: { mid: 1, mname: "BASIC", score: 0 }
    });

    await tx.memberShip.upsert({
      where: { mid: 2 },
      update: { mname: "NORMAL", score: 10 },
      create: { mid: 2, mname: "NORMAL", score: 10 }
    });

    await tx.$queryRaw`
      SELECT setval(
        pg_get_serial_sequence('"Role"', 'roleid'),
        (SELECT MAX(roleid) FROM "Role"), true
      )
    `;

    await tx.$queryRaw`
      SELECT setval(
        pg_get_serial_sequence('"MemberShip"', 'mid'),
        (SELECT MAX(mid) FROM "MemberShip"), true
      )
    `;
  });

  console.log("Seed completed: normal, ADMIN, BASIC, NORMAL score 10");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
