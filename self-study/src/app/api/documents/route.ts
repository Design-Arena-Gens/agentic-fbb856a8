import { analyzeDocument } from "@/lib/analysis";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.studyDocument.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = (formData.get("title") as string | null)?.trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "A PDF file is required." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { message: "File exceeds the 15MB limit." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    const text = textResult.text;
    const numpages = textResult.pages?.length ?? 0;

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { message: "Unable to extract enough text from this PDF." },
        { status: 400 },
      );
    }

    const analysis = analyzeDocument(text);

    const document = await prisma.studyDocument.create({
      data: {
        userId: session.user.id,
        title: title || file.name.replace(/\.pdf$/i, ""),
        originalName: file.name,
        pages: numpages ?? 0,
        textContent: text,
        highlights: analysis.highlights,
        summary: analysis.summary,
      },
    });

    return NextResponse.json({
      document,
      analysis: {
        summary: analysis.summary,
        keyConcepts: analysis.keyConcepts,
        highlights: analysis.highlights,
      },
    });
  } catch (error) {
    console.error("Document upload failed", error);
    return NextResponse.json(
      { message: "We could not process this document." },
      { status: 500 },
    );
  }
}
