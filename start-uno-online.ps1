$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Step {
  param(
    [int]$Number,
    [string]$Message,
    [string]$Color = 'Cyan'
  )

  Write-Host ("[{0}/5] {1}" -f $Number, $Message) -ForegroundColor $Color
}

Write-Step 1 'Abrindo o projeto e preparando o ambiente...'
Write-Step 2 'Subindo o servidor do UNO em segundo plano...'
$composeOutput = & docker compose up -d --build 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host $composeOutput -ForegroundColor Red
  throw 'Falha ao iniciar os containers.'
}

Write-Step 3 'Aguardando o túnel público do Cloudflare...'
$publicUrl = $null
for ($i = 0; $i -lt 60 -and -not $publicUrl; $i++) {
  Start-Sleep -Seconds 2
  Write-Host '   ...procurando a URL publica no log do túnel' -ForegroundColor DarkGray
  $logs = & docker compose logs tunnel 2>&1
  $match = [regex]::Match($logs, 'https://[a-zA-Z0-9\-\.]+trycloudflare\.com')
  if ($match.Success) {
    $publicUrl = $match.Value
    break
  }
}

if (-not $publicUrl) {
  Write-Step 4 'Nao consegui detectar a URL pública automaticamente.' 'Yellow'
  Write-Step 5 'Abrindo o acesso local como fallback: http://localhost:8000/projects/uno/' 'Yellow'
  Start-Process 'http://localhost:8000/projects/uno/'
  exit 0
}

Write-Step 4 "URL pública encontrada: $publicUrl" 'Green'
Write-Step 5 'Abrindo o navegador agora...' 'Green'
Start-Process $publicUrl
