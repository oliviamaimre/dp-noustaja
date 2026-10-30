import { dbErrorResponse, prisma } from "@/lib/db";
import { generateAnswer } from "@/lib/answer";
import { searchChunks } from "@/lib/search";
import { MAX_MESSAGE_LENGTH, type SourceCard } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const NOT_FOUND_TEXT =
  "Vabandust, ma ei leidnud menetlusskeemidest sellele küsimusele sobivat vastust. Proovi küsimust teisiti sõnastada, kasuta märksõnu (nt \"avalik väljapanek\", \"kehtestamine\") või vali menetluse liigiks \"Kõik menetlused\".";

function titleFrom(question: string) {
  return question.length > 60 ? `${question.slice(0, 57)}...` : question;
}

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const question = typeof body?.content === "string" ? body.content.trim() : "";
  if (!question) return Response.json({ error: "Küsimus on tühi." }, { status: 400 });
  if (question.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Küsimus on liiga pikk (kuni ${MAX_MESSAGE_LENGTH} tähemärki).` },
      { status: 400 },
    );
  }

  try {
    const chat = await prisma.chatSession.findUnique({
      where: { id },
      include: { _count: { select: { messages: true } } },
    });
    if (!chat) return Response.json({ error: "Vestlust ei leitud." }, { status: 404 });

    const userMessage = await prisma.message.create({
      data: { sessionId: id, role: "user", content: question },
    });

    const chunks = await searchChunks(question, chat.procedureType, 5);

    let answer: string;
    let sources: SourceCard[] = [];
    if (chunks.length === 0) {
      answer = NOT_FOUND_TEXT;
    } else {
      const aiAnswer = await generateAnswer(question, chunks);
      if (aiAnswer) {
        answer = aiAnswer;
        sources = chunks;
      } else {
        sources = chunks.slice(0, 3);
        answer =
          sources.length === 1
            ? "Leidsin menetlusskeemidest ühe küsimusega seotud lõigu:"
            : `Leidsin menetlusskeemidest ${sources.length} küsimusega kõige paremini seotud lõiku:`;
      }
    }

    const assistantMessage = await prisma.message.create({
      data: {
        sessionId: id,
        role: "assistant",
        content: answer,
        sources: sources as unknown as object,
      },
    });

    const session = await prisma.chatSession.update({
      where: { id },
      data: chat._count.messages === 0 ? { title: titleFrom(question) } : { updatedAt: new Date() },
    });

    return Response.json({ session, messages: [userMessage, assistantMessage] });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
