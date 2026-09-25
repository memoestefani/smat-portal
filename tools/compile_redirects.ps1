# tools/compile_redirects.ps1 - Compilador determinista de redirects.csv a public/_redirects
# SMAT Minerals Site (smatminerals.com)

$ErrorActionPreference = "Stop"

$SiteRoot = Split-Path -Parent $PSScriptRoot
$CsvPath = Join-Path $SiteRoot "data\redirects.csv"
$PublicDir = Join-Path $SiteRoot "public"
$RedirectsPath = Join-Path $PublicDir "_redirects"

if (-not (Test-Path $PublicDir)) {
    New-Item -ItemType Directory -Path $PublicDir -Force | Out-Null
}

if (-not (Test-Path $CsvPath)) {
    Write-Error "[ERROR] No se encontro el archivo data/redirects.csv en $CsvPath"
}

Write-Host "[INFO] Compilando redirects desde $CsvPath..." -ForegroundColor Cyan

$Lines = Import-Csv -Path $CsvPath
$OutputLines = @()

foreach ($Row in $Lines) {
    $Source = $Row.source.Trim()
    $Target = $Row.target.Trim()
    $Code = if ($Row.code) { $Row.code.Trim() } else { "301" }
    
    if ($Source -and $Target) {
        $OutputLines += "$Source $Target $Code"
    }
}

$OutputLines | Out-File -FilePath $RedirectsPath -Encoding ASCII -Force

Write-Host "[OK] Compilados $($OutputLines.Count) redireccionamientos en $RedirectsPath" -ForegroundColor Green
