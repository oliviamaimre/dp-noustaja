import { dbErrorResponse, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const chats = await prisma.chatSession.findMany({ orderBy: { updatedAt: "desc" } });
    return Response.json(chats);
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const procedureType =
      typeof body?.procedureType === "string" && body.procedureType ? body.procedureType : null;
    const chat = await prisma.chatSession.create({
      data: { title: "Uus vestlus", procedureType },
    });
    return Response.json(chat, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
