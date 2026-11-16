$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$container = 'quoteai-phase0-' + [guid]::NewGuid().ToString('N').Substring(0, 12)
function Invoke-TestSql([string] $path) {
  Get-Content -Raw -LiteralPath $path | docker exec -i $container psql -U postgres -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) { throw "Local SQL failed: $path" }
}
try {
  docker run --rm --network none --name $container -e POSTGRES_HOST_AUTH_METHOD=trust -d postgres:17
  if ($LASTEXITCODE -ne 0) { throw 'Unable to start isolated PostgreSQL' }
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    docker exec $container pg_isready -U postgres 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
  }
  if (!$ready) { throw 'PostgreSQL startup timed out' }
  Invoke-TestSql (Join-Path $PSScriptRoot 'local-bootstrap.sql')
  Get-ChildItem -LiteralPath (Join-Path $repo 'supabase/migrations') -Filter '*.sql' |
    Sort-Object Name | ForEach-Object { Invoke-TestSql $_.FullName }
  Invoke-TestSql (Join-Path $PSScriptRoot 'phase0-local.sql')
} finally {
  docker stop $container | Out-Null
}
