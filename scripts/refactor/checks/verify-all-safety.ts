import { Project, SyntaxKind, Node, SourceFile, CallExpression } from "ts-morph";
import fs from "fs";
import path from "path";
// @ts-expect-error: TS non trova il .js prima della compilazione, ma Node sì dopo.
import { safeGetText, safeGetArguments, safeGetLineNumber, safeIsKind } from "../utils/utils.js";
import { program } from "commander"; 