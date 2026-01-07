# Remove API keys from documentation files
$files = @(
    "README.md",
    "SETUP.md",
    "README_FIRST.md",
    "PROJECT_COMPLETE.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing $file..."
        $content = Get-Content $file -Raw
        $content = $content -replace 'psk_10f461e55e24ecf68cb5eba9fc82eba1', 'psk_YOUR_API_KEY_HERE'
        Set-Content $file -Value $content -NoNewline
    }
}

Write-Host "Done! API keys removed from documentation."
