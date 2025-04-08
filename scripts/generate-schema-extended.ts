/**
 * Script avanzato per generare schema JSON da tipi TypeScript
 * Supporta la generazione di schema per WebviewMessage e ExtensionMessage
 * 
 * Richiede:
 * - `ts-json-schema-generator` installato come devDependency
 *   ➤ `pnpm add -D ts-json-schema-generator`
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as TJS from 'typescript-json-schema';

// Configura gli schemi da generare
interface SchemaConfig {
  typeName: string;
  sourcePath: string;
  outputPath: string;
}

// Configurazione per la generazione degli schemi
const schemas: SchemaConfig[] = [
  {
    typeName: 'ChatMessage',
    sourcePath: './src/shared/types.ts',
    outputPath: './docs/schemas/ChatMessage.schema.json',
  },
  {
    typeName: 'ChatSettings',
    sourcePath: './src/shared/types/settings.types.ts',
    outputPath: './docs/schemas/ChatSettings.schema.json',
  },
  {
    typeName: 'ApiConfiguration',
    sourcePath: './src/shared/types/api.types.ts',
    outputPath: './docs/schemas/ApiConfiguration.schema.json',
  },
  {
    typeName: 'ChatSession',
    sourcePath: './src/shared/types/session.ts',
    outputPath: './docs/schemas/ChatSession.schema.json',
  }
];

// Assicurati che la directory di output esista
const outputDir = path.dirname(schemas[0].outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configura il generatore di schema
const settings: TJS.PartialArgs = {
  required: true,
  ref: false,
  topRef: false,
  noExtraProps: true
};

// Genera gli schemi usando typescript-json-schema
function generateSchemas() {
  const program = TJS.getProgramFromFiles(
    schemas.map(s => path.resolve(s.sourcePath)),
    {
      strictNullChecks: true,
    }
  );

  for (const schema of schemas) {
    console.log(`📦 Generazione schema per ${schema.typeName}...`);
    
    const outputSchema = TJS.generateSchema(program, schema.typeName, settings);
    if (outputSchema) {
      fs.writeFileSync(
        path.resolve(schema.outputPath),
        JSON.stringify(outputSchema, null, 2)
      );
      console.log(`✅ Schema per ${schema.typeName} generato in ${schema.outputPath}`);
    } else {
      console.error(`❌ Errore: impossibile generare schema per ${schema.typeName}`);
    }
  }
  
  console.log('✨ Generazione schemi completata!');
}

// Esegui la generazione
generateSchemas(); 