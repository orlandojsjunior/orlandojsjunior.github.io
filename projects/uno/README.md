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
