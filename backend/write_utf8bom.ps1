param(
    [string]$filePath,
    [string]$content
)

$directory = [System.IO.Path]::GetDirectoryName($filePath)
if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
}

$utf8Bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($filePath, $content, $utf8Bom)
