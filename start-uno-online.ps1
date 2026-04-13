$ErrorActionPreference = 'Stop'

# Evita que mensagens informativas de stderr (ex.: docker build) parem o script.
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Step {
  param(
    [int]$Number,
    [int]$Total,
    [string]$Message,
    [string]$Color = 'Cyan'
  )

  $prefix = "[{0}/{1}]" -f $Number, $Total
  Write-Host ("{0} {1}" -f $prefix, $Message) -ForegroundColor $Color

  $filled = [math]::Round(($Number / $Total) * 20)
  $bar = ('#' * $filled).PadRight(20, '-')
  Write-Host ("      Progresso: [{0}]" -f $bar) -ForegroundColor DarkGray
}

function Wait-ServerUp {
  param(
    [string]$Url,
    [int]$Attempts = 60,
    [int]$DelaySeconds = 1
  )

  for ($i = 0; $i -lt $Attempts; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      # continua tentando até o timeout total
    }

    Start-Sleep -Seconds $DelaySeconds
  }

  return $false
}

function Get-TunnelUrlFromLogs {
  param([string]$Logs)

  $patterns = @(
    'https://[a-zA-Z0-9\-\.]+\.trycloudflare\.com',
    'https://[a-zA-Z0-9\-\.]+trycloudflare\.com'
  )

  foreach ($pattern in $patterns) {
    $match = [regex]::Match($Logs, $pattern)
    if ($match.Success) {
      return $match.Value
    }
  }

  return $null
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor DarkMagenta
Write-Host ' UNO ONLINE - INICIANDO O JOGO EM TEMPO REAL ' -ForegroundColor Magenta
Write-Host '============================================================' -ForegroundColor DarkMagenta
Write-Host ' Feche esta janela somente se quiser parar o jogo.' -ForegroundColor DarkGray
Write-Host ''

Write-Step 1 5 'Abrindo o projeto e preparando o ambiente...'
Write-Step 2 5 'Subindo o servidor do UNO em segundo plano...'
$composeOutput = & cmd /c "docker compose up -d --build" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host $composeOutput -ForegroundColor Red
  throw 'Falha ao iniciar os containers.'
}

$localUrl = 'http://localhost:8000/projects/uno/'
Write-Host '      Esperando o servidor local ficar pronto...' -ForegroundColor DarkGray
$localReady = Wait-ServerUp -Url $localUrl -Attempts 90 -DelaySeconds 1
if ($localReady) {
  Write-Host '      Servidor local pronto.' -ForegroundColor Green
  Write-Host '      Abrindo o jogo local enquanto o túnel prepara a URL pública...' -ForegroundColor Green
  Start-Process $localUrl
} else {
  Write-Host '      Servidor local demorou para responder, mas vou continuar com o túnel.' -ForegroundColor Yellow
}

Write-Step 3 5 'Aguardando o túnel público do Cloudflare...'
$publicUrl = $null
for ($i = 0; $i -lt 120 -and -not $publicUrl; $i++) {
  Start-Sleep -Seconds 2
  Write-Host '      ...procurando a URL publica no log do túnel' -ForegroundColor DarkGray
  $logs = & docker compose logs tunnel 2>&1
  $publicUrl = Get-TunnelUrlFromLogs -Logs $logs
}

if (-not $publicUrl) {
  Write-Step 4 5 'Nao consegui detectar a URL pública automaticamente.' 'Yellow'
  if (-not $localReady) {
    Write-Step 5 5 'Abrindo o acesso local como fallback: http://localhost:8000/projects/uno/' 'Yellow'
    Start-Process $localUrl
  } else {
    Write-Step 5 5 'Mantendo o jogo local aberto. Compartilhe apenas quando a URL pública aparecer.' 'Yellow'
  }
  Read-Host 'Pressione ENTER para fechar esta janela'
  exit 0
}

Write-Step 4 5 "URL pública encontrada: $publicUrl" 'Green'
Write-Step 5 5 'Abrindo o navegador agora...' 'Green'
Start-Process $publicUrl
Write-Host '      Jogo aberto no navegador.' -ForegroundColor Green
Read-Host 'Pressione ENTER para fechar esta janela'
