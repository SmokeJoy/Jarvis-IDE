import { Project, SyntaxKind, SourceFile, ImportDeclaration } from "ts-morph";
import path from "path";
import fs from "fs";
// @ts-expect-error: TS non trova il .js prima della compilazione, ma Node sì dopo.
import { safeIsKind } from "../utils/utils.js";

// ... existing code ... 