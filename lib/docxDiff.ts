import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import { diffWords } from "diff";

let _idCounter = 500;
const nextId = () => String(_idCounter++);

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitBodyChildren(xml: string): string[] {
  const bodyMatch = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) return [];
  const bodyInner = bodyMatch[1] ?? "";

  const children: string[] = [];
  let i = 0;

  while (i < bodyInner.length) {
    if (bodyInner[i] !== "<") {
      i++;
      continue;
    }

    const tagStart = i + 1;
    const tagNameEnd = bodyInner.indexOf(" ", tagStart);
    const tagNameEnd2 = bodyInner.indexOf(">", tagStart);
    const tagNameEndActual =
      tagNameEnd === -1
        ? tagNameEnd2
        : tagNameEnd2 === -1
          ? tagNameEnd
          : Math.min(tagNameEnd, tagNameEnd2);

    const tagName = bodyInner.slice(tagStart, tagNameEndActual);

    const selfClose = bodyInner.slice(i).match(/^<[^>]*\/>/);
    if (selfClose) {
      children.push(selfClose[0]);
      i += selfClose[0].length;
      continue;
    }

    const openTag = `<${tagName}`;
    const closeTag = `</${tagName}>`;
    let depth = 0;
    let j = i;

    while (j < bodyInner.length) {
      const nextOpen = bodyInner.indexOf(openTag, j);
      const nextClose = bodyInner.indexOf(closeTag, j);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        j = nextOpen + openTag.length;
      } else {
        depth--;
        j = nextClose + closeTag.length;
        if (depth === 0) break;
      }
    }

    children.push(bodyInner.slice(i, j));
    i = j;
  }

  return children.filter((c) => c.trim().length > 0);
}

function extractParagraphText(xml: string): string {
  return [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map((m) => m[1] ?? "")
    .join("");
}

const isParagraph = (xml: string) => xml.trimStart().startsWith("<w:p");
const isSectPr = (xml: string) => xml.trimStart().startsWith("<w:sectPr");

function extractPPr(paragraphXml: string): string {
  const m = paragraphXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  return m ? m[0] : "";
}

function buildInlineDiffRuns(
  prevText: string,
  currText: string,
  isoDate: string,
): string {
  const parts = diffWords(prevText, currText);
  const runs: string[] = [];

  for (const part of parts) {
    const raw = part.value ?? "";
    if (!raw) continue;
    const text = escapeXml(raw);

    if (part.added) {
      runs.push(
        `<w:ins w:id="${nextId()}" w:author="diff-tool" w:date="${isoDate}">` +
          `<w:r><w:rPr><w:color w:val="166534"/><w:u w:val="single"/></w:rPr>` +
          `<w:t xml:space="preserve">${text}</w:t></w:r>` +
          `</w:ins>`,
      );
    } else if (part.removed) {
      runs.push(
        `<w:del w:id="${nextId()}" w:author="diff-tool" w:date="${isoDate}">` +
          `<w:r><w:rPr><w:color w:val="991B1B"/><w:strike/></w:rPr>` +
          `<w:delText xml:space="preserve">${text}</w:delText></w:r>` +
          `</w:del>`,
      );
    } else {
      runs.push(
        `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`,
      );
    }
  }

  return runs.join("");
}

function markParagraphDeleted(paragraphXml: string, isoDate: string): string {
  const pPr = extractPPr(paragraphXml);
  const text = extractParagraphText(paragraphXml);
  if (!text.trim()) return paragraphXml;

  const delRun =
    `<w:del w:id="${nextId()}" w:author="diff-tool" w:date="${isoDate}">` +
    `<w:r><w:rPr><w:color w:val="991B1B"/><w:strike/></w:rPr>` +
    `<w:delText xml:space="preserve">${escapeXml(text)}</w:delText></w:r>` +
    `</w:del>`;

  return `<w:p>${pPr}${delRun}</w:p>`;
}

function markParagraphInserted(paragraphXml: string, isoDate: string): string {
  const pPr = extractPPr(paragraphXml);
  const text = extractParagraphText(paragraphXml);
  if (!text.trim()) return paragraphXml;

  const insRun =
    `<w:ins w:id="${nextId()}" w:author="diff-tool" w:date="${isoDate}">` +
    `<w:r><w:rPr><w:color w:val="166534"/><w:u w:val="single"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>` +
    `</w:ins>`;

  return `<w:p>${pPr}${insRun}</w:p>`;
}

function diffParagraphs(
  prevXml: string,
  currXml: string,
  isoDate: string,
): string {
  const prevText = extractParagraphText(prevXml);
  const currText = extractParagraphText(currXml);

  if (prevText === currText) return currXml;

  const pPr = extractPPr(currXml);

  const nonTextChildren = [
    ...currXml.matchAll(/<w:drawing[\s\S]*?<\/w:drawing>/g),
    ...currXml.matchAll(/<w:pict[\s\S]*?<\/w:pict>/g),
    ...currXml.matchAll(/<w:bookmarkStart[^>]*\/>/g),
    ...currXml.matchAll(/<w:bookmarkEnd[^>]*\/>/g),
    ...currXml.matchAll(/<w:hyperlink[\s\S]*?<\/w:hyperlink>/g),
  ]
    .map((m) => m[0])
    .join("");

  const diffRuns = buildInlineDiffRuns(prevText, currText, isoDate);

  return `<w:p>${pPr}${nonTextChildren}${diffRuns}</w:p>`;
}

type ParagraphMatch =
  | { type: "match"; prevIdx: number; currIdx: number }
  | { type: "insert"; currIdx: number }
  | { type: "delete"; prevIdx: number };

function matchParagraphs(
  prevParas: string[],
  currParas: string[],
): ParagraphMatch[] {
  const pTexts = prevParas.map(extractParagraphText);
  const cTexts = currParas.map(extractParagraphText);

  const P = prevParas.length;
  const C = currParas.length;

  const sim = (a: string, b: string): number => {
    const na = a.trim().toLowerCase();
    const nb = b.trim().toLowerCase();
    if (!na && !nb) return 1;
    if (!na || !nb) return 0;
    if (na === nb) return 1;

    const bigrams = (s: string) => {
      const set: string[] = [];
      for (let i = 0; i < s.length - 1; i++) set.push(s.slice(i, i + 2));
      return set;
    };
    const bg1 = bigrams(na);
    const bg2 = new Set(bigrams(nb));
    const matches = bg1.filter((b) => bg2.has(b)).length;
    return (2 * matches) / (bg1.length + bg2.size);
  };

  const dp: number[][] = Array.from({ length: P + 1 }, () =>
    new Array(C + 1).fill(0),
  );

  for (let i = 1; i <= P; i++) {
    for (let j = 1; j <= C; j++) {
      const s = sim(pTexts[i - 1] ?? "", cTexts[j - 1] ?? "");
      if (s >= 0.5) {
        dp[i]![j] = (dp[i - 1]![j - 1] ?? 0) + s;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j] ?? 0, dp[i]![j - 1] ?? 0);
      }
    }
  }

  const matches: ParagraphMatch[] = [];
  let i = P;
  let j = C;

  while (i > 0 || j > 0) {
    if (i === 0) {
      matches.push({ type: "insert", currIdx: j - 1 });
      j--;
    } else if (j === 0) {
      matches.push({ type: "delete", prevIdx: i - 1 });
      i--;
    } else {
      const s = sim(pTexts[i - 1] ?? "", cTexts[j - 1] ?? "");
      if (
        s >= 0.5 &&
        (dp[i]![j] ?? 0) ===
          (dp[i - 1]![j - 1] ?? 0) + s
      ) {
        matches.push({ type: "match", prevIdx: i - 1, currIdx: j - 1 });
        i--;
        j--;
      } else if ((dp[i - 1]![j] ?? 0) >= (dp[i]![j - 1] ?? 0)) {
        matches.push({ type: "delete", prevIdx: i - 1 });
        i--;
      } else {
        matches.push({ type: "insert", currIdx: j - 1 });
        j--;
      }
    }
  }

  return matches.reverse();
}

/**
 * Run paragraph-aware XML diff between two DOCX files.
 * Writes the result to outputDocxPath.
 */
export async function runDocxDiff(
  prevDocxPath: string,
  currentDocxPath: string,
  outputDocxPath: string,
): Promise<void> {
  const [prevBuffer, currBuffer] = await Promise.all([
    fs.readFile(prevDocxPath),
    fs.readFile(currentDocxPath),
  ]);

  const [prevZip, currZip] = await Promise.all([
    JSZip.loadAsync(prevBuffer),
    JSZip.loadAsync(currBuffer),
  ]);

  const prevXmlFile = prevZip.file("word/document.xml");
  const currXmlFile = currZip.file("word/document.xml");
  if (!prevXmlFile || !currXmlFile) {
    throw new Error("Could not find word/document.xml in one or both .docx files.");
  }

  const [prevXml, currXml] = await Promise.all([
    prevXmlFile.async("string"),
    currXmlFile.async("string"),
  ]);

  const isoDate = new Date().toISOString();

  const prevChildren = splitBodyChildren(prevXml);
  const currChildren = splitBodyChildren(currXml);

  const currSectPr = currChildren.find(isSectPr) ?? "";
  const currBodyChildren = currChildren.filter((c) => !isSectPr(c));
  const prevBodyChildren = prevChildren.filter((c) => !isSectPr(c));

  const prevParas = prevBodyChildren.filter(isParagraph);
  const currParas = currBodyChildren.filter(isParagraph);

  const editScript = matchParagraphs(prevParas, currParas);

  const diffedParas: string[] = [];

  for (const op of editScript) {
    if (op.type === "match") {
      diffedParas.push(
        diffParagraphs(
          prevParas[op.prevIdx] ?? "",
          currParas[op.currIdx] ?? "",
          isoDate,
        ),
      );
    } else if (op.type === "insert") {
      diffedParas.push(
        markParagraphInserted(currParas[op.currIdx] ?? "", isoDate),
      );
    } else {
      diffedParas.push(
        markParagraphDeleted(prevParas[op.prevIdx] ?? "", isoDate),
      );
    }
  }

  let paraPointer = 0;
  const newBodyChildren: string[] = [];

  for (const child of currBodyChildren) {
    if (isParagraph(child)) {
      if (paraPointer < diffedParas.length) {
        newBodyChildren.push(diffedParas[paraPointer++] ?? child);
      }
    } else {
      newBodyChildren.push(child);
    }
  }

  while (paraPointer < diffedParas.length) {
    newBodyChildren.push(diffedParas[paraPointer++] ?? "");
  }

  const newBodyInner =
    newBodyChildren.join("\n") + (currSectPr ? `\n${currSectPr}` : "");

  const patchedXml = currXml.replace(
    /(<w:body>)([\s\S]*?)(<\/w:body>)/,
    `$1\n${newBodyInner}\n$3`,
  );

  if (patchedXml === currXml) {
    throw new Error(
      "Could not locate <w:body> in the document XML. The file may be corrupt.",
    );
  }

  currZip.file("word/document.xml", patchedXml);

  const outputBuffer = await currZip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  await fs.mkdir(path.dirname(outputDocxPath), { recursive: true });
  await fs.writeFile(outputDocxPath, outputBuffer);
}
