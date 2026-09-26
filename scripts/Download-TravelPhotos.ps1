param([string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference = 'Stop'
$sourceFolder = Join-Path $ProjectRoot 'backend/wwwroot/media/vietnam'
$destination = Join-Path $ProjectRoot 'AnhDuLich'
$metadataFolder = Join-Path $ProjectRoot 'backend/Data/photo-sources'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
New-Item -ItemType Directory -Path $metadataFolder -Force | Out-Null
Add-Type -AssemblyName System.Drawing
$downloaded = 0
foreach ($metadataFile in Get-ChildItem -LiteralPath $sourceFolder -Filter '*.source.json') {
    $metadata = Get-Content -LiteralPath $metadataFile.FullName -Raw | ConvertFrom-Json
    $name = $metadataFile.Name.Replace('.source.json','')
    if ($name -notmatch '^[a-z0-9-]+\.jpg$') { throw "Invalid filename: $name" }
    $url = [uri]$metadata.DownloadUrl
    if ($url.Scheme -ne 'https' -or $url.Host -notin @('upload.wikimedia.org','thumb.wikimedia.org')) { throw 'Unexpected download host' }
    if ($metadata.GiayPhep -notmatch '^(CC BY|CC0)|Public domain') { throw "License requires review: $name" }
    $target = Join-Path $destination $name
    if (!(Test-Path -LiteralPath $target)) {
        $ok = $false
        for ($attempt=1; $attempt -le 3; $attempt++) {
            try {
                Invoke-WebRequest -Uri $url -OutFile $target -TimeoutSec 45 -Headers @{'User-Agent'='NVTTravelPhotoDownload/1.0 (educational project)'}
                $ok = $true
                break
            } catch {
                if ($attempt -eq 3) { throw }
                Start-Sleep -Seconds 2
            }
        }
        if (!$ok) { throw "Download failed: $name" }
        $downloaded++
    }
    $bytes = [IO.File]::ReadAllBytes($target)
    if ($bytes.Length -lt 1000 -or $bytes[0] -ne 255 -or $bytes[1] -ne 216) { throw "Not a JPEG: $name" }
    # Commons can regenerate thumbnails with different JPEG compression.
    # Record the checksum of this download, not the older website thumbnail.
    $metadata.Sha256 = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant()
    $metadata.DownloadedAt = (Get-Item -LiteralPath $target).LastWriteTimeUtc.ToString('o')
    $photo = [Drawing.Image]::FromFile($target)
    try { Write-Output ("OK {0} | {1}x{2} | {3} KB | {4}" -f $name,$photo.Width,$photo.Height,[math]::Round($bytes.Length/1024),$metadata.GiayPhep) }
    finally { $photo.Dispose() }
    $credit = Join-Path $metadataFolder ($name+'.source.json')
    if (!(Test-Path -LiteralPath $credit)) {
        [IO.File]::WriteAllText($credit,($metadata | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
    } elseif ((Get-Content -LiteralPath $credit -Raw | ConvertFrom-Json).Sha256 -ne $metadata.Sha256) {
        throw "Existing image differs from its saved checksum: $name"
    }
}
Write-Output "Downloaded $downloaded new photos. Folder: $destination"
