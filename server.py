from __future__ import annotations

import json
import random
import string
from pathlib import Path
from typing import Any

from aiohttp import WSMsgType, web

ROOT = Path(__file__).resolve().parent
UNO_DIR = ROOT / "projects" / "uno"

COLORS = ("R", "G", "B", "Y")
COLOR_NAMES = {
    "R": "Vermelho",
    "G": "Verde",
    "B": "Azul",
    "Y": "Amarelo",
    "W": "Livre",
}
VALUE_LABELS = {
    "SKIP": "Pula",
    "REV": "Reverte",
    "D2": "+2",
    "WILD": "Cor",
    "W4": "+4",
}

ROOMS: dict[str, dict[str, Any]] = {}
CLIENTS: dict[int, dict[str, Any]] = {}


def normalize_name(value: Any) -> str:
    name = str(value or "").strip()
    return name[:24]


def random_room_code() -> str:
    while True:
        code = "".join(random.choices(
            string.ascii_uppercase + string.digits, k=6))
        if code not in ROOMS:
            return code


def create_deck() -> list[dict[str, str]]:
    deck: list[dict[str, str]] = []
    next_id = 0

    for color in COLORS:
        deck.append({"id": f"C{next_id}", "color": color, "value": "0"})
        next_id += 1

        for number in range(1, 10):
            deck.append(
                {"id": f"C{next_id}", "color": color, "value": str(number)})
            next_id += 1
            deck.append(
                {"id": f"C{next_id}", "color": color, "value": str(number)})
            next_id += 1

        for value in ("SKIP", "REV", "D2"):
            deck.append({"id": f"C{next_id}", "color": color, "value": value})
            next_id += 1
            deck.append({"id": f"C{next_id}", "color": color, "value": value})
            next_id += 1

    for _ in range(4):
        deck.append({"id": f"W{next_id}", "color": "W", "value": "WILD"})
        next_id += 1
        deck.append({"id": f"W{next_id}", "color": "W", "value": "W4"})
        next_id += 1

    random.shuffle(deck)
    return deck


def build_state(room_code: str, host_name: str, guest_name: str) -> dict[str, Any]:
    draw_pile = create_deck()
    players = [
        {"name": host_name, "hand": []},
        {"name": guest_name, "hand": []},
    ]

    for _ in range(7):
        players[0]["hand"].append(draw_pile.pop())
        players[1]["hand"].append(draw_pile.pop())

    first_card = draw_pile.pop()
    while first_card["value"] in {"WILD", "W4"}:
        draw_pile.insert(0, first_card)
        first_card = draw_pile.pop()

    return {
        "roomCode": room_code,
        "players": players,
        "drawPile": draw_pile,
        "discard": [first_card],
        "activeColor": first_card["color"],
        "turn": 0,
        "winner": None,
        "saidUno": [False, False],
        "lastAction": "Partida iniciada",
    }


def card_label(card: dict[str, str]) -> str:
    return VALUE_LABELS.get(card["value"], card["value"])


def color_name(color: str) -> str:
    return COLOR_NAMES.get(color, "-")


def can_play(card: dict[str, str], top_card: dict[str, str], active_color: str) -> bool:
    if card["value"] in {"WILD", "W4"}:
        return True
    return card["color"] == active_color or card["value"] == top_card["value"]


def ensure_draw_pile(state: dict[str, Any]) -> None:
    if state["drawPile"]:
        return

    top = state["discard"].pop()
    recycled = state["discard"]
    random.shuffle(recycled)
    state["drawPile"] = recycled
    state["discard"] = [top]


def draw_cards(state: dict[str, Any], player_index: int, count: int) -> None:
    for _ in range(count):
        ensure_draw_pile(state)
        if not state["drawPile"]:
            break
        state["players"][player_index]["hand"].append(state["drawPile"].pop())


def advance_turn(state: dict[str, Any], steps: int) -> None:
    state["turn"] = (state["turn"] + steps) % 2


def apply_card_effect(state: dict[str, Any], card: dict[str, str], chosen_color: str | None) -> None:
    if card["value"] in {"SKIP", "REV"}:
        advance_turn(state, 2)
        return

    if card["value"] == "D2":
        target = (state["turn"] + 1) % 2
        draw_cards(state, target, 2)
        advance_turn(state, 2)
        return

    if card["value"] == "W4":
        target = (state["turn"] + 1) % 2
        draw_cards(state, target, 4)
        state["activeColor"] = chosen_color
        advance_turn(state, 2)
        return

    if card["value"] == "WILD":
        state["activeColor"] = chosen_color
        advance_turn(state, 1)
        return

    state["activeColor"] = card["color"]
    advance_turn(state, 1)


async def send_json(ws: web.WebSocketResponse | None, payload: dict[str, Any]) -> None:
    if ws is not None and not ws.closed:
        await ws.send_json(payload)


async def broadcast_room(room: dict[str, Any]) -> None:
    state = room.get("state")
    if state is None:
        return

    payload = {"type": "state", "state": state}
    await send_json(room["host"].get("ws"), payload)
    guest = room.get("guest")
    if guest:
        await send_json(guest.get("ws"), payload)


async def send_room_status(room: dict[str, Any], message: str) -> None:
    payload = {"type": "status", "message": message}
    await send_json(room["host"].get("ws"), payload)
    guest = room.get("guest")
    if guest:
        await send_json(guest.get("ws"), payload)


async def send_error(ws: web.WebSocketResponse, message: str) -> None:
    await send_json(ws, {"type": "error", "message": message})


async def disconnect_client(ws: web.WebSocketResponse) -> None:
    meta = CLIENTS.pop(id(ws), None)
    if not meta:
        return

    room = ROOMS.get(meta["roomCode"])
    if not room:
        return

    role = meta["role"]
    slot = room.get(role)
    if slot and slot.get("ws") is ws:
        slot["ws"] = None

    if room.get("state") is not None:
        if role == "host":
            room["state"]["lastAction"] = "O pai saiu da sala. A partida foi pausada."
        else:
            room["state"]["lastAction"] = "O filho saiu da sala. A partida foi pausada."
        await broadcast_room(room)

    if room.get("host", {}).get("ws") is None and room.get("guest", {}).get("ws") is None:
        ROOMS.pop(room["code"], None)


async def handle_create(ws: web.WebSocketResponse, data: dict[str, Any]) -> None:
    name = normalize_name(data.get("name"))
    if not name:
        await send_error(ws, "Digite um nome antes de criar a sala.")
        return

    meta = CLIENTS.get(id(ws))
    if meta and meta.get("roomCode"):
        await send_error(ws, "Você já está conectado a uma sala.")
        return

    room_code = random_room_code()
    ROOMS[room_code] = {
        "code": room_code,
        "host": {"name": name, "ws": ws},
        "guest": None,
        "state": None,
    }
    CLIENTS[id(ws)] = {"roomCode": room_code, "role": "host", "name": name}

    await ws.send_json({
        "type": "room_created",
        "roomCode": room_code,
        "message": "Sala criada. Compartilhe o código com seu filho.",
    })
    await send_room_status(ROOMS[room_code], "Aguardando o filho entrar...")


async def handle_join(ws: web.WebSocketResponse, data: dict[str, Any]) -> None:
    name = normalize_name(data.get("name"))
    room_code = str(data.get("roomCode") or "").strip().upper()

    if not name:
        await send_error(ws, "Digite um nome antes de entrar na sala.")
        return

    if not room_code:
        await send_error(ws, "Informe o código da sala.")
        return

    meta = CLIENTS.get(id(ws))
    if meta and meta.get("roomCode"):
        await send_error(ws, "Você já está conectado a uma sala.")
        return

    room = ROOMS.get(room_code)
    if not room or room["host"].get("ws") is None:
        await send_error(ws, "Sala não encontrada ou já encerrada.")
        return

    if room.get("guest") and room["guest"].get("ws") is not None:
        await send_error(ws, "Essa sala já está cheia.")
        return

    room["guest"] = {"name": name, "ws": ws}
    CLIENTS[id(ws)] = {"roomCode": room_code, "role": "guest", "name": name}

    if room.get("state") is None:
        room["state"] = build_state(room_code, room["host"]["name"], name)

    await ws.send_json({
        "type": "joined",
        "roomCode": room_code,
        "message": "Você entrou na sala.",
    })
    await send_room_status(room, "Os dois jogadores estão prontos. O pai começa.")
    await broadcast_room(room)


async def handle_play(ws: web.WebSocketResponse, data: dict[str, Any]) -> None:
    meta = CLIENTS.get(id(ws))
    if not meta:
        await send_error(ws, "Entre na sala antes de jogar.")
        return

    room = ROOMS.get(meta["roomCode"])
    state = room.get("state") if room else None
    if not room or state is None:
        await send_error(ws, "A partida ainda não começou.")
        return

    player_index = 0 if meta["role"] == "host" else 1
    if state["winner"] is not None:
        await send_error(ws, "A partida já terminou.")
        return

    if player_index != state["turn"]:
        await send_error(ws, "Não é a sua vez.")
        return

    card_id = str(data.get("cardId") or "")
    chosen_color = data.get("chosenColor")
    hand = state["players"][player_index]["hand"]
    selected_index = next(
        (index for index, card in enumerate(hand) if card["id"] == card_id), -1)
    if selected_index == -1:
        await send_error(ws, "Carta inválida.")
        return

    card = hand[selected_index]
    top_card = state["discard"][-1]
    if not can_play(card, top_card, state["activeColor"]):
        await send_error(ws, "Essa carta não pode ser jogada agora.")
        return

    if card["value"] in {"WILD", "W4"} and chosen_color not in COLORS:
        await send_error(ws, "Escolha uma cor antes de jogar essa carta.")
        return

    hand.pop(selected_index)
    state["discard"].append(card)

    if card["value"] not in {"WILD", "W4"}:
        state["activeColor"] = card["color"]

    previous_turn = state["turn"]
    apply_card_effect(state, card, chosen_color)

    if len(hand) == 1 and not state["saidUno"][player_index]:
        draw_cards(state, player_index, 2)
        state["lastAction"] = f"{state['players'][player_index]['name']} esqueceu UNO e comprou 2 cartas."
    else:
        state["lastAction"] = f"{state['players'][player_index]['name']} jogou {color_name(card['color'])} {card_label(card)}."

    state["saidUno"][previous_turn] = False

    if len(hand) == 0:
        state["winner"] = player_index
        state["lastAction"] = f"{state['players'][player_index]['name']} venceu a partida!"

    await broadcast_room(room)


async def handle_draw(ws: web.WebSocketResponse) -> None:
    meta = CLIENTS.get(id(ws))
    if not meta:
        await send_error(ws, "Entre na sala antes de comprar cartas.")
        return

    room = ROOMS.get(meta["roomCode"])
    state = room.get("state") if room else None
    if not room or state is None:
        await send_error(ws, "A partida ainda não começou.")
        return

    player_index = 0 if meta["role"] == "host" else 1
    if state["winner"] is not None:
        await send_error(ws, "A partida já terminou.")
        return

    if player_index != state["turn"]:
        await send_error(ws, "Não é a sua vez.")
        return

    draw_cards(state, player_index, 1)
    state["saidUno"][player_index] = False
    state["lastAction"] = f"{state['players'][player_index]['name']} comprou 1 carta."
    advance_turn(state, 1)
    await broadcast_room(room)


async def handle_uno(ws: web.WebSocketResponse) -> None:
    meta = CLIENTS.get(id(ws))
    if not meta:
        await send_error(ws, "Entre na sala antes de gritar UNO.")
        return

    room = ROOMS.get(meta["roomCode"])
    state = room.get("state") if room else None
    if not room or state is None:
        await send_error(ws, "A partida ainda não começou.")
        return

    player_index = 0 if meta["role"] == "host" else 1
    if player_index != state["turn"]:
        await send_error(ws, "Não é a sua vez.")
        return

    if len(state["players"][player_index]["hand"]) == 2:
        state["saidUno"][player_index] = True
        state["lastAction"] = f"{state['players'][player_index]['name']} gritou UNO!"
        await broadcast_room(room)
    else:
        await send_error(ws, "UNO só vale quando você tem 2 cartas.")


async def handle_restart(ws: web.WebSocketResponse) -> None:
    meta = CLIENTS.get(id(ws))
    if not meta:
        await send_error(ws, "Entre na sala antes de reiniciar.")
        return

    room = ROOMS.get(meta["roomCode"])
    if not room or room.get("host", {}).get("ws") is None or room.get("guest", {}).get("ws") is None:
        await send_error(ws, "É preciso ter os dois jogadores na sala.")
        return

    room["state"] = build_state(
        room["code"], room["host"]["name"], room["guest"]["name"])
    room["state"]["lastAction"] = "Nova partida iniciada."
    await broadcast_room(room)


async def websocket_handler(request: web.Request) -> web.WebSocketResponse:
    ws = web.WebSocketResponse(heartbeat=25)
    await ws.prepare(request)

    CLIENTS[id(ws)] = {"roomCode": None, "role": None, "name": None}
    await ws.send_json({"type": "hello", "message": "Servidor pronto para criar salas."})

    try:
        async for msg in ws:
            if msg.type != WSMsgType.TEXT:
                continue

            try:
                data = json.loads(msg.data)
            except json.JSONDecodeError:
                await send_error(ws, "Mensagem inválida.")
                continue

            message_type = data.get("type")
            if message_type == "create":
                await handle_create(ws, data)
            elif message_type == "join":
                await handle_join(ws, data)
            elif message_type == "play":
                await handle_play(ws, data)
            elif message_type == "draw":
                await handle_draw(ws)
            elif message_type == "uno":
                await handle_uno(ws)
            elif message_type == "restart":
                await handle_restart(ws)
            else:
                await send_error(ws, "Comando desconhecido.")
    finally:
        await disconnect_client(ws)

    return ws


async def root_index(request: web.Request) -> web.StreamResponse:
    index_path = ROOT / "index.html"
    if index_path.exists():
        return web.FileResponse(index_path)
    raise web.HTTPNotFound()


async def uno_index(request: web.Request) -> web.StreamResponse:
    index_path = UNO_DIR / "index.html"
    if index_path.exists():
        return web.FileResponse(index_path)
    raise web.HTTPNotFound()


app = web.Application()
app.router.add_get("/", root_index)
app.router.add_get("/projects/uno/", uno_index)
app.router.add_get("/projects/uno/ws", websocket_handler)
app.router.add_static("/projects/uno", UNO_DIR, show_index=False)


if __name__ == "__main__":
    web.run_app(app, host="0.0.0.0", port=8000)
