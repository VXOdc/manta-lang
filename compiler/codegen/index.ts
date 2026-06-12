import * as AST from "../ast/index.js";

const RUNTIME_IMPORT = `import { camera, detect, track, predict, speak, alert, ask, sensor, log, __manta } from "@manta/runtime";`;

export class CodeGenerator {
  private indent = 0;
  private output: string[] = [];

  private line(code: string) {
    this.output.push("  ".repeat(this.indent) + code);
  }

  private push() { this.indent++; }
  private pop() { this.indent = Math.max(0, this.indent - 1); }

  generate(program: AST.Program): string {
    this.output = [];
    this.line(RUNTIME_IMPORT);
    this.line("");
    this.line("(async () => {");
    this.push();

    for (const stmt of program.body) {
      this.emitStatement(stmt);
    }

    this.pop();
    this.line("})();");
    return this.output.join("\n");
  }

  // ─── Statements ──────────────────────────────────────────────────────────

  private emitStatement(stmt: AST.Statement) {
    switch (stmt.kind) {
      case "PrintStatement":
        this.line(`console.log(${this.emitExpr(stmt.value)});`);
        break;

      case "LogStatement":
        this.line(`log(${this.emitExpr(stmt.value)});`);
        break;

      case "SpeakStatement":
        this.line(`await speak(${this.emitExpr(stmt.message)});`);
        break;

      case "AlertStatement":
        this.line(`await alert(${this.emitExpr(stmt.message)});`);
        break;

      case "DetectStatement":
        this.line(`const ${stmt.target}Detection = await detect("${stmt.target}");`);
        this.line(`const detected = ${stmt.target}Detection.detected;`);
        this.line(`const ${stmt.target} = ${stmt.target}Detection;`);
        break;

      case "TrackStatement":
        this.line(`await track("${stmt.target}");`);
        break;

      case "PredictStatement":
        this.line(`const ${stmt.what} = await predict("${stmt.what}");`);
        break;

      case "AskStatement": {
        const assignTo = stmt.assignTo ?? "__response";
        this.line(`const ${assignTo} = await ask(${this.emitExpr(stmt.prompt)});`);
        if (!stmt.assignTo) {
          this.line(`console.log(${assignTo});`);
        }
        break;
      }

      case "CameraStatement":
        this.line(`await camera.${stmt.action}();`);
        break;

      case "SensorStatement":
        this.line(`await sensor("${stmt.device}").${stmt.action}();`);
        break;

      case "VarDeclaration":
        this.line(`let ${stmt.name} = ${this.emitExpr(stmt.value)};`);
        break;

      case "IfStatement":
        this.line(`if (${this.emitExpr(stmt.condition)}) {`);
        this.push();
        for (const s of stmt.body) this.emitStatement(s);
        this.pop();
        if (stmt.elseBody) {
          this.line("} else {");
          this.push();
          for (const s of stmt.elseBody) this.emitStatement(s);
          this.pop();
        }
        this.line("}");
        break;

      case "WhenStatement":
        this.line(`if (${this.emitExpr(stmt.condition)}) {`);
        this.push();
        for (const s of stmt.body) this.emitStatement(s);
        this.pop();
        this.line("}");
        break;

      case "FnDeclaration":
        this.line(`async function ${stmt.name}(${stmt.params.join(", ")}) {`);
        this.push();
        for (const s of stmt.body) this.emitStatement(s);
        this.pop();
        this.line("}");
        break;

      case "ReturnStatement":
        this.line(stmt.value ? `return ${this.emitExpr(stmt.value)};` : "return;");
        break;

      case "ExpressionStatement":
        this.line(`${this.emitExpr(stmt.expression)};`);
        break;
    }
  }

  // ─── Expressions ─────────────────────────────────────────────────────────

  private emitExpr(expr: AST.Expression): string {
    switch (expr.kind) {
      case "NumberLiteral":
        // Convert units to SI for the runtime (2m → 2, 500ms → 0.5)
        if (expr.unit === "m" || expr.unit === "cm" || expr.unit === "km") {
          return String(expr.value);
        }
        if (expr.unit === "ms") return String(expr.value / 1000);
        return String(expr.value);

      case "StringLiteral":
        return JSON.stringify(expr.value);

      case "BoolLiteral":
        return String(expr.value);

      case "Identifier":
        return expr.name;

      case "MemberAccess":
        return `${this.emitExpr(expr.object)}.${expr.property}`;

      case "BinaryExpr":
        return `(${this.emitExpr(expr.left)} ${expr.operator} ${this.emitExpr(expr.right)})`;

      case "CallExpr":
        return `${this.emitExpr(expr.callee)}(${expr.args.map((a) => this.emitExpr(a)).join(", ")})`;
    }
  }
}

export function generate(program: AST.Program): string {
  return new CodeGenerator().generate(program);
}
