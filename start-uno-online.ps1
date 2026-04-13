# Define o código de cores
$Color_Off = "`e[0m"
$Color_Green = "`e[32m"
$Color_Yellow = "`e[33m"
$Color_Blue = "`e[34m"
$Color_Cyan = "`e[36m"

# Função para exibir o banner
function Show-Banner {
    Clear-Host
    Write-Host "${Color_Cyan}===================================================${Color_Off}"
    Write-Host "${Color_Cyan}      INICIANDO O SERVIDOR DO JOGO UNO ONLINE      ${Color_Off}"
    Write-Host "${Color_Cyan}===================================================${Color_Off}"
    Write-Host
}

# Função para exibir uma etapa com barra de progresso
function Write-Step {
    param(
        [string]$Message,
        [int]$Step,
        [int]$TotalSteps
    )
    $progress = ("=" * $Step).PadRight($TotalSteps)
    Write-Host "${Color_Yellow}[$Step/$TotalSteps] ${Message}...${Color_Off}"
}

# --- INÍCIO DO SCRIPT ---

Show-Banner

# 1. Iniciar os contêineres em modo detached
Write-Step "Iniciando os contêineres do Docker" 1 4
docker compose up -d --build --force-recreate

if ($LASTEXITCODE -ne 0) {
    Write-Host "${Color_Red}Falha ao iniciar os contêineres do Docker. Verifique se o Docker Desktop está em execução.${Color_Off}"
    Read-Host "Pressione Enter para sair"
    Exit 1
}

# 2. Aguardar o servidor UNO ficar pronto
Write-Step "Aguardando o servidor UNO (pode levar um minuto)" 2 4
$maxRetries = 30
$retryCount = 0
$serverUp = $false
while ($retryCount -lt $maxRetries -and -not $serverUp) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $serverUp = $true
        }
    } catch {
        # Ignora o erro e tenta novamente
    }
    if (-not $serverUp) {
        Start-Sleep -Seconds 2
        $retryCount++
    }
}

if (-not $serverUp) {
    Write-Host "${Color_Red}O servidor UNO não iniciou. Execute 'docker compose logs uno' para ver os detalhes do erro.${Color_Off}"
    Read-Host "Pressione Enter para sair"
    Exit 1
}

# 3. Obter a URL do Cloudflare Tunnel
Write-Step "Obtendo o link para o jogo online" 3 4
$tunnelUrl = $null
$maxRetriesTunnel = 20
$retryCountTunnel = 0
while ($null -eq $tunnelUrl -and $retryCountTunnel -lt $maxRetriesTunnel) {
    $logs = docker compose logs tunnel 2>&1 | ForEach-Object { $_ } # Captura stderr e stdout
    $tunnelUrl = $logs | Select-String -Pattern 'https?://[a-zA-Z0-9-]+\.trycloudflare\.com' | ForEach-Object { $_.Matches.Value } | Select-Object -First 1
    
    if ($null -eq $tunnelUrl) {
        Start-Sleep -Seconds 3
        $retryCountTunnel++
    }
}

if ($null -eq $tunnelUrl) {
    Write-Host "${Color_Red}Não foi possível obter a URL do túnel. Execute 'docker compose logs tunnel' para diagnosticar.${Color_Off}"
    Read-Host "Pressione Enter para sair"
    Exit 1
}

# 4. Abrir o navegador e exibir mensagem final
Write-Step "Abrindo o jogo no seu navegador" 4 4
Start-Process "$tunnelUrl/projects/uno/"

Write-Host
Write-Host "${Color_Green}===================================================${Color_Off}"
Write-Host "${Color_Green} SUCESSO! O JOGO ESTÁ PRONTO PARA JOGAR. ${Color_Off}"
Write-Host "${Color_Green}===================================================${Color_Off}"
Write-Host
Write-Host "${Color_Blue}Link para compartilhar com amigos:${Color_Off} ${tunnelUrl}/projects/uno/"
Write-Host
Write-Host "Você pode fechar esta janela quando terminar de jogar."
Write-Host "Os servidores continuarão rodando em segundo plano."
Write-Host "Para pará-los, execute o script ${Color_Yellow}stop-uno-online.bat${Color_Off}."
Write-Host

Read-Host "Pressione Enter para fechar esta janela de inicialização"
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
