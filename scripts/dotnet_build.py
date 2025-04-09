#!/usr/bin/env python3
import subprocess
import sys
import os

def run_dotnet_build():
    try:
        # Esegue dotnet build
        result = subprocess.run(['dotnet', 'build'], 
                              capture_output=True, 
                              text=True)
        
        # Stampa l'output
        print(result.stdout)
        
        # Se ci sono errori, li stampa
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        
        # Restituisce il codice di uscita
        return result.returncode
        
    except Exception as e:
        print(f"Errore durante la compilazione: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(run_dotnet_build()) 