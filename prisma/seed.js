require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.role.upsert({
      where: { roleid: 1 },
      update: {},
      create: { roleid: 1, rolename: "CUSTOMER" }
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

    // Đồng bộ bộ đếm ID sau khi thêm dữ liệu bằng ID cố định.
    await tx.$queryRaw`
      SELECT setval(
        pg_get_serial_sequence('"Role"', 'roleid'),
        (SELECT MAX(roleid) FROM "Role"),
        true
      )
    `;

    await tx.$queryRaw`
      SELECT setval(
        pg_get_serial_sequence('"MemberShip"', 'mid'),
        (SELECT MAX(mid) FROM "MemberShip"),
        true
      )
    `;
  });

  console.log("Seed completed: CUSTOMER, ADMIN, BASIC");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
