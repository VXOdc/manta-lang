export type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  | "OPERATOR"
  | "COMPARISON"
  | "COLON"
  | "DOT"
  | "NEWLINE"
  | "INDENT"
  | "DEDENT"
  | "UNIT"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export const KEYWORDS = new Set([
  "camera", "detect", "track", "predict", "trajectory",
  "alert", "speak", "print", "ask", "if", "else", "when",
  "sensor", "connect", "start", "stop", "true", "false",
  "and", "or", "not", "var", "fn", "return", "for", "in",
  "risk", "collision_risk", "detected", "log",
]);

export const UNITS = new Set(["m", "cm", "km", "ms", "s", "fps"]);

export class LexerError extends Error {
  constructor(message: string, public line: number, public col: number) {
    super(`Lexer error at ${line}:${col} — ${message}`);
  }
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split("\n");
  const indentStack: number[] = [0];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const rawLine = lines[lineNum];
    const trimmed = rawLine.trimEnd();

    // Skip blank lines and comment-only lines
    if (trimmed.trim() === "" || trimmed.trim().startsWith("#")) continue;

    // Calculate indentation
    let indent = 0;
    while (indent < trimmed.length && trimmed[indent] === " ") indent++;

    const currentIndent = indentStack[indentStack.length - 1];

    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push({ type: "INDENT", value: "", line: lineNum + 1, col: 0 });
    } else {
      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        tokens.push({ type: "DEDENT", value: "", line: lineNum + 1, col: 0 });
      }
    }

    // Tokenize the line content
    let col = indent;
    const content = trimmed.slice(indent);

    let i = 0;
    while (i < content.length) {
      const c = content[i];

      // Skip inline whitespace
      if (c === " " || c === "\t") { i++; col++; continue; }

      // Skip comments
      if (c === "#") break;

      // String literals
      if (c === '"' || c === "'") {
        const quote = c;
        let str = "";
        i++; col++;
        while (i < content.length && content[i] !== quote) {
          str += content[i]; i++; col++;
        }
        i++; col++;
        tokens.push({ type: "STRING", value: str, line: lineNum + 1, col });
        continue;
      }

      // Numbers (including decimals)
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(content[i + 1] ?? ""))) {
        let num = "";
        while (i < content.length && /[0-9.]/.test(content[i])) {
          num += content[i]; i++; col++;
        }
        // Check for unit immediately after number (e.g. 2m, 500ms)
        let unit = "";
        while (i < content.length && /[a-z]/.test(content[i])) {
          unit += content[i]; i++; col++;
        }
        tokens.push({ type: "NUMBER", value: num, line: lineNum + 1, col });
        if (unit) {
          if (UNITS.has(unit)) {
            tokens.push({ type: "UNIT", value: unit, line: lineNum + 1, col });
          } else {
            // It's a number followed by an identifier
            tokens.push({ type: "IDENTIFIER", value: unit, line: lineNum + 1, col });
          }
        }
        continue;
      }

      // Operators and punctuation
      if (c === "<" || c === ">" || c === "=" || c === "!") {
        let op = c;
        if (content[i + 1] === "=") { op += "="; i++; col++; }
        tokens.push({ type: "COMPARISON", value: op, line: lineNum + 1, col });
        i++; col++;
        continue;
      }

      if (c === "+") { tokens.push({ type: "OPERATOR", value: "+", line: lineNum + 1, col }); i++; col++; continue; }
      if (c === "-") { tokens.push({ type: "OPERATOR", value: "-", line: lineNum + 1, col }); i++; col++; continue; }
      if (c === "*") { tokens.push({ type: "OPERATOR", value: "*", line: lineNum + 1, col }); i++; col++; continue; }
      if (c === "/") { tokens.push({ type: "OPERATOR", value: "/", line: lineNum + 1, col }); i++; col++; continue; }
      if (c === ":") { tokens.push({ type: "COLON", value: ":", line: lineNum + 1, col }); i++; col++; continue; }
      if (c === ".") { tokens.push({ type: "DOT", value: ".", line: lineNum + 1, col }); i++; col++; continue; }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(c)) {
        let word = "";
        while (i < content.length && /[a-zA-Z0-9_]/.test(content[i])) {
          word += content[i]; i++; col++;
        }
        const type: TokenType = KEYWORDS.has(word) ? "KEYWORD" : "IDENTIFIER";
        tokens.push({ type, value: word, line: lineNum + 1, col });
        continue;
      }

      throw new LexerError(`Unexpected character '${c}'`, lineNum + 1, col);
    }

    tokens.push({ type: "NEWLINE", value: "\n", line: lineNum + 1, col });
  }

  // Close any remaining open indents
  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: "DEDENT", value: "", line: lines.length, col: 0 });
  }

  tokens.push({ type: "EOF", value: "", line: lines.length + 1, col: 0 });
  return tokens;
}
