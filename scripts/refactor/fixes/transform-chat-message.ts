import { Project, SyntaxKind, Node, ObjectLiteralExpression, PropertyAssignment, SourceFile } from "ts-morph";
import fs from "fs";
import path from "path";
// @ts-expect-error: TS non trova il .js prima della compilazione, ma Node sì dopo.
import { safeGetText, safeIsKind, safeReplaceWithText, safeGetInitializer } from "../utils/utils.js";
import { program } from "commander"; 