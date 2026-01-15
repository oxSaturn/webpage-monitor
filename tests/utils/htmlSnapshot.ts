import * as parse5 from 'parse5';

export type NormalizeOuterHtmlOptions = {
  /** Apply extra regex replacements before formatting (after canonicalization). */
  extraReplacements?: Array<[RegExp, string]>;
  /** Replace standalone numbers with <num>. Default: true */
  replaceNumbers?: boolean;
  /** Replace long hex strings (32+) with <hash>. Default: true */
  replaceLongHexHashes?: boolean;
};

function sortAttributesRecursively(node: any) {
  if (!node || typeof node !== 'object') return;

  // parse5 default tree uses `attrs` on element nodes.
  if (Array.isArray(node.attrs)) {
    node.attrs.sort((a: any, b: any) => {
      const an = String(a?.name ?? '');
      const bn = String(b?.name ?? '');
      return an.localeCompare(bn);
    });
  }

  const children = node.childNodes;
  if (Array.isArray(children)) {
    for (const child of children) sortAttributesRecursively(child);
  }

  // Some nodes (e.g. document fragments) can have `content` (template).
  if (node.content) sortAttributesRecursively(node.content);
}

/**
 * Parses + re-serializes HTML while sorting attributes for deterministic output.
 * This avoids snapshot churn when libraries reorder attributes (e.g. HeadlessUI).
 */
export function canonicalizeHtml(html: string): string {
  // `outerHTML` is a single element string; parse as fragment so we can accept it directly.
  const fragment = parse5.parseFragment(html) as any;
  sortAttributesRecursively(fragment);
  return parse5.serialize(fragment);
}

/**
 * Normalizes `outerHTML` for readable + stable text snapshots.
 */
export function normalizeOuterHtml(html: string, options: NormalizeOuterHtmlOptions = {}): string {
  const {
    extraReplacements = [],
    replaceNumbers = true,
    replaceLongHexHashes = true,
  } = options;

  let out = canonicalizeHtml(html);

  // Collapse whitespace first (then we re-insert newlines for diff readability).
  out = out.replace(/\s+/g, ' ');

  for (const [pattern, replacement] of extraReplacements) {
    out = out.replace(pattern, replacement);
  }

  if (replaceNumbers) {
    out = out.replace(/\b\d+(\.\d+)?\b/g, '<num>');
  }

  if (replaceLongHexHashes) {
    out = out.replace(/[a-f0-9]{32,}/gi, '<hash>');
  }

  // Re-insert newlines for readable diffs.
  out = out
    .replace(/>\s+</g, '>\n<')
    .replace(/"\s+(?=[^=]+=)/g, '"\n')
    .trim();

  return out;
}
