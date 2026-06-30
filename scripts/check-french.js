const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const frenchPatterns = [
  /[Oo]uvrir le menu/,
  /[Cc]r[ée]er/,
  /[Tt]able des mati[èe]res/,
  /[Cc]hargement/,
  /[Pp]ersonnalis[ée]/,
  /[Dd]etendu/,
  /[Ii]nspirant/,
  /[Ff]ran[cç]ais/,
  /[Ss]ans titre/,
  /[Ss]atisfait ou rembourse/,
  /[Tt]ranscrire/,
  /[Ss]ujet est requis/,
  /[Nn]on support[ée]/,
  /[Tt]itre est requis/,
  /[Vv]id[ée]o est requise/,
  /[Aa]ucun fichier/,
  /[Ll]imite atteinte/,
  /[Cc]l[ée]/,
  /[Pp]lan BASIC/,
  /[Gg]uide du [Ff]reelance/,
  /[Tt]out ce que vous/,
  /[Pp]roductivit[ée]/,
  /[Aa]stuces et outils/,
  /[Mm]arketing [Dd]igital [Bb]asique/,
  /[Ll]es fondamentaux du marketing/,
  /[Nn]ouveau/,
  /[Bb]ien-etre/,
  /[Ss]uggestions d'[Ee]books/,
];

const dirs = ['views', 'controllers', 'services', 'public'];
let total = 0;

dirs.forEach(dir => {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return;
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css'));
  files.forEach(file => {
    const fp = path.join(fullDir, file);
    const content = fs.readFileSync(fp, 'utf-8');
    frenchPatterns.forEach(pattern => {
      const matches = content.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        // Filter out false positives from already-translated code
        matches.forEach(m => {
          // Skip 'description', 'format', 'client', etc. that are valid English words
          if (['description', 'format', 'client', 'clients', 'role', 'title', 'comment', 'menu', 'note', 'plan', 'premium', 'product', 'service'].includes(m.toLowerCase())) return;
          console.log(`${dir}/${file}: "${m}"`);
          total++;
        });
      }
    });
  });
});

if (total === 0) console.log('ALL CLEAN - No French text found');
else console.log(`\n${total} French matches found`);
