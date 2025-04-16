import { Project, Node, SyntaxKind, ObjectLiteralExpression } from "ts-morph";
import path from "path";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

const log = (msg: string) => console.log(`\x1b[36m🔧 ${msg}\x1b[0m`);
const logFile = (msg: string) => console.log(`\x1b[35m📄 ${msg}\x1b[0m`);
const logFix = (msg: string) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
const logSkip = (msg: string) => console.log(`\x1b[90m⏭️ ${msg}\x1b[0m`);

let changedFiles = 0;

log("Inizio fix `timestamp` nelle chiamate a createChatMessage...");

project.getSourceFiles().forEach((sourceFile) => {
  let fileChanged = false; // Rimuovo didChange, uso solo fileChanged

  sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();

      if (
        Node.isIdentifier(expression) &&
        expression.getText() === "createChatMessage"
      ) {
        const args = node.getArguments();
        if (args.length === 0) return;

        const firstArg = args[0];

        if (Node.isObjectLiteralExpression(firstArg)) {
          const hasTimestamp = firstArg
            .getProperties()
            .some(
              (p) =>
                Node.isPropertyAssignment(p) &&
                p.getName() === "timestamp"
            );

          if (!hasTimestamp) {
            logFix(
              `Aggiungo timestamp() in ${sourceFile.getBaseName()}:${node.getStartLineNumber()}`
            );
            firstArg.addPropertyAssignment({
              name: "timestamp",
              initializer: "Date.now()",
            });
            fileChanged = true; // Imposto fileChanged qui
          } else {
            logSkip(
              `timestamp già presente in ${sourceFile.getBaseName()}:${node.getStartLineNumber()}`
            );
          }
        }
      }
    }
  });

  if (fileChanged) {
    sourceFile.saveSync();
    changedFiles++;
    logFile(`Salvato ${sourceFile.getBaseName()}`);
  }
});

log(`\n🎯 Completato: ${changedFiles} file aggiornati.`); 