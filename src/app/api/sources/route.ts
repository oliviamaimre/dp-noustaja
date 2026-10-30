import { dbErrorResponse, prisma } from "@/lib/db";
import { pdfUrlFor } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.documentChunk.findMany({
      distinct: ["sourceFile"],
      select: { sourceFile: true, docTitle: true, procedureType: true },
      orderBy: { sourceFile: "asc" },
    });
    return Response.json(rows.map((r) => ({ ...r, pdfUrl: pdfUrlFor(r.sourceFile) })));
  } catch (error) {
    return dbErrorResponse(error);
  }
}
