import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(document.fileData, {
    status: 200,
    headers: {
      "Content-Type":
        document.mimeType ||
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `inline; filename="${document.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
