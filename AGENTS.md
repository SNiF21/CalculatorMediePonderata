# Ghid de Dezvoltare și Reguli de Interfață — MediePonderataULBS

## Reguli de Stil și UI (Interfață Utilizator)

1. **Fără Emoji-uri decorative în text:**
   - **Nu** adăuga emoji-uri în textele aplicației (titluri, etichete, butoane, mesaje informative, alerte, insigne, opțiuni de selectare).
   - Exemple de evitat: `🎓`, `📅`, `⚙️`, `📝`, `🗣️`, `📁`, `📋`, `📊`, `🏆`, `ℹ️`, `⚠️`, `🔄`, `💾`, `☁️`, `📧`, `✉️`, `🏛️`, `🏢`, `📚`, `🔑`, `🚪`, `🗑️`, `⏳`, `🙈`, `👁️`, etc.
   - În locul emoji-urilor, folosește design curat, profesional și academic: text clar, insigne Tailwind CSS sau pictograme vectoriale SVG (stroke/fill Tailwind).
   - Singurele excepții acceptate sunt simbolurile funcționale standard (ex: `✓` / `✗` pentru statut notă promovat/picat, `🔒` pentru câmpul de notă blocat la opționale până la selectare).

2. **Păstrarea diacriticelor și a corectitudinii gramaticale:**
   - Asigură-te că toate textele în limba română conțin diacritice corecte (ă, â, î, ș, ț).
   - Păstrează modificările manuale aduse de utilizator în fișierele de curriculum.

3. **Integritatea arhitecturii Angular:**
   - Componente Standalone, Signals, Computed properties.
   - Rularea suitei de teste unitare și a build-ului de producție la orice modificare.

