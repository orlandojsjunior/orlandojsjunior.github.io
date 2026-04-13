$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host 'Subindo o UNO em segundo plano...' -ForegroundColor Cyan
$composeOutput = & docker compose up -d --build 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host $composeOutput -ForegroundColor Red
  throw 'Falha ao iniciar os containers.'
}

Write-Host 'Aguardando a URL publica do Cloudflare Tunnel...' -ForegroundColor Cyan
$publicUrl = $null
for ($i = 0; $i -lt 60 -and -not $publicUrl; $i++) {
  Start-Sleep -Seconds 2
  $logs = & docker compose logs tunnel 2>&1
  $match = [regex]::Match($logs, 'https://[a-zA-Z0-9\-\.]+trycloudflare\.com')
  if ($match.Success) {
    $publicUrl = $match.Value
    break
  }
}

if (-not $publicUrl) {
  Write-Host 'Nao consegui detectar a URL publica automaticamente.' -ForegroundColor Yellow
  Write-Host 'Usando o acesso local como fallback: http://localhost:8000/projects/uno/' -ForegroundColor Yellow
  Start-Process 'http://localhost:8000/projects/uno/'
  exit 0
}

Write-Host "URL publica encontrada: $publicUrl" -ForegroundColor Green
Start-Process $publicUrl
