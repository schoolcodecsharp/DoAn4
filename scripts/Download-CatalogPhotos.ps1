param([string]$ProjectRoot=(Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference='Stop'
$photos=Get-Content (Join-Path $ProjectRoot 'backend/Data/catalog-photos-20261001.json') -Raw | ConvertFrom-Json
$folder=Join-Path $ProjectRoot 'backend/wwwroot/media/catalog-20261001'
$metadata=Join-Path $ProjectRoot 'backend/Data/photo-sources'
New-Item -ItemType Directory -Force $folder | Out-Null
Add-Type -AssemblyName System.Drawing
$http=[Net.Http.HttpClient]::new(); $http.Timeout=[TimeSpan]::FromSeconds(40)
$http.DefaultRequestHeaders.UserAgent.ParseAdd('NVTTravelCatalog/1.0 (educational project)')
try {
    foreach($p in $photos) {
        if($p.key -notmatch '^[a-z0-9-]+$' -or $p.id -le 0) {throw 'Invalid filename'}
        $file=$p.key+'-'+$p.id+'.jpg'; $target=Join-Path $folder $file; $metaPath=Join-Path $metadata ($file+'.source.json')
        if(Test-Path $target) {
            if(!(Test-Path $metaPath)) {throw ('Untracked image, refusing overwrite: '+$file)}
            $meta=Get-Content $metaPath -Raw | ConvertFrom-Json
            if((Get-FileHash $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $meta.Sha256 -or $meta.Title -ne $p.title) {throw ('Existing file changed: '+$file)}
            Write-Output ('REUSE '+$file); continue
        }
        $uri=[uri]$p.download
        if($uri.Scheme -ne 'https' -or $uri.Host -notin @('upload.wikimedia.org','thumb.wikimedia.org')) {throw 'Unexpected image host'}
        for($attempt=1;$attempt -le 4;$attempt++) {
            try {$bytes=$http.GetByteArrayAsync($uri).GetAwaiter().GetResult(); break}
            catch {if($attempt -eq 4){throw};Start-Sleep -Seconds 15}
        }
        if($bytes.Length -lt 10000 -or $bytes.Length -gt 20000000 -or $bytes[0] -ne 255 -or $bytes[1] -ne 216) {throw ('Invalid JPEG '+$file)}
        $stream=[IO.MemoryStream]::new($bytes); $im=[Drawing.Image]::FromStream($stream)
        try {$width=$im.Width;$height=$im.Height} finally {$im.Dispose();$stream.Dispose()}
        if($width -lt 800 -or $height -lt 500){throw ('Too small: '+$file)}
        $record=[ordered]@{Title=$p.title;DuongDan=('/media/catalog-20261001/'+$file);MoTa=$p.caption;Nguon=$p.source;TacGia=$p.author;GiayPhep=$p.license;UrlGiayPhep=$p.licenseUrl;DownloadUrl=$p.download;Sha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant();DownloadedAt=[DateTime]::UtcNow.ToString('o');Width=$width;Height=$height}
        [IO.File]::WriteAllBytes($target,$bytes)
        $record | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 $metaPath
        Write-Output ('OK '+$file+' '+$width+'x'+$height)
        Start-Sleep -Seconds 2
    }
} finally {$http.Dispose()}
