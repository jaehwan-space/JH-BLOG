$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "backups" | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = "backups/jh_blog-$timestamp.sql"

docker compose -p jh_blog exec -T db pg_dump -U jh_blog jh_blog | Set-Content -Encoding UTF8 -Path $target
Write-Host "Backup written to $target"
