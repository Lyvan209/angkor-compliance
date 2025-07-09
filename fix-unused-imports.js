#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to remove unused imports from a file
function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Common unused imports to remove
    const unusedImports = [
      'Calendar', 'Filter', 'Settings', 'Download', 'Upload', 'X', 'Save',
      'Copy', 'Eye', 'EyeOff', 'Clock', 'Flag', 'MessageSquare', 'Paperclip',
      'Tag', 'Star', 'Archive', 'RefreshCw', 'Trash2', 'Send', 'Mail', 'Phone',
      'MapPin', 'Timer', 'MicOff', 'Play', 'Pause', 'RotateCcw', 'Info', 'Check',
      'Search', 'Grid', 'List', 'Video', 'Image', 'Edit', 'ChevronRight',
      'Volume2', 'VolumeX', 'Maximize', 'SkipForward', 'SkipBack', 'Move',
      'Folder', 'FolderOpen', 'Link', 'ExternalLink', 'Smartphone', 'Tablet',
      'Users', 'Code', 'FileText', 'Monitor', 'Globe', 'BookOpen', 'PenTool',
      'ToggleRight', 'useCallback', 'useMemo'
    ];

    // Remove unused imports from lucide-react
    unusedImports.forEach(importName => {
      const importRegex = new RegExp(`\\b${importName}\\b(?=\\s*,|\\s*})`, 'g');
      if (importRegex.test(content)) {
        // Check if this import is actually used in the file
        const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
        const matches = content.match(usageRegex);
        if (matches && matches.length <= 1) { // Only in import statement
          content = content.replace(importRegex, '');
          modified = true;
        }
      }
    });

    // Clean up empty import statements
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');
    content = content.replace(/import\s*{\s*,+\s*}\s*from\s*['"][^'"]+['"];?\s*\n?/g, '');

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to recursively find and process JSX files
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      removeUnusedImports(filePath);
    }
  });
}

// Start processing from src directory
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  console.log('Removing unused imports...');
  processDirectory(srcDir);
  console.log('Done!');
} else {
  console.log('src directory not found');
}