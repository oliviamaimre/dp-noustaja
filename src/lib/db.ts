import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function dbErrorResponse(error: unknown) {
  console.error(error);
  return Response.json(
    { error: "Andmebaasiga ei saanud ühendust. Palun proovi mõne hetke pärast uuesti." },
    { status: 503 },
  );
}
