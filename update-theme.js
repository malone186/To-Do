const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const map = {
  'bg-zinc-950/60': 'bg-white dark:bg-zinc-950/60',
  'bg-zinc-950/40': 'bg-zinc-50 dark:bg-zinc-950/40',
  'bg-zinc-950/80': 'bg-white/80 dark:bg-zinc-950/80',
  'bg-zinc-950': 'bg-white dark:bg-zinc-950',
  'bg-zinc-900/40': 'bg-zinc-100/40 dark:bg-zinc-900/40',
  'bg-zinc-900': 'bg-white dark:bg-zinc-900',
  'bg-zinc-850': 'bg-zinc-100 dark:bg-zinc-850',
  'bg-zinc-800/80': 'bg-zinc-100/80 dark:bg-zinc-800/80',
  'bg-zinc-800': 'bg-zinc-100 dark:bg-zinc-800',
  'border-zinc-900': 'border-zinc-200 dark:border-zinc-900',
  'border-zinc-850': 'border-zinc-200 dark:border-zinc-850',
  'border-zinc-800/80': 'border-zinc-200 dark:border-zinc-800/80',
  'border-zinc-800/60': 'border-zinc-200 dark:border-zinc-800/60',
  'border-zinc-800/50': 'border-zinc-200 dark:border-zinc-800/50',
  'border-zinc-800': 'border-zinc-200 dark:border-zinc-800',
  'text-zinc-100': 'text-zinc-900 dark:text-zinc-100',
  'text-zinc-200': 'text-zinc-800 dark:text-zinc-200',
  'text-zinc-300': 'text-zinc-700 dark:text-zinc-300',
  'text-zinc-400': 'text-zinc-600 dark:text-zinc-400',
  'text-zinc-500': 'text-zinc-500 dark:text-zinc-400',
  'bg-[#070708]': 'bg-zinc-50 dark:bg-[#070708]'
};

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    
    for (const key of keys) {
      // Escape the slash in the key
      const escapedKey = key.replace(/\//g, '\\/');
      const escapedBrackets = escapedKey.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
      const regex = new RegExp('(?<!dark:)(?<!\\w)' + escapedBrackets + '(?![\\w/])', 'g');
      content = content.replace(regex, map[key]);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated: ' + filePath);
    }
  }
});
