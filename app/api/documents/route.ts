import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/lib/generated/prisma/client";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extract version from filename: v1 -> "1", v2 -> "2", v3 -> "3", etc.
 * Searches for v followed by digits (e.g. MyPolicy_v2.docx, doc_v3.docx).
 */
function parseVersion(fileName: string): string {
  const match = fileName.match(/v(\d+)/i);
  return match ? match[1] : "1";
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const docxFile = formData.get("docx");

    if (!(docxFile instanceof File)) {
      return NextResponse.json(
        { error: "A 'docx' file is required." },
        { status: 400 },
      );
    }

    if (!docxFile.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { error: "File must be a .docx document." },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await docxFile.arrayBuffer());
    const fileName = docxFile.name;
    const version = parseVersion(fileName);
    const mimeType =
      docxFile.type && docxFile.type !== "application/octet-stream"
        ? docxFile.type
        : DOCX_MIME;

    const document = await prisma.document.create({
      data: {
        fileName,
        mimeType,
        fileData: fileBuffer,
        version,
      },
    });

    const job = await prisma.job.create({
      data: {
        documentId: document.id,
        status: JobStatus.BACKLOG,
      },
      include: { document: true },
    });

    const policyName =
      fileName
        .replace(/\.docx$/i, "")
        .replace(/[_\-]/g, " ")
        .trim() || "Untitled Policy";

    return NextResponse.json(
      {
        job: {
          id: job.id,
          documentId: job.documentId,
          policyName,
          fileName: document.fileName,
          source: "Uploaded",
          version: document.version,
          status: job.status.toLowerCase(),
          complexity: "MEDIUM",
          createdAt: job.createdAt.toISOString(),
          currentUrl: `/api/documents/${document.id}`,
        },
        documentId: document.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/documents:", error);
    return NextResponse.json(
      { error: "Failed to store document." },
      { status: 500 },
    );
  }
}
