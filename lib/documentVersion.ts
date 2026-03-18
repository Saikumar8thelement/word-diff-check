/**
 * Document version utilities.
 * MyPolicy_v1.docx and MyPolicy_2.docx are treated as the SAME document
 * (different versions) - "v" is ignored when determining document identity.
 */

/**
 * Extract version number from filename.
 * Supports: v1, _v1, -v1, _1, -1 (e.g. version_1.docx, version_v2.docx).
 */
export function parseVersion(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.docx$/i, "");
  const match = nameWithoutExt.match(/(?:[-_]?v|[-_])(\d+)$/i);
  return match ? match[1] : "1";
}

/**
 * Extract base name from filename for document identity.
 * Same document = same base name. Ignores "v" - MyPolicy_v1 and MyPolicy_2 → "MyPolicy".
 */
export function getBaseName(fileName: string): string {
  return fileName
    .replace(/\.docx$/i, "")
    .replace(/(?:[-_]?v|[-_])\d+$/i, "")
    .replace(/[-_]$/, "")
    .trim();
}

/**
 * Check if two file names refer to the same document (different versions).
 */
export function isSameDocument(fileName1: string, fileName2: string): boolean {
  return getBaseName(fileName1) === getBaseName(fileName2);
}
