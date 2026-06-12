import { Token, TokenType, tokenize } from "../lexer/index.js";
import * as AST from "../ast/index.js";

export class ParseError extends Error {
  constructor(message: string, public token: Token) {
    super(`Parse error at ${token.line}:${token.col} — ${message} (got '${token.value || token.type}')`);
  }
}

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(source: string) {
    this.tokens = tokenize(source).filter(
      (t) => t.type !== "NEWLINE" || false
    );
    // Keep NEWLINEs — we use them as statement terminators
    this.tokens = tokenize(source);
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: "EOF", value: "", line: 0, col: 0 };
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    this.pos++;
    return t;
  }

  private check(type: TokenType, value?: string): boolean {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }

  private eat(type: TokenType, value?: string): Token {
    const t = this.peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new ParseError(`Expected ${type}${value ? ` '${value}'` : ""}`, t);
    }
    return this.advance();
  }

  private skipNewlines() {
    while (this.check("NEWLINE")) this.advance();
  }

  // ─── Public entry point ──────────────────────────────────────────────────

  parse(): AST.Program {
    const body: AST.Statement[] = [];
    this.skipNewlines();
    while (!this.check("EOF")) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }
    return { kind: "Program", body };
  }

  // ─── Statements ──────────────────────────────────────────────────────────

  private parseStatement(): AST.Statement {
    const t = this.peek();

    if (t.type === "KEYWORD") {
      switch (t.value) {
        case "print":   return this.parsePrint();
        case "speak":   return this.parseSpeak();
        case "alert":   return this.parseAlert();
        case "log":     return this.parseLog();
        case "detect":  return this.parseDetect();
        case "track":   return this.parseTrack();
        case "predict": return this.parsePredict();
        case "ask":     return this.parseAsk();
        case "camera":  return this.parseCamera();
        case "sensor":  return this.parseSensor();
        case "if":      return this.parseIf();
        case "when":    return this.parseWhen();
        case "var":     return this.parseVar();
        case "fn":      return this.parseFn();
        case "return":  return this.parseReturn();
      }
    }

    // Expression statement (assignments, calls, member access)
    const expr = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "ExpressionStatement", expression: expr };
  }

  private eatNewlineOrEOF() {
    if (this.check("NEWLINE")) this.advance();
    else if (!this.check("EOF") && !this.check("DEDENT")) {
      // Allow missing newlines gracefully
    }
  }

  private parsePrint(): AST.PrintStatement {
    this.eat("KEYWORD", "print");
    const value = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "PrintStatement", value };
  }

  private parseSpeak(): AST.SpeakStatement {
    this.eat("KEYWORD", "speak");
    const message = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "SpeakStatement", message };
  }

  private parseAlert(): AST.AlertStatement {
    this.eat("KEYWORD", "alert");
    const message = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "AlertStatement", message };
  }

  private parseLog(): AST.LogStatement {
    this.eat("KEYWORD", "log");
    const value = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "LogStatement", value };
  }

  private parseDetect(): AST.DetectStatement {
    this.eat("KEYWORD", "detect");
    const target = this.eat("IDENTIFIER").value;
    this.eatNewlineOrEOF();
    return { kind: "DetectStatement", target };
  }

  private parseTrack(): AST.TrackStatement {
    this.eat("KEYWORD", "track");
    const target = this.eat("IDENTIFIER").value;
    this.eatNewlineOrEOF();
    return { kind: "TrackStatement", target };
  }

  private parsePredict(): AST.PredictStatement {
    this.eat("KEYWORD", "predict");
    const what = this.eat("IDENTIFIER").value;
    this.eatNewlineOrEOF();
    return { kind: "PredictStatement", what };
  }

  private parseAsk(): AST.AskStatement {
    this.eat("KEYWORD", "ask");
    const prompt = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "AskStatement", prompt };
  }

  private parseCamera(): AST.CameraStatement {
    this.eat("KEYWORD", "camera");
    this.eat("DOT");
    const action = this.eat("KEYWORD");
    if (action.value !== "start" && action.value !== "stop") {
      throw new ParseError("Expected 'start' or 'stop' after camera.", action);
    }
    this.eatNewlineOrEOF();
    return { kind: "CameraStatement", action: action.value as "start" | "stop" };
  }

  private parseSensor(): AST.SensorStatement {
    this.eat("KEYWORD", "sensor");
    const device = this.eat("IDENTIFIER").value;
    this.eat("DOT");
    const actionTok = this.eat("KEYWORD");
    if (actionTok.value !== "connect" && actionTok.value !== "disconnect") {
      throw new ParseError("Expected 'connect' or 'disconnect' after sensor.", actionTok);
    }
    this.eatNewlineOrEOF();
    return { kind: "SensorStatement", device, action: actionTok.value as "connect" | "disconnect" };
  }

  private parseBlock(): AST.Statement[] {
    this.skipNewlines();
    this.eat("INDENT");
    this.skipNewlines();
    const body: AST.Statement[] = [];
    while (!this.check("DEDENT") && !this.check("EOF")) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }
    if (this.check("DEDENT")) this.advance();
    return body;
  }

  private parseIf(): AST.IfStatement {
    this.eat("KEYWORD", "if");
    const condition = this.parseExpression();
    this.eat("COLON");
    const body = this.parseBlock();

    let elseBody: AST.Statement[] | undefined;
    this.skipNewlines();
    if (this.check("KEYWORD", "else")) {
      this.advance();
      this.eat("COLON");
      elseBody = this.parseBlock();
    }

    return { kind: "IfStatement", condition, body, elseBody };
  }

  private parseWhen(): AST.WhenStatement {
    this.eat("KEYWORD", "when");
    const condition = this.parseExpression();
    this.eat("COLON");
    const body = this.parseBlock();
    return { kind: "WhenStatement", condition, body };
  }

  private parseVar(): AST.VarDeclaration {
    this.eat("KEYWORD", "var");
    const name = this.eat("IDENTIFIER").value;
    this.eat("COMPARISON", "=");
    const value = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "VarDeclaration", name, value };
  }

  private parseFn(): AST.FnDeclaration {
    this.eat("KEYWORD", "fn");
    const name = this.eat("IDENTIFIER").value;
    const params: string[] = [];
    // optional param list (space-separated identifiers before colon)
    while (this.check("IDENTIFIER")) {
      params.push(this.advance().value);
    }
    this.eat("COLON");
    const body = this.parseBlock();
    return { kind: "FnDeclaration", name, params, body };
  }

  private parseReturn(): AST.ReturnStatement {
    this.eat("KEYWORD", "return");
    if (this.check("NEWLINE") || this.check("EOF")) {
      this.eatNewlineOrEOF();
      return { kind: "ReturnStatement" };
    }
    const value = this.parseExpression();
    this.eatNewlineOrEOF();
    return { kind: "ReturnStatement", value };
  }

  // ─── Expressions ─────────────────────────────────────────────────────────

  private parseExpression(): AST.Expression {
    return this.parseComparison();
  }

  private parseComparison(): AST.Expression {
    let left = this.parseAdditive();
    while (this.check("COMPARISON")) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { kind: "BinaryExpr", left, operator: op, right };
    }
    return left;
  }

  private parseAdditive(): AST.Expression {
    let left = this.parseUnary();
    while (this.check("OPERATOR") && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: "BinaryExpr", left, operator: op, right };
    }
    return left;
  }

  private parseUnary(): AST.Expression {
    return this.parsePrimary();
  }

  private parsePrimary(): AST.Expression {
    const t = this.peek();

    if (t.type === "STRING") {
      this.advance();
      return { kind: "StringLiteral", value: t.value };
    }

    if (t.type === "NUMBER") {
      this.advance();
      const num: AST.NumberLiteral = { kind: "NumberLiteral", value: parseFloat(t.value) };
      if (this.check("UNIT")) {
        num.unit = this.advance().value;
      }
      return num;
    }

    if (t.type === "KEYWORD" && (t.value === "true" || t.value === "false")) {
      this.advance();
      return { kind: "BoolLiteral", value: t.value === "true" };
    }

    if (t.type === "IDENTIFIER" || t.type === "KEYWORD") {
      this.advance();
      let expr: AST.Expression = { kind: "Identifier", name: t.value };

      // Member access chain: foo.bar.baz
      while (this.check("DOT")) {
        this.advance();
        const prop = this.advance();
        expr = { kind: "MemberAccess", object: expr, property: prop.value };
      }

      return expr;
    }

    throw new ParseError(`Unexpected token`, t);
  }
}

export function parse(source: string): AST.Program {
  return new Parser(source).parse();
}
