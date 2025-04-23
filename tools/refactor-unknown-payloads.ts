import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.bonifica.json',
});

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;
  sourceFile.forEachDescendant((node) => {
    if (node.getKindName() === 'PropertyAccessExpression') {
      const text = node.getText();
      if (text.endsWith('.payload')) {
        node.replaceWithText('(msg.payload as unknown)');
        changed = true;
      }
    }
  });
  if (changed) {
    sourceFile.saveSync();
    console.log(`🔄 Refactored: ${sourceFile.getFilePath()}`);
  }
}

console.log('Payloads refactored to `unknown`'); 