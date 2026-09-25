# tools/clean_debris.ps1 - Script Soberano de Saneamiento y Purga de Debris
# SMAT Minerals Site (smatminerals.com)

$ErrorActionPreference = "Stop"

Write-Host "[INFO] Iniciando protocolo de saneamiento de debris en 2_smat/site..." -ForegroundColor Cyan

$SiteRoot = Split-Path -Parent $PSScriptRoot

# 1. Purgar archivos temporales y artefactos de sistema operativo (excluyendo node_modules, target, .git, dist)
$DebrisPatterns = @("*.tmp", "*~", "*.swp", ".DS_Store", "Thumbs.db", "desktop.ini")
$DeletedCount = 0
$ExcludeDirs = @("node_modules", "target", ".git", "dist", ".astro")

$TargetDirs = Get-ChildItem -Path $SiteRoot -Directory -Force | Where-Object { $ExcludeDirs -notcontains $_.Name }

foreach ($Pattern in $DebrisPatterns) {
    # Check root level
    $RootFiles = Get-ChildItem -Path $SiteRoot -Filter $Pattern -Force -ErrorAction SilentlyContinue
    foreach ($File in $RootFiles) {
        Write-Host "   [BORRADO] $($File.FullName)" -ForegroundColor Yellow
        Remove-Item -Path $File.FullName -Force
        $DeletedCount++
    }
    # Check non-ignored directories
    foreach ($Dir in $TargetDirs) {
        $Files = Get-ChildItem -Path $Dir.FullName -Recurse -Filter $Pattern -Force -ErrorAction SilentlyContinue
        foreach ($File in $Files) {
            Write-Host "   [BORRADO] $($File.FullName)" -ForegroundColor Yellow
            Remove-Item -Path $File.FullName -Force
            $DeletedCount++
        }
    }
}

# 2. Verificar que no existan archivos .env con secretos en el arbol publico
$EnvFiles = Get-ChildItem -Path $SiteRoot -Filter ".env*" -Force -ErrorAction SilentlyContinue
if ($EnvFiles.Count -gt 0) {
    Write-Warning "[WARN] Se detectaron archivos .env en el arbol del sitio."
}

# 3. Verificar que no se hayan copiado carpetas privadas de ideas/
$ForbiddenPaths = @("Cuenta BBVA", "ERP", "Warrants", "Clientes Minería SMAT")
foreach ($Forbidden in $ForbiddenPaths) {
    $ForbiddenItem = Join-Path $SiteRoot $Forbidden
    if (Test-Path $ForbiddenItem) {
        Write-Error "[ERROR] VIOLACION DE FRONTERA HERMETICA: Se detecto carpeta confidencial '$Forbidden' en site/. Abortando."
    }
}

Write-Host "[OK] Protocolo de saneamiento completado. $DeletedCount archivos de debris eliminados. Frontera hermetica verificada." -ForegroundColor Green
