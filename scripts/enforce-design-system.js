const fs = require('fs');
const path = require('path');

// Color mapping from hardcoded to design system
const colorMappings = [
  // Primary colors
  { from: /#00b3ff/gi, to: 'colors.primary' },
  { from: /#0080ff/gi, to: 'colors.primaryDark' },
  { from: /rgba\(0,\s*179,\s*255,\s*0\.2\)/gi, to: 'colors.primary + "33"' },
  { from: /rgba\(0,\s*179,\s*255,\s*0\.1\)/gi, to: 'colors.primary + "1A"' },
  { from: /rgba\(0,\s*179,\s*255,\s*0\.3\)/gi, to: 'colors.cardBorderHover' },
  { from: /rgba\(0,\s*179,\s*255,\s*0\.4\)/gi, to: 'colors.primary + "66"' },
  
  // Text colors - be careful with #fff and #000
  { from: /#ffffffff/gi, to: 'colors.textPrimary' },
  { from: /#ffffff(?![0-9a-fA-F])/gi, to: 'colors.textPrimary' },
  { from: /#fff(?![0-9a-fA-F])/gi, to: 'colors.textPrimary' },
  { from: /#000000(?![0-9a-fA-F])/gi, to: 'colors.textPrimary' },
  { from: /#000(?![0-9a-fA-F])/gi, to: 'colors.textPrimary' },
  { from: /#a0a0a0/gi, to: 'colors.textSecondary' },
  { from: /#888888/gi, to: 'colors.textSecondary' },
  { from: /#888(?![0-9a-fA-F])/gi, to: 'colors.textSecondary' },
  { from: /#cccccc/gi, to: 'colors.textMuted' },
  { from: /#ccc(?![0-9a-fA-F])/gi, to: 'colors.textMuted' },
  
  // Success colors
  { from: /#4ade80/gi, to: 'colors.success' },
  { from: /#22c55e/gi, to: 'colors.success' },
  { from: /#10b981/gi, to: 'colors.success' },
  
  // Error colors
  { from: /#ff6b6b/gi, to: 'colors.error' },
  { from: /#ef4444/gi, to: 'colors.error' },
  
  // Warning colors
  { from: /#ffa500/gi, to: 'colors.warning' },
  { from: /#f59e0b/gi, to: 'colors.warning' },
  
  // Border colors
  { from: /#333333/gi, to: 'colors.cardBorder' },
  { from: /#333(?![0-9a-fA-F])/gi, to: 'colors.cardBorder' },
  { from: /#dddddd/gi, to: 'colors.cardBorder' },
  { from: /#ddd(?![0-9a-fA-F])/gi, to: 'colors.cardBorder' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.08\)/gi, to: 'colors.cardBorder' },
  
  // Background colors
  { from: /#f5f5f5/gi, to: 'colors.bgTertiary' },
  { from: /#e6f7ff/gi, to: 'colors.primary + "1A"' },
  { from: /rgba\(26,\s*26,\s*26,\s*0\.95\)/gi, to: 'colors.cardBg' },
  { from: /#1a1a1a/gi, to: 'colors.bgSecondary' },
  { from: /#0a0a0a/gi, to: 'colors.bgPrimary' },
  { from: /#242424/gi, to: 'colors.bgTertiary' },
];

// Files to process
const filesToProcess = [
  'frontend/src/Components/CorporateTreasuries.jsx',
  'frontend/src/Components/LightningNetwork.jsx',
  'frontend/src/Components/PriceChart.jsx',
  'frontend/src/Components/BitcoinMetrics.jsx',
  'frontend/src/Components/MiningEconomics.jsx',
  'frontend/src/Components/PriceCards.jsx',
  'frontend/src/Components/AIPredictionCard.jsx',
  'frontend/src/Components/AIPredictionChart.jsx',
  'frontend/src/Components/BlockchainBlocks.jsx',
  'frontend/src/Components/CorrelationDashboard.jsx',
  'frontend/src/Components/PredictedNextBlock.jsx',
  'frontend/src/Components/LiveModelsChart.jsx',
  'frontend/src/Components/AIModelMetrics.jsx',
  'frontend/src/Components/PricePerformanceChart.jsx',
  'frontend/src/Components/ModelChart.jsx',
];

function processFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    console.log(`Processing: ${filePath}`);
    
    // Read file
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if colors are already imported
    const hasColorsImport = /import.*\{[^}]*colors[^}]*\}.*from.*designSystem/.test(content);
    
    // Add colors import if not present
    if (!hasColorsImport && !content.includes('from \'../styles/designSystem\'')) {
      // Find the last import statement
      const lastImportMatch = content.match(/import[^;]+;(?=\s*\n\s*(?!import))/);
      if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPos) + 
                 '\nimport { colors, spacing, borderRadius, shadows } from \'../styles/designSystem\';' +
                 content.slice(insertPos);
      }
    }
    
    // Apply color mappings
    colorMappings.forEach(({ from, to }) => {
      // For style object properties, we need to handle them differently
      // e.g., color: '#00b3ff' -> color: colors.primary
      content = content.replace(from, to);
    });
    
    // Fix common patterns where quotes are now wrong
    // e.g., color: 'colors.primary' should be color: colors.primary
    content = content.replace(/:\s*['"]colors\./g, ': colors.');
    content = content.replace(/colors\.([\w]+)['"]/g, 'colors.$1');
    
    // Only write if content changed
    if (content !== originalContent) {
      // Create backup
      fs.writeFileSync(filePath + '.backup', originalContent);
      
      // Write updated content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`   No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🎨 Design System Enforcement Script\n');
  
  let processed = 0;
  let updated = 0;
  
  filesToProcess.forEach(file => {
    processed++;
    if (processFile(file)) {
      updated++;
    }
  });
  
  console.log(`\n✨ Complete!`);
  console.log(`   Processed: ${processed} files`);
  console.log(`   Updated: ${updated} files`);
  console.log(`   Backups created with .backup extension`);
}

main();
