const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Focus on actual French user-visible strings only (not false positives like "article", "circle")
const checks = [
  ['views/register.html', /Créer|Enregistrer|Se connecter|Mot de passe|Connectez-vous|Inscrivez-vous/],
  ['services/ai.service.js', /francais|français/],
  ['services/pdf.service.js', /fr-FR/],
  ['controllers/ebook.controller.js', /Erreur.*(chargement|création|export|ebook|serveur)/],
  ['controllers/pages.controller.js', /Clé API/],
  ['services/transcription.service.js', /Clé API|transcrire/],
  ['views/ebooks.html', /Erreur(?!.*Error)/],
  ['views/pages.html', /Regenerer|Bien-etre/],
  ['views/ebook-preview.html', /Chargement de aperçu|Aucun ebook/],
];

let allClean = true;
checks.forEach(([file, pattern]) => {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) return;
  const content = fs.readFileSync(fp, 'utf-8');
  const match = content.match(pattern);
  if (match) {
    console.log(`FRENCH FOUND in ${file}: "${match[0]}"`);
    allClean = false;
  }
});

if (allClean) {
  console.log('ALL CLEAN - no French user-visible text remains');
} else {
  process.exit(1);
}
