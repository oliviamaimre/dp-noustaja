import { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chunkDocument, type ChunkInput } from "../src/lib/knowledge";

const prisma = new PrismaClient();

async function main() {
  const dir = path.join(process.cwd(), "knowledge");
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".txt")).sort();

  const chunks: ChunkInput[] = [];
  for (const file of files) {
    const text = await readFile(path.join(dir, file), "utf8");
    chunks.push(...chunkDocument(file, text));
  }

  // Only the knowledge base is touched; chats and messages are left alone.
  await prisma.$transaction([
    prisma.documentChunk.deleteMany(),
    prisma.documentChunk.createMany({ data: chunks }),
  ]);

  console.log(`Seeded ${chunks.length} chunks from ${files.length} files.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
