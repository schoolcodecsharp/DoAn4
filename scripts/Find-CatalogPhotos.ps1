param([string]$ProjectRoot=(Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference='Stop'
$manifest=Get-Content (Join-Path $ProjectRoot 'database/catalog-enrichment-20261001.json') -Raw | ConvertFrom-Json
$folder=Join-Path $ProjectRoot '.local'; New-Item -ItemType Directory -Force $folder | Out-Null
$cache=Join-Path $folder 'catalog-photo-candidates.json'
$results=@(if(Test-Path $cache){Get-Content $cache -Raw | ConvertFrom-Json})
foreach($item in @($manifest.destinations)+@($manifest.hotels)) {
    if($results.key -contains $item.key){continue}
    $uri='https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=5&gsrsearch='+[uri]::EscapeDataString($item.query+' filetype:bitmap')+'&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Cextmetadata&iiurlwidth=1280'
    for($attempt=1;$attempt -le 4;$attempt++) {
        try {$response=Invoke-RestMethod $uri -Headers @{'User-Agent'='NVTTravelCatalog/1.0 (educational project)'} -TimeoutSec 30;break}
        catch {if($attempt -eq 4){throw};Start-Sleep -Seconds 20}
    }
    foreach($page in $response.query.pages.psobject.Properties.Value) {
        $info=$page.imageinfo[0]; $meta=$info.extmetadata
        function Plain($v) { [Net.WebUtility]::HtmlDecode([regex]::Replace([string]$v,'<[^>]+>','')).Trim() }
        if($info.mime -ne 'image/jpeg' -or $info.width -lt 1000 -or $info.height -lt 600) { continue }
        $license=Plain $meta.LicenseShortName.value
        if($license -notmatch '^CC BY(-SA)? [1-4]\.0$|^CC0') {continue}
        $results += [ordered]@{key=$item.key;id=$page.pageid;title=$page.title;description=(Plain $meta.ImageDescription.value);source=$info.descriptionurl;author=(Plain $meta.Artist.value);license=$license;licenseUrl=(Plain $meta.LicenseUrl.value);download=$info.thumburl;width=$info.thumbwidth;height=$info.thumbheight}
    }
    Write-Output ('SEARCH '+$item.key)
    $results | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 $cache
    Start-Sleep -Seconds 5
}
$folder=Join-Path $ProjectRoot '.local'; New-Item -ItemType Directory -Force $folder | Out-Null
$results | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 (Join-Path $folder 'catalog-photo-candidates.json')
$results | ForEach-Object { '{0} | {1} | {2} | {3}' -f $_.key,$_.id,$_.license,$_.title }
