// ─── Expressions ────────────────────────────────────────────────────────────

export interface NumberLiteral {
  kind: "NumberLiteral";
  value: number;
  unit?: string;
}

export interface StringLiteral {
  kind: "StringLiteral";
  value: string;
}

export interface BoolLiteral {
  kind: "BoolLiteral";
  value: boolean;
}

export interface Identifier {
  kind: "Identifier";
  name: string;
}

export interface MemberAccess {
  kind: "MemberAccess";
  object: Expression;
  property: string;
}

export interface BinaryExpr {
  kind: "BinaryExpr";
  left: Expression;
  operator: string;
  right: Expression;
}

export interface CallExpr {
  kind: "CallExpr";
  callee: Expression;
  args: Expression[];
}

export type Expression =
  | NumberLiteral
  | StringLiteral
  | BoolLiteral
  | Identifier
  | MemberAccess
  | BinaryExpr
  | CallExpr;

// ─── Statements ─────────────────────────────────────────────────────────────

export interface PrintStatement {
  kind: "PrintStatement";
  value: Expression;
}

export interface SpeakStatement {
  kind: "SpeakStatement";
  message: Expression;
}

export interface AlertStatement {
  kind: "AlertStatement";
  message: Expression;
}

export interface DetectStatement {
  kind: "DetectStatement";
  target: string;
}

export interface TrackStatement {
  kind: "TrackStatement";
  target: string;
}

export interface PredictStatement {
  kind: "PredictStatement";
  what: string;
}

export interface AskStatement {
  kind: "AskStatement";
  prompt: Expression;
  assignTo?: string;
}

export interface CameraStatement {
  kind: "CameraStatement";
  action: "start" | "stop";
}

export interface SensorStatement {
  kind: "SensorStatement";
  device: string;
  action: "connect" | "disconnect";
}

export interface LogStatement {
  kind: "LogStatement";
  value: Expression;
}

export interface VarDeclaration {
  kind: "VarDeclaration";
  name: string;
  value: Expression;
}

export interface IfStatement {
  kind: "IfStatement";
  condition: Expression;
  body: Statement[];
  elseBody?: Statement[];
}

export interface WhenStatement {
  kind: "WhenStatement";
  condition: Expression;
  body: Statement[];
}

export interface FnDeclaration {
  kind: "FnDeclaration";
  name: string;
  params: string[];
  body: Statement[];
}

export interface ReturnStatement {
  kind: "ReturnStatement";
  value?: Expression;
}

export interface ExpressionStatement {
  kind: "ExpressionStatement";
  expression: Expression;
}

export type Statement =
  | PrintStatement
  | SpeakStatement
  | AlertStatement
  | DetectStatement
  | TrackStatement
  | PredictStatement
  | AskStatement
  | CameraStatement
  | SensorStatement
  | LogStatement
  | VarDeclaration
  | IfStatement
  | WhenStatement
  | FnDeclaration
  | ReturnStatement
  | ExpressionStatement;

export interface Program {
  kind: "Program";
  body: Statement[];
}
