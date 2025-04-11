#!/usr/bin/env node
/**
 * @file generate-component.js
 * @description Script per generare nuovi componenti React con i loro test
 * 
 * Utilizzo:
 * node scripts/generate-component.js ComponentName [--path=components/path]
 */

const fs = require('fs');
const path = require('path');

// Elabora gli argomenti
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Devi specificare un nome per il componente');
  console.error('Esempio: node scripts/generate-component.js MyNewComponent [--path=components/path]');
  process.exit(1);
}

// Nome del componente (primo argomento)
const componentName = args[0];

// Percorso opzionale (flag --path=)
let componentPath = '';
const pathArg = args.find(arg => arg.startsWith('--path='));
if (pathArg) {
  componentPath = pathArg.split('=')[1];
}

// Directory base
const BASE_DIR = path.join(process.cwd(), 'webview-ui/src');

// Percorso completo del componente
const fullComponentPath = path.join(BASE_DIR, componentPath, componentName);

// Crea la directory se non esiste
if (!fs.existsSync(fullComponentPath)) {
  fs.mkdirSync(fullComponentPath, { recursive: true });
  console.log(`Directory creata: ${fullComponentPath}`);
}

// Template per il componente React
const componentTemplate = `/**
 * @file ${componentName}.tsx
 * @description Componente ${componentName}
 */

import React, { useState, useEffect } from 'react';
import './styles.css';

export interface ${componentName}Props {
  /** Titolo del componente */
  title?: string;
  /** Callback chiamata quando il componente cambia stato */
  onChange?: (value: any) => void;
  /** Stato iniziale del componente */
  initialValue?: any;
}

/**
 * Componente ${componentName}
 */
const ${componentName}: React.FC<${componentName}Props> = ({
  title = 'Titolo Predefinito',
  onChange,
  initialValue
}) => {
  const [value, setValue] = useState(initialValue);
  
  // Effetto per notificare il cambiamento dello stato
  useEffect(() => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  }, [value, onChange]);
  
  const handleChange = (newValue: any) => {
    setValue(newValue);
  };
  
  return (
    <div className="${componentName.toLowerCase()}-container" data-testid="${componentName.toLowerCase()}-container">
      <h2>{title}</h2>
      <div className="${componentName.toLowerCase()}-content">
        {/* Contenuto del componente */}
        <p>Componente ${componentName}</p>
      </div>
    </div>
  );
};

export default ${componentName};
`;

// Template per il file di stile CSS
const styleTemplate = `/**
 * Stili per il componente ${componentName}
 */

.${componentName.toLowerCase()}-container {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.${componentName.toLowerCase()}-container h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
}

.${componentName.toLowerCase()}-content {
  margin-top: 12px;
}
`;

// Template per il file di index che esporta il componente
const indexTemplate = `export { default } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';
`;

// Template per il file di test
const testTemplate = `/**
 * @file ${componentName}.test.tsx
 * @description Test per il componente ${componentName}
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ${componentName} from '../../${componentPath}/${componentName}';

describe('${componentName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renderizza correttamente con props predefinite', () => {
    render(<${componentName} />);
    
    // Verifica elementi base
    expect(screen.getByText('Titolo Predefinito')).toBeInTheDocument();
    expect(screen.getByText(\`Componente ${componentName}\`)).toBeInTheDocument();
    expect(screen.getByTestId('${componentName.toLowerCase()}-container')).toBeInTheDocument();
  });
  
  it('renderizza correttamente con titolo personalizzato', () => {
    const customTitle = 'Titolo Custom';
    render(<${componentName} title={customTitle} />);
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });
  
  it('chiama onChange quando lo stato cambia', () => {
    const mockOnChange = vi.fn();
    const initialValue = 'valore-iniziale';
    
    render(
      <${componentName} 
        onChange={mockOnChange}
        initialValue={initialValue}
      />
    );
    
    // Verifica che il componente abbia il valore iniziale
    // Nota: questo è solo un esempio, adatta in base all'implementazione
    
    // Simula un cambiamento nel componente
    // Esempio: fireEvent.click(screen.getByRole('button'));
    
    // Verifica che onChange sia stato chiamato
    // expect(mockOnChange).toHaveBeenCalledWith(expect.any(String));
  });
  
  it('è accessibile - verifica ARIA e semantica', () => {
    render(<${componentName} />);
    
    // Verifica che il container abbia un ID di test
    expect(screen.getByTestId('${componentName.toLowerCase()}-container')).toBeInTheDocument();
    
    // Verifica intestazione
    expect(screen.getByRole('heading')).toBeInTheDocument();
    
    // Qui puoi aggiungere altri test per verificare l'accessibilità
    // come la presenza di alt, aria-label, ecc.
  });
});
`;

// Scrivi i file
fs.writeFileSync(path.join(fullComponentPath, `${componentName}.tsx`), componentTemplate);
fs.writeFileSync(path.join(fullComponentPath, 'styles.css'), styleTemplate);
fs.writeFileSync(path.join(fullComponentPath, 'index.ts'), indexTemplate);

// Crea la directory per il test se non esiste
const testDir = path.join(BASE_DIR, '__tests__', componentPath);
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`Directory test creata: ${testDir}`);
}

// Scrivi il file di test
fs.writeFileSync(path.join(testDir, `${componentName}.test.tsx`), testTemplate);

console.log(`\nComponente ${componentName} creato con successo!`);
console.log(`\nFile generati:`);
console.log(`- ${path.join(componentPath, componentName, `${componentName}.tsx`)}`);
console.log(`- ${path.join(componentPath, componentName, 'styles.css')}`);
console.log(`- ${path.join(componentPath, componentName, 'index.ts')}`);
console.log(`- ${path.join('__tests__', componentPath, `${componentName}.test.tsx`)}`);

console.log(`\nUso del componente:`);
console.log(`import ${componentName} from './${componentPath}/${componentName}';`);
console.log(`\n<${componentName} title="Titolo" onChange={(value) => console.log(value)} />`); 