/**
 * Auto-detection of minified code type.
 * Ported from the original browser-based unminify2 logic.
 */

export type CodeType = "js" | "css" | "html";

/**
 * Heuristic: CSS contains property blocks like `selector { ... }`
 * but is not wrapped in an HTML <style> tag.
 */
function isCss(code: string): boolean {
  if (
    /\w+\s*?\{[\s\S]+?\}/.test(code) &&
    !/<(style).*?>[\s\S]+?<\/\1>/.test(code)
  ) {
    return true;
  }
  return false;
}

/**
 * Heuristic: JS contains function declarations or var assignments,
 * but is not wrapped in an HTML <script> tag.
 */
function isJs(code: string): boolean {
  if (
    (/function\s*?\w+\s*?\(.*?\)\s*?\{[\s\S]+?\}/.test(code) ||
      /var\s*?\w+\s*?\=/.test(code)) &&
    !/<(script).*?>[\s\S]+?<\/\1>/.test(code)
  ) {
    return true;
  }
  return false;
}

/**
 * Heuristic: HTML contains opening/closing tag pairs like `<tag>...</tag>`.
 */
function isHtml(code: string): boolean {
  if (/<(\w+).*?>[\s\S]+?<\/\1>/.test(code)) {
    return true;
  }
  return false;
}

/**
 * Detect the type of code (JS, CSS, or HTML).
 * Falls back to HTML if detection is ambiguous.
 */
export function detectType(code: string): CodeType {
  if (isCss(code) && !isJs(code)) {
    return "css";
  }
  if (isJs(code)) {
    return "js";
  }
  if (isHtml(code)) {
    return "html";
  }
  // Default fallback — treat unknown content as HTML
  return "html";
}
