#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve, basename, extname } from "path";
import { parse } from "./parser/index.js";
import { generate } from "./codegen/index.js";

export { parse } from "./parser/index.js";
export { generate } from "./codegen/index.js";
export { tokenize } from "./lexer/index.js";
export * as AST from "./ast/index.js";

export function compile(source: string): string {
  const ast = parse(source);
  return generate(ast);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`
  manta — The Manta language compiler

  Usage:
    manta compile <file.mt>     Compile a .mt file to TypeScript
    manta tokens  <file.mt>     Print the token stream
    manta ast     <file.mt>     Print the AST as JSON
    manta run     <file.mt>     Compile and run (requires ts-node)
    manta --help                Show this help

  Examples:
    manta compile examples/detect_person.mt
    manta run examples/autonomous_camera.mt
    `);
    process.exit(0);
  }

  const filePath = args[1];
  if (!filePath) {
    console.error("Error: No file specified.");
    process.exit(1);
  }

  let source: string;
  try {
    source = readFileSync(resolve(filePath), "utf-8");
  } catch {
    console.error(`Error: Cannot read file '${filePath}'`);
    process.exit(1);
  }

  if (command === "tokens") {
    const { tokenize } = await import("./lexer/index.js");
    const tokens = tokenize(source);
    console.log(JSON.stringify(tokens, null, 2));

  } else if (command === "ast") {
    const { parse } = await import("./parser/index.js");
    const ast = parse(source);
    console.log(JSON.stringify(ast, null, 2));

  } else if (command === "compile") {
    const compiled = compile(source);
    const outFile = basename(filePath, extname(filePath)) + ".ts";
    writeFileSync(outFile, compiled, "utf-8");
    console.log(`Compiled → ${outFile}`);

  } else if (command === "run") {
    const compiled = compile(source);
    const { execSync } = await import("child_process");
    const tmpFile = `/tmp/__manta_${Date.now()}.ts`;
    writeFileSync(tmpFile, compiled, "utf-8");
    try {
      execSync(`ts-node ${tmpFile}`, { stdio: "inherit" });
    } finally {
      try { require("fs").unlinkSync(tmpFile); } catch {}
    }

  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}
