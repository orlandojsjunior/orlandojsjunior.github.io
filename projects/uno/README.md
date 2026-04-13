# UNO Online - Pai e Filho

Versao simples de UNO para 2 jogadores, feita em HTML/CSS/JS, com conexao em tempo real via PeerJS (WebRTC).

## Como jogar

1. Abra o arquivo `index.html` no navegador (de preferencia usando um servidor local).
2. Jogador 1: digite o nome e clique em **Criar sala**.
3. Compartilhe o codigo da sala com o Jogador 2.
4. Jogador 2: digite o nome, informe o codigo e clique em **Entrar**.
5. Joguem em tempo real.

## Regras implementadas

- 2 jogadores
- Cartas numericas (0-9)
- Cartas especiais: Pula, Reverso, +2, Cor, +4
- Botao UNO (se esquecer UNO ao ficar com 1 carta, compra 2)
- Compra de 1 carta por turno
- Vitoria quando ficar sem cartas

## Dicas

- Para uso local mais estavel, rode com servidor web simples.
- Exemplo com Node.js: `npx serve .`
- Exemplo com Python: `python -m http.server 8080`

Depois abra `http://localhost:8080`.

## Publicar para jogar pela internet

Voce pode publicar esta pasta em qualquer hospedagem esttica:

- GitHub Pages
- Netlify
- Vercel

Depois, voce e seu filho acessam a mesma URL em dispositivos diferentes.
