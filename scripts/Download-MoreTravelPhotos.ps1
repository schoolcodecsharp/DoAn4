param([int]$Count=60,[string]$ProjectRoot=(Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference='Stop'
$folder=Join-Path $ProjectRoot 'AnhDuLich'
$metadataFolder=Join-Path $ProjectRoot 'backend/Data/photo-sources'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
New-Item -ItemType Directory -Path $metadataFolder -Force | Out-Null
Add-Type -AssemblyName System.Drawing
$http=[Net.Http.HttpClient]::new()
$http.Timeout=[TimeSpan]::FromSeconds(30)
$http.DefaultRequestHeaders.UserAgent.ParseAdd('NVTTravelPhotoLibrary/1.0 (educational travel project)')
$titles=[Collections.Generic.HashSet[string]]::new()
$hashes=[Collections.Generic.HashSet[string]]::new()
Get-ChildItem -LiteralPath $metadataFolder -Filter '*.source.json' | ForEach-Object {
    $m=Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
    [void]$titles.Add($m.Title)
    [void]$hashes.Add($m.Sha256)
}
$topics=@(
    @('sa-pa','Sa Pa landscape Vietnam'),
    @('ninh-binh','Trang An Ninh Binh'),
    @('phu-quoc','Phu Quoc beach'),
    @('nha-trang','Nha Trang beach'),
    @('quy-nhon','Quy Nhon coast'),
    @('mui-ne','Mui Ne sand dunes'),
    @('phong-nha','Phong Nha cave'),
    @('ho-guom','Hoan Kiem lake'),
    @('hoi-an','Hoi An ancient town'),
    @('ha-long','Ha Long Bay islands'),
    @('da-lat','Da Lat landscape'),
    @('hue','Hue Imperial City'),
    @('tam-coc','Tam Coc landscape'),
    @('ha-giang','Ha Giang landscape'),
    @('con-dao','Con Dao beach'),
    @('ban-gioc','Ban Gioc waterfall')
)
function Text-Meta($metadata,[string]$name) {
    $value=$metadata.$name.value
    if (!$value) { return '' }
    return [Net.WebUtility]::HtmlDecode([regex]::Replace([string]$value,'<[^>]+>','')).Trim()
}
function Download-Bytes([string]$url) {
    for($try=1;$try -le 3;$try++) {
        try { return ,($http.GetByteArrayAsync($url).GetAwaiter().GetResult()) }
        catch { if($try -eq 3) { throw }; Start-Sleep -Seconds (2*$try) }
    }
}
$added=0
try {
    foreach($topic in $topics) {
        if($added -ge $Count) { break }
        $slug=$topic[0];$query=$topic[1]+' filetype:bitmap'
        $url='https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=18&gsrsearch='+[uri]::EscapeDataString($query)+'&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1280'
        try { $result=[Text.Encoding]::UTF8.GetString((Download-Bytes $url)) | ConvertFrom-Json }
        catch { Write-Output "SEARCH SKIP $slug"; continue }
        $topicCount=0
        foreach($page in ($result.query.pages.psobject.Properties.Value | Sort-Object index)) {
            if($topicCount -ge 5 -or $added -ge $Count) { break }
            if($titles.Contains($page.title) -or !$page.imageinfo) { continue }
            $normalized=[regex]::Replace($page.title.Normalize([Text.NormalizationForm]::FormD),'\p{Mn}','').ToLowerInvariant().Replace('đ','d')
            $placePattern=switch($slug) {
                'sa-pa' {'sa pa|sapa'} 'ninh-binh' {'trang an|ninh binh'}
                'phu-quoc' {'phu quoc'} 'nha-trang' {'nha trang'} 'quy-nhon' {'quy nhon|thap doi'}
                'mui-ne' {'mui ne'} 'phong-nha' {'phong nha|dong hoi'} 'ho-guom' {'hoan kiem|ho guom'}
                'hoi-an' {'hoi an'} 'ha-long' {'ha long|halong'} 'da-lat' {'da lat|dalat'}
                'hue' {'hue'} 'tam-coc' {'tam coc'} 'ha-giang' {'ha giang'} 'con-dao' {'con dao'}
                'ban-gioc' {'ban gioc'}
            }
            if($normalized -notmatch $placePattern) { continue }
            $info=$page.imageinfo[0];$ext=$info.extmetadata
            $license=Text-Meta $ext 'LicenseShortName'
            if($info.mime -ne 'image/jpeg' -or $info.width -lt 1000 -or $info.height -lt 600 -or $license -notmatch '^(CC BY|CC0)|Public domain') { continue }
            if($page.title -match '(?i)map|logo|flag|poster|coat of arms|portrait|banner') { continue }
            $photoUrl=if($info.thumburl){$info.thumburl}else{$info.url}
            $uri=[uri]$photoUrl
            if($uri.Scheme -ne 'https' -or $uri.Host -notin @('upload.wikimedia.org','thumb.wikimedia.org')) { continue }
            $file="$slug-$($page.pageid).jpg";$target=Join-Path $folder $file
            if(Test-Path -LiteralPath $target) { continue }
            try {
                $bytes=Download-Bytes $photoUrl
                if($bytes.Length -lt 10000 -or $bytes.Length -gt 20000000 -or $bytes[0] -ne 255 -or $bytes[1] -ne 216) { continue }
                $hash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
                if($hashes.Contains($hash)) { continue }
                $stream=[IO.MemoryStream]::new($bytes)
                $photo=[Drawing.Image]::FromStream($stream)
                try { $width=$photo.Width;$height=$photo.Height }
                finally { $photo.Dispose();$stream.Dispose() }
                if($width -lt 800 -or $height -lt 500) { continue }
                $record=[ordered]@{
                    Title=$page.title;DuongDan=$file;MoTa=(Text-Meta $ext 'ImageDescription');
                    Nguon=$info.descriptionurl;TacGia=(Text-Meta $ext 'Artist');GiayPhep=$license;
                    UrlGiayPhep=(Text-Meta $ext 'LicenseUrl');DownloadUrl=$photoUrl;
                    Sha256=$hash;DownloadedAt=[DateTime]::UtcNow.ToString('o');Width=$width;Height=$height
                }
                [IO.File]::WriteAllBytes($target,$bytes)
                [IO.File]::WriteAllText((Join-Path $metadataFolder ($file+'.source.json')),($record|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
                [void]$titles.Add($page.title);[void]$hashes.Add($hash)
                $added++;$topicCount++
                Write-Output "OK $added/$Count $file | $width x $height | $license | $($page.title)"
            } catch { Write-Output "DOWNLOAD SKIP $($page.title): $($_.Exception.GetType().Name)" }
        }
    }
} finally { $http.Dispose() }
Write-Output "FINISHED: added=$added total=$((Get-ChildItem -LiteralPath $folder -Filter '*.jpg').Count)"
if($added -lt $Count) { Write-Output 'Some topics had too few eligible images; existing files were preserved.' }
