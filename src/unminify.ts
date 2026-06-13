import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { css_beautify, js_beautify, html_beautify } = require("js-beautify") as {
  css_beautify: (code: string, opts?: Record<string, unknown>) => string;
  js_beautify: (code: string, opts?: Record<string, unknown>) => string;
  html_beautify: (code: string, opts?: Record<string, unknown>) => string;
};
import { detectType, CodeType } from "./detector.js";

export interface UnminifyResult {
  /** The detected or user-specified code type. */
  type: CodeType;
  /** The unminified / beautified source code. */
  unminified: string;
}

/**
 * Unminify / beautify source code.
 *
 * @param code  The minified or compressed source code.
 * @param type  Optional explicit type hint. Defaults to "auto" which
 *              runs regex-based detection. Pass "js", "css", or "html"
 *              to skip detection.
 * @returns The detected type and the beautified result.
 */
export function unminify(
  code: string,
  type: CodeType | "auto" = "auto"
): UnminifyResult {
  const resolvedType: CodeType =
    type === "auto" ? detectType(code) : type;

  let unminified: string;

  switch (resolvedType) {
    case "css":
      unminified = css_beautify(code, {
        indent_size: 2,
        indent_char: " ",
      });
      break;
    case "js":
      unminified = js_beautify(code, {
        indent_size: 2,
        indent_char: " ",
      });
      break;
    case "html":
    default:
      unminified = html_beautify(code, {
        indent_size: 2,
        indent_char: " ",
      });
      break;
  }

  return { type: resolvedType, unminified };
}
