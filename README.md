# [orlandojsjunior.github.io](https://orlandojsjunior.github.io)

## Site pessoal e portifólio - Orlando Junior

## Projetos

- Página pessoal e portfólio
- UNO jogável em `projects/uno/`

## Como testar o UNO

```bash
docker compose up --build
```

Depois abra:

`http://localhost:8000/projects/uno/`

O pai cria a sala e o filho entra com o código.

## Um clique

Se quiser abrir o jogo sem digitar comando, dê dois cliques em `start-uno-online.bat` na raiz do repositório.

Esse arquivo sobe os containers, espera a URL pública do Cloudflare e abre o navegador automaticamente.

## Para jogar de outra cidade

O `docker compose` agora sobe também um túnel Cloudflare temporário.

1. Abra o terminal na raiz do projeto.
2. Rode `docker compose up --build`.
3. Espere o container subir sem erros.
4. Procure no log do `cloudflared` uma URL pública no formato `https://...trycloudflare.com`.
5. Abra essa URL no navegador do pai.
6. No jogo, clique em `Sou o PAI`, digite o nome e crie a sala.
7. Copie o código da sala e envie para o filho.
8. O filho abre a mesma URL, clica em `Sou o FILHO`, digita o nome e entra com o código.
9. Se a partida cair, feche tudo e rode `docker compose up --build` de novo.

## Resumo rápido

1. Suba o Docker.
2. Pegue a URL pública do Cloudflare.
3. Pai cria a sala.
4. Filho entra com o código.
5. Jogar.

Se quiser, depois eu posso trocar isso por um túnel fixo com domínio próprio.
