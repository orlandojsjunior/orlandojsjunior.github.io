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

## Para jogar de outra cidade

O `docker compose` agora sobe também um túnel Cloudflare temporário.

1. Rode `docker compose up --build`
2. Espere a linha do `cloudflared` mostrar uma URL pública `https://...trycloudflare.com`
3. Abra essa URL no navegador do pai
4. O filho abre a mesma URL na cidade dele e entra com o código da sala

Se quiser, depois eu posso trocar isso por um túnel fixo com domínio próprio.
