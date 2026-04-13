$ErrorActionPreference = 'Stop'

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

Write-Host ''
Write-Host '============================================================' -ForegroundColor DarkMagenta
Write-Host ' UNO ONLINE - INICIANDO O JOGO EM TEMPO REAL ' -ForegroundColor Magenta
Write-Host '============================================================' -ForegroundColor DarkMagenta
Write-Host ' Feche esta janela somente se quiser parar o jogo.' -ForegroundColor DarkGray
Write-Host ''

Write-Step 1 5 'Abrindo o projeto e preparando o ambiente...'
Write-Step 2 5 'Subindo o servidor do UNO em segundo plano...'
$composeOutput = & docker compose up -d --build 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host $composeOutput -ForegroundColor Red
  throw 'Falha ao iniciar os containers.'
}
Write-Host '      Servidor local iniciado com sucesso.' -ForegroundColor Green
Write-Host '      Abrindo o jogo local enquanto o túnel prepara a URL pública...' -ForegroundColor Green
Start-Process 'http://localhost:8000/projects/uno/'

Write-Step 3 5 'Aguardando o túnel público do Cloudflare...'
$publicUrl = $null
for ($i = 0; $i -lt 60 -and -not $publicUrl; $i++) {
  Start-Sleep -Seconds 2
  Write-Host '      ...procurando a URL publica no log do túnel' -ForegroundColor DarkGray
  $logs = & docker compose logs tunnel 2>&1
  $match = [regex]::Match($logs, 'https://[a-zA-Z0-9\-\.]+trycloudflare\.com')
  if ($match.Success) {
    $publicUrl = $match.Value
    break
  }
}

if (-not $publicUrl) {
  Write-Step 4 5 'Nao consegui detectar a URL pública automaticamente.' 'Yellow'
  Write-Step 5 5 'Abrindo o acesso local como fallback: http://localhost:8000/projects/uno/' 'Yellow'
  Write-Host '      Jogo aberto no navegador.' -ForegroundColor Green
  Read-Host 'Pressione ENTER para fechar esta janela'
  exit 0
}

Write-Step 4 5 "URL pública encontrada: $publicUrl" 'Green'
Write-Step 5 5 'Abrindo o navegador agora...' 'Green'
Start-Process $publicUrl
Write-Host '      Jogo aberto no navegador.' -ForegroundColor Green
Read-Host 'Pressione ENTER para fechar esta janela'
