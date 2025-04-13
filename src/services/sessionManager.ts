import * as fs from 'fs';
import * as path from 'path';

interface Session {
  id: string;
  name: string;
  timestamp: number;
  messages: Array<{
    role: string;
    message: string;
    timestamp: number;
  }>;
}

export class SessionManager {
  private sessionsPath: string;
  private currentSession: Session | null = null;

  constructor() {
    this.sessionsPath = path.join(__dirname, '../../sessions');
    this.ensureSessionsDirectory();
  }

  private ensureSessionsDirectory() {
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }

  // Crea una nuova sessione
  public createSession(name: string): Session {
    const session: Session = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      messages: [],
    };

    this.saveSession(session);
    this.currentSession = session;
    return session;
  }

  // Carica una sessione esistente
  public loadSession(sessionId: string): Session | null {
    const filePath = path.join(this.sessionsPath, `${sessionId}.json`);

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const session = JSON.parse(content);
        this.currentSession = session;
        return session;
      } catch (error) {
        console.error('❌ Errore nel caricamento della sessione:', error);
        return null;
      }
    }
    return null;
  }

  // Salva una sessione
  private saveSession(session: Session): void {
    const filePath = path.join(this.sessionsPath, `${session.id}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('❌ Errore nel salvataggio della sessione:', error);
    }
  }

  // Aggiunge un messaggio alla sessione corrente
  public addMessage(role: string, message: string): void {
    if (!this.currentSession) {
      this.createSession('Nuova Sessione');
    }

    if (this.currentSession) {
      this.currentSession.messages.push({
        role,
        message,
        timestamp: Date.now(),
      });
      this.saveSession(this.currentSession);
    }
  }

  // Rinomina una sessione
  public renameSession(sessionId: string, newName: string): boolean {
    const session = this.loadSession(sessionId);
    if (session) {
      session.name = newName;
      this.saveSession(session);
      return true;
    }
    return false;
  }

  // Elimina una sessione
  public deleteSession(sessionId: string): boolean {
    const filePath = path.join(this.sessionsPath, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        if (this.currentSession?.id === sessionId) {
          this.currentSession = null;
        }
        return true;
      } catch (error) {
        console.error("❌ Errore nell'eliminazione della sessione:", error);
        return false;
      }
    }
    return false;
  }

  // Lista tutte le sessioni disponibili
  public listSessions(): Session[] {
    try {
      const files = fs.readdirSync(this.sessionsPath);
      return files
        .filter((file) => file.endsWith('.json'))
        .map((file) => {
          const content = fs.readFileSync(path.join(this.sessionsPath, file), 'utf-8');
          return JSON.parse(content);
        })
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Errore nella lettura delle sessioni:', error);
      return [];
    }
  }

  // Ottiene la sessione corrente
  public getCurrentSession(): Session | null {
    return this.currentSession;
  }

  // Esporta una sessione in formato JSON
  public exportSession(sessionId: string): string | null {
    const session = this.loadSession(sessionId);
    if (session) {
      return JSON.stringify(session, null, 2);
    }
    return null;
  }

  // Importa una sessione da JSON
  public importSession(jsonContent: string): Session | null {
    try {
      const session = JSON.parse(jsonContent);

      // Validazione della struttura
      if (!session.id || !session.name || !session.messages) {
        throw new Error('Formato sessione non valido');
      }

      // Genera nuovo ID per evitare conflitti
      session.id = Date.now().toString();
      session.timestamp = Date.now();

      // Salva la sessione importata
      this.saveSession(session);
      return session;
    } catch (error) {
      console.error("❌ Errore nell'importazione della sessione:", error);
      return null;
    }
  }

  // Esporta tutte le sessioni
  public exportAllSessions(): string {
    const sessions = this.listSessions();
    return JSON.stringify(sessions, null, 2);
  }

  // Importa multiple sessioni
  public importAllSessions(jsonContent: string): boolean {
    try {
      const sessions = JSON.parse(jsonContent);
      if (!Array.isArray(sessions)) {
        throw new Error('Formato non valido: array di sessioni atteso');
      }

      sessions.forEach((session) => {
        if (session.id && session.name && session.messages) {
          session.id = Date.now().toString();
          session.timestamp = Date.now();
          this.saveSession(session);
        }
      });

      return true;
    } catch (error) {
      console.error("❌ Errore nell'importazione delle sessioni:", error);
      return false;
    }
  }
}
