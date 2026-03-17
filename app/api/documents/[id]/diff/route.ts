import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDocxDiff } from "@/lib/docxDiff";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extract base name from filename by removing .docx and version suffix.
 * e.g. "MyPolicy_v2.docx" -> "MyPolicy"
 */
function getBaseName(fileName: string): string {
  return fileName
    .replace(/\.docx$/i, "")
    .replace(/[-_]?v\d+$/i, "")
    .replace(/[-_]$/, "")
    .trim();
}

/**
 * GET /api/documents/[id]/diff
 * Returns diff DOCX if previous version exists in DB, else JSON with hasPrevious: false.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const currentDoc = await prisma.document.findUnique({
    where: { id },
  });

  if (!currentDoc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const currentVersion = parseInt(currentDoc.version, 10);
  if (Number.isNaN(currentVersion) || currentVersion <= 1) {
    return NextResponse.json(
      { hasPrevious: false, message: "Previous version is not available." },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const baseName = getBaseName(currentDoc.fileName);
  const prevVersion = String(currentVersion - 1);

  const prevDoc = await prisma.document.findFirst({
    where: {
      version: prevVersion,
      OR: [
        { fileName: { startsWith: `${baseName}_v` } },
        { fileName: { startsWith: `${baseName}-v` } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!prevDoc) {
    return NextResponse.json(
      { hasPrevious: false, message: "Previous version is not available." },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const tmpDir = path.join(process.cwd(), "uploads", "diff-tmp");
  const sessionId = crypto.randomUUID();
  const sessionDir = path.join(tmpDir, sessionId);
  const prevPath = path.join(sessionDir, "prev.docx");
  const currPath = path.join(sessionDir, "curr.docx");
  const outputPath = path.join(sessionDir, "diff.docx");

  try {
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.writeFile(prevPath, Buffer.from(prevDoc.fileData));
    await fs.writeFile(currPath, Buffer.from(currentDoc.fileData));

    await runDocxDiff(prevPath, currPath, outputPath);

    const diffBuffer = await fs.readFile(outputPath);
    await fs.rm(sessionDir, { recursive: true, force: true });

    return new NextResponse(diffBuffer, {
      status: 200,
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `inline; filename="diff_${currentDoc.fileName}"`,
      },
    });
  } catch (err) {
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
    } catch {
      /* ignore cleanup */
    }
    console.error("Diff generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate diff." },
      { status: 500 },
    );
  }
}
