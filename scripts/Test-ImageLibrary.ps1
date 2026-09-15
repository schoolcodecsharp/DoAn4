param([string]$ApiBase = 'http://127.0.0.1:5000/api', [string]$WebBase = 'http://127.0.0.1:5173')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content -Raw -LiteralPath (Join-Path $taskRoot 'backend/data/vietnam-images.json') | ConvertFrom-Json
$photos = Invoke-RestMethod "$ApiBase/hinhanh"
$expectedLinks = 0
foreach ($entry in $manifest) {
    $path = '/media/vietnam/' + $entry.file
    $response = Invoke-WebRequest ($WebBase + $path) -TimeoutSec 15
    if ($response.StatusCode -ne 200 -or $response.Headers['Content-Type'] -notmatch 'image/jpeg') { throw "Image did not load: $path" }
    foreach ($target in $entry.targets.PSObject.Properties) {
        foreach ($ownerId in $target.Value) {
            $matches = @($photos | Where-Object { $_.loaiDoiTuong -eq $target.Name -and $_.maDoiTuong -eq $ownerId -and $_.duongDan -eq $path })
            if ($matches.Count -ne 1) { throw "Missing or duplicate image: $($target.Name)/$ownerId $path" }
            if (!$matches[0].nguon -or !$matches[0].giayPhep) { throw "Missing source/license: $path" }
            $expectedLinks++
        }
    }
}
foreach ($endpoint in @('tour','diadiem','khachsan','nhahang','loaiphong')) {
    $rows = Invoke-RestMethod "$ApiBase/$endpoint"
    foreach ($row in $rows) {
        $first = @($row.hinhAnh)[0]
        if ($row.anhDaiDien -ne $first.duongDan) { throw "Cover is not derived from HinhAnh: $endpoint" }
    }
    Write-Output "$endpoint : $($rows.Count) records, image contract OK"
}
$privateWrite = Invoke-WebRequest "$ApiBase/hinhanh" -Method Post -ContentType 'application/json' -Body '{}' -SkipHttpErrorCheck
if ($privateWrite.StatusCode -ne 401) { throw 'Guest must not be allowed to modify image library.' }
Write-Output "PASS: $($manifest.Count) local images; $expectedLinks unique links; public reads and protected writes."
