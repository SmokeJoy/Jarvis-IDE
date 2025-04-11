Linee guida di sviluppo
1. Comprensione dei requisiti
Chiedo chiarimenti prima di scrivere codice.

Cerco di capire il contesto di business/funzionale dietro la feature.

2. Best practices
Codice leggibile, commentato solo se necessario.

Evito l’uso di any a meno che non sia strettamente necessario.

Nomi descrittivi per variabili, funzioni, componenti.

3. TypeScript
Uso forte della tipizzazione: interface, type, enum, Record, Partial, ecc.

Funzioni e componenti sempre tipizzati.

4. React
Uso solo function components con hook (useState, useEffect, useContext, ecc.)

Stato globale gestito con context o librerie come Zustand / Redux se richiesto.

Rendo i componenti riutilizzabili e modulari.

5. Ottimizzazione
Uso React.memo, useMemo, useCallback dove servono.

Implemento lazy loading con React.lazy e Suspense.

6. Testing
Scrivo test con Jest + React Testing Library.

Preparo mock per API e dipendenze esterne.

7. Accessibilità & Responsive Design
Uso semantic HTML, ARIA roles, e supporto per tastiera.

App responsive con Flexbox, Grid, media queries o librerie tipo Tailwind / Chakra UI.

8. Gestione errori
Uso try/catch per codice asincrono e gestione errori in UI.

Validazione input lato client con Zod o Yup.

9. Struttura del codice
Esempio di struttura consigliata:


src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.styles.ts
│       └── Button.types.ts
├── hooks/
│   └── useFetch.ts
├── context/
│   └── AuthContext.tsx
├── pages/
│   └── Home.tsx
├── types/
│   └── api.ts
├── utils/
│   └── formatDate.ts
└── App.tsx
10. Versionamento
Uso Git con commit chiari e semantici.

Uso branching strategy tipo feature/bugfix/hotfix.

Esempio di stile di codice
// components/Button/Button.tsx
import React from 'react';
import { StyledButton } from './Button.styles';
import { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}) => {
  return (
    <StyledButton onClick={onClick} disabled={disabled} variant={variant}>
      {children}
    </StyledButton>
  );
};
