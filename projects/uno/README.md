# UNO Online - Pai e Filho

Projeto reescrito do zero para jogar UNO de verdade com 2 jogadores.

## Como funciona

- O pai cria a sala.
- O filho entra com o código.
- O servidor Python mantém a partida em tempo real.
- A interface é simples, grande e fácil de usar com uma criança de 6 anos.

## Regras básicas

- Jogadas por cor ou número.
- Cartas especiais: Pula, Reverte, +2, Cor e +4.
- UNO quando ficar com 2 cartas.
- Vence quem zerar a mão primeiro.

## Como rodar localmente

```bash
docker compose up --build
```

Depois abra:

`http://localhost:8000/projects/uno/`

## Como usar

1. O pai clica em "Sou o PAI" e cria a sala.
2. O filho clica em "Sou o FILHO" e entra com o código.
3. Joguem em tempo real.

## Passo a passo

1. Abra o terminal na raiz do repositório.
2. Rode `docker compose up --build`.
3. Espere aparecer a URL do Cloudflare no log do terminal.
4. Abra essa URL no navegador.
5. Clique em `Sou o PAI` e crie a sala.
6. Envie o código da sala para o seu filho.
7. O filho abre a mesma URL, clica em `Sou o FILHO` e entra com o código.
8. Jogue normalmente com as cartas da mão.

## Se der erro

- Se a URL pública não aparecer, verifique se o Docker terminou de subir.
- Se a sala não abrir, recarregue a página e tente de novo.
- Se cair a conexão, pare e rode `docker compose up --build` novamente.
