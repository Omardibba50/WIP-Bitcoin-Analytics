#!/bin/bash

# Design System Enforcement Script
# Replaces all hardcoded colors with design system tokens

echo "🎨 Starting Design System Enforcement..."

# Color mappings
declare -A color_map=(
    # Primary colors
    ["#00b3ff"]="var(--color-primary)"
    ["#0080ff"]="var(--color-primary-dark)"
    ["rgba(0, 179, 255, 0.2)"]="var(--color-primary-alpha-low)"
    ["rgba(0, 179, 255, 0.1)"]="var(--color-primary-alpha-low)"
    ["rgba(0, 179, 255, 0.4)"]="var(--color-primary-alpha-medium)"
    ["rgba(0,179,255,0.2)"]="var(--color-primary-alpha-low)"
    ["rgba(0,179,255,0.1)"]="var(--color-primary-alpha-low)"
    
    # Text colors
    ["#ffffff"]="var(--color-text-primary)"
    ["#ffffffff"]="var(--color-text-primary)"
    ["#fff"]="var(--color-text-primary)"
    ["#000000"]="var(--color-text-primary)"
    ["#000"]="var(--color-text-primary)"
    ["#a0a0a0"]="var(--color-text-secondary)"
    ["#888"]="var(--color-text-secondary)"
    ["#ccc"]="var(--color-text-muted)"
    ["#cccccc"]="var(--color-text-muted)"
    
    # Success colors
    ["#4ade80"]="var(--color-success)"
    ["#22c55e"]="var(--color-success)"
    
    # Error colors
    ["#ff6b6b"]="var(--color-error)"
    ["#ef4444"]="var(--color-error)"
    
    # Warning colors
    ["#ffa500"]="var(--color-warning)"
    ["#f59e0b"]="var(--color-warning)"
    
    # Border colors
    ["#333"]="var(--color-border-subtle)"
    ["#ddd"]="var(--color-border-default)"
    ["rgba(255, 255, 255, 0.08)"]="var(--color-border-default)"
    
    # Background colors
    ["#f5f5f5"]="var(--color-surface-light)"
    ["#e6f7ff"]="var(--color-surface-hover)"
    ["rgba(26, 26, 26, 0.95)"]="var(--color-surface-elevated)"
)

# Files to process
files=(
    "frontend/src/Components/CorporateTreasuries.jsx"
    "frontend/src/Components/LightningNetwork.jsx"
    "frontend/src/Components/PriceChart.jsx"
    "frontend/src/Components/BitcoinMetrics.jsx"
    "frontend/src/Components/MiningEconomics.jsx"
    "frontend/src/Components/PriceCards.jsx"
    "frontend/src/Components/AIPredictionCard.jsx"
    "frontend/src/Components/AIPredictionChart.jsx"
    "frontend/src/Components/BlockchainBlocks.jsx"
    "frontend/src/Components/CorrelationDashboard.jsx"
    "frontend/src/Components/PredictedNextBlock.jsx"
    "frontend/src/Components/LiveModelsChart.jsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Replace colors
        for old_color in "${!color_map[@]}"; do
            new_color="${color_map[$old_color]}"
            sed -i "s|$old_color|$new_color|g" "$file"
        done
        
        echo "✅ $file processed"
    else
        echo "⚠️  $file not found"
    fi
done

echo "✨ Design System Enforcement Complete!"
echo "Backups created with .backup extension"
