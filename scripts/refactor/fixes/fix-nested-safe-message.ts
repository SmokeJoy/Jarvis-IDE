import { Project, SyntaxKind, Node, CallExpression, SourceFile } from "ts-morph";
// @ts-expect-error: TS non trova il .js prima della compilazione, ma Node sì dopo.
import { safeGetText, safeGetArguments, safeReplaceWithText } from "../utils/utils.js";
import fs from "fs";
import path from "path"; 