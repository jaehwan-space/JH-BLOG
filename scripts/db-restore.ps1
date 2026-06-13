$ErrorActionPreference = "Stop"

$latest = Get-ChildItem -Path "backups" -Filter "jh_blog-*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latest) {
  throw "No backup file found in backups/"
}

Get-Content -Raw -Path $latest.FullName | docker compose -p jh_blog exec -T db psql -U jh_blog jh_blog
Write-Host "Restored from $($latest.FullName)"
