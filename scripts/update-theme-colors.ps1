# 批量替换 Learner App 中的颜色主题
# 将蓝色/紫色主题改为 Teal 青绿主题

$files = Get-ChildItem -Path "d:\code\EchoSpeak\apps\learner\src" -Filter "*.tsx" -Recurse

$replacements = @(
    # 蓝色 -> Teal
    @{Pattern = 'from-blue-600 via-purple-600 to-pink-600'; Replacement = 'from-teal-600 via-teal-500 to-cyan-500'},
    @{Pattern = 'from-blue-600 to-purple-600'; Replacement = 'from-teal-600 to-cyan-500'},
    @{Pattern = 'from-blue-50 to-indigo-50'; Replacement = 'from-teal-50 to-cyan-50'},
    @{Pattern = 'from-blue-50 to-blue-100'; Replacement = 'from-teal-50 to-teal-100'},
    @{Pattern = 'from-blue-500 to-blue-600'; Replacement = 'from-teal-500 to-teal-600'},
    @{Pattern = 'from-blue-900/20 to-indigo-900/20'; Replacement = 'from-teal-900/20 to-cyan-900/20'},
    @{Pattern = 'from-blue-900/30 to-blue-800/30'; Replacement = 'from-teal-900/30 to-teal-800/30'},
    
    @{Pattern = 'bg-blue-50'; Replacement = 'bg-teal-50'},
    @{Pattern = 'bg-blue-100'; Replacement = 'bg-teal-100'},
    @{Pattern = 'bg-blue-500'; Replacement = 'bg-teal-500'},
    @{Pattern = 'bg-blue-600'; Replacement = 'bg-teal-600'},
    @{Pattern = 'bg-blue-800/30'; Replacement = 'bg-teal-800/30'},
    @{Pattern = 'bg-blue-900'; Replacement = 'bg-teal-900'},
    @{Pattern = 'bg-blue-900/30'; Replacement = 'bg-teal-900/30'},
    
    @{Pattern = 'text-blue-100'; Replacement = 'text-teal-100'},
    @{Pattern = 'text-blue-200'; Replacement = 'text-teal-200'},
    @{Pattern = 'text-blue-300'; Replacement = 'text-teal-300'},
    @{Pattern = 'text-blue-400'; Replacement = 'text-teal-400'},
    @{Pattern = 'text-blue-600'; Replacement = 'text-teal-600'},
    @{Pattern = 'text-blue-700'; Replacement = 'text-teal-700'},
    @{Pattern = 'text-blue-800'; Replacement = 'text-teal-800'},
    @{Pattern = 'text-blue-900'; Replacement = 'text-teal-900'},
    
    @{Pattern = 'border-blue-200'; Replacement = 'border-teal-200'},
    @{Pattern = 'border-blue-300'; Replacement = 'border-teal-300'},
    @{Pattern = 'border-blue-500'; Replacement = 'border-teal-500'},
    @{Pattern = 'border-blue-600'; Replacement = 'border-teal-600'},
    @{Pattern = 'border-blue-700'; Replacement = 'border-teal-700'},
    @{Pattern = 'border-blue-800'; Replacement = 'border-teal-800'},
    
    @{Pattern = 'hover:bg-blue-50'; Replacement = 'hover:bg-teal-50'},
    @{Pattern = 'hover:bg-blue-500'; Replacement = 'hover:bg-teal-500'},
    @{Pattern = 'hover:text-blue-400'; Replacement = 'hover:text-teal-400'},
    @{Pattern = 'hover:text-blue-600'; Replacement = 'hover:text-teal-600'},
    @{Pattern = 'group-hover:text-blue-400'; Replacement = 'group-hover:text-teal-400'},
    @{Pattern = 'group-hover:text-blue-600'; Replacement = 'group-hover:text-teal-600'},
    
    @{Pattern = 'dark:bg-blue-800/30'; Replacement = 'dark:bg-teal-800/30'},
    @{Pattern = 'dark:bg-blue-900'; Replacement = 'dark:bg-teal-900'},
    @{Pattern = 'dark:bg-blue-900/10'; Replacement = 'dark:bg-teal-900/10'},
    @{Pattern = 'dark:bg-blue-900/30'; Replacement = 'dark:bg-teal-900/30'},
    @{Pattern = 'dark:text-blue-100'; Replacement = 'dark:text-teal-100'},
    @{Pattern = 'dark:text-blue-200'; Replacement = 'dark:text-teal-200'},
    @{Pattern = 'dark:text-blue-300'; Replacement = 'dark:text-teal-300'},
    @{Pattern = 'dark:text-blue-400'; Replacement = 'dark:text-teal-400'},
    @{Pattern = 'dark:border-blue-700'; Replacement = 'dark:border-teal-700'},
    @{Pattern = 'dark:border-blue-800'; Replacement = 'dark:border-teal-800'},
    @{Pattern = 'dark:hover:bg-blue-900/10'; Replacement = 'dark:hover:bg-teal-900/10'},
    @{Pattern = 'dark:group-hover:text-blue-400'; Replacement = 'dark:group-hover:text-teal-400'},
    
    # 紫色 -> Cyan
    @{Pattern = 'from-purple-50 to-pink-50'; Replacement = 'from-cyan-50 to-teal-50'},
    @{Pattern = 'from-purple-500 to-purple-600'; Replacement = 'from-cyan-500 to-cyan-600'},
    @{Pattern = 'from-purple-900/30 to-pink-900/30'; Replacement = 'from-cyan-900/30 to-teal-900/30'},
    
    @{Pattern = 'bg-purple-50'; Replacement = 'bg-cyan-50'},
    @{Pattern = 'bg-purple-100'; Replacement = 'bg-cyan-100'},
    @{Pattern = 'bg-purple-500'; Replacement = 'bg-cyan-500'},
    @{Pattern = 'bg-purple-900/30'; Replacement = 'bg-cyan-900/30'},
    
    @{Pattern = 'text-purple-100'; Replacement = 'text-cyan-100'},
    @{Pattern = 'text-purple-200'; Replacement = 'text-cyan-200'},
    @{Pattern = 'text-purple-300'; Replacement = 'text-cyan-300'},
    @{Pattern = 'text-purple-400'; Replacement = 'text-cyan-400'},
    @{Pattern = 'text-purple-600'; Replacement = 'text-cyan-600'},
    @{Pattern = 'text-purple-700'; Replacement = 'text-cyan-700'},
    @{Pattern = 'text-purple-800'; Replacement = 'text-cyan-800'},
    @{Pattern = 'text-purple-900'; Replacement = 'text-cyan-900'},
    
    @{Pattern = 'border-purple-300'; Replacement = 'border-cyan-300'},
    @{Pattern = 'border-purple-700'; Replacement = 'border-cyan-700'},
    
    @{Pattern = 'dark:bg-purple-900/30'; Replacement = 'dark:bg-cyan-900/30'},
    @{Pattern = 'dark:text-purple-100'; Replacement = 'dark:text-cyan-100'},
    @{Pattern = 'dark:text-purple-200'; Replacement = 'dark:text-cyan-200'},
    @{Pattern = 'dark:text-purple-300'; Replacement = 'dark:text-cyan-300'},
    @{Pattern = 'dark:text-purple-400'; Replacement = 'dark:text-cyan-400'},
    @{Pattern = 'dark:border-purple-700'; Replacement = 'dark:border-cyan-700'}
)

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileChanged = $false
    $fileReplacements = 0
    
    foreach ($replacement in $replacements) {
        $pattern = [regex]::Escape($replacement.Pattern)
        $matches = [regex]::Matches($content, $pattern)
        
        if ($matches.Count -gt 0) {
            $content = $content -replace $pattern, $replacement.Replacement
            $fileReplacements += $matches.Count
            $fileChanged = $true
        }
    }
    
    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalFiles++
        $totalReplacements += $fileReplacements
        Write-Host "✓ $($file.Name) - $fileReplacements 处替换" -ForegroundColor Green
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "完成！共更新 $totalFiles 个文件，$totalReplacements 处颜色替换" -ForegroundColor Yellow
Write-Host "蓝色/紫色主题 → Teal 青绿主题" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
