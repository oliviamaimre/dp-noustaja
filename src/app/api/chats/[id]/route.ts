import { dbErrorResponse, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const chat = await prisma.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!chat) return Response.json({ error: "Vestlust ei leitud." }, { status: 404 });
    return Response.json(chat);
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const procedureType =
      typeof body?.procedureType === "string" && body.procedureType ? body.procedureType : null;
    const chat = await prisma.chatSession.update({ where: { id }, data: { procedureType } });
    return Response.json(chat);
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.chatSession.deleteMany({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
