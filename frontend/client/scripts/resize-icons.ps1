Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $baseDir "public"
$srcPath = Join-Path $publicDir "images\logoSEEMEE1.png"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo file not found at $srcPath"
    exit 1
}

$src = [System.Drawing.Image]::FromFile($srcPath)

# 192x192
$b192 = New-Object System.Drawing.Bitmap(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($b192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.DrawImage($src, 0, 0, 192, 192)

$out192_img = Join-Path $publicDir "images\icon-192.png"
$out192_ico = Join-Path $publicDir "icons\icon-192.png"

$b192.Save($out192_img, [System.Drawing.Imaging.ImageFormat]::Png)
$b192.Save($out192_ico, [System.Drawing.Imaging.ImageFormat]::Png)

$g192.Dispose()
$b192.Dispose()
Write-Host "Generated 192x192 PNG: $out192_img and $out192_ico"

# 512x512
$b512 = New-Object System.Drawing.Bitmap(512, 512)
$g512 = [System.Drawing.Graphics]::FromImage($b512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.DrawImage($src, 0, 0, 512, 512)

$out512_img = Join-Path $publicDir "images\icon-512.png"
$out512_ico = Join-Path $publicDir "icons\icon-512.png"

$b512.Save($out512_img, [System.Drawing.Imaging.ImageFormat]::Png)
$b512.Save($out512_ico, [System.Drawing.Imaging.ImageFormat]::Png)

$g512.Dispose()
$b512.Dispose()
Write-Host "Generated 512x512 PNG: $out512_img and $out512_ico"

$src.Dispose()
