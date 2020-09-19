import { Methods } from "./.rtag/methods";
import {
  PlayerData,
  ICreateGameRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IPlayCardRequest,
  IDrawCardRequest,
  PlayerState,
  Card,
  Color,
  PlayerName,
} from "./.rtag/types";

interface InternalState {
  deck: Card[];
  players: PlayerName[];
  hands: Map<PlayerName, Card[]>;
  pile?: Card;
  turn: PlayerName;
  winner?: PlayerName;
}

export class Impl implements Methods<InternalState> {
  createGame(userData: PlayerData, request: ICreateGameRequest): InternalState {
    const deck = [];
    for (let i = 2; i <= 9; i++) {
      deck.push({ value: i, color: Color.RED });
      deck.push({ value: i, color: Color.BLUE });
      deck.push({ value: i, color: Color.GREEN });
      deck.push({ value: i, color: Color.YELLOW });
    }
    return { deck, players: [userData.playerName], hands: new Map(), turn: userData.playerName };
  }
  joinGame(state: InternalState, userData: PlayerData, request: IJoinGameRequest): string | void {
    state.players.push(userData.playerName);
  }
  startGame(state: InternalState, userData: PlayerData, request: IStartGameRequest): string | void {
    state.deck = shuffle(state.deck);
    state.players.forEach((playerName) => {
      state.hands.set(playerName, []);
      for (let i = 0; i < 7; i++) {
        state.hands.get(playerName)!.push(state.deck.pop()!);
      }
    });
    state.pile = state.deck.pop();
  }
  playCard(state: InternalState, userData: PlayerData, request: IPlayCardRequest): string | void {
    if (state.turn != userData.playerName) {
      return "Not your turn";
    }
    if (request.card.color != state.pile!.color && request.card.value != state.pile!.value) {
      return "Doesn't match top of pile";
    }
    const hand = state.hands.get(userData.playerName)!;
    const cardIdx = hand.findIndex((card) => card.value == request.card.value && card.color == request.card.color);
    if (cardIdx < 0) {
      return "Card not in hand";
    }
    // remove from hand
    hand.splice(cardIdx, 1);
    // update pile
    state.pile = request.card;
    // check if won
    if (hand.length == 0) {
      state.winner = userData.playerName;
      return;
    }
    // upate turn
    const currIdx = state.players.indexOf(state.turn);
    const nextIdx = (currIdx + 1) % state.players.length;
    state.turn = state.players[nextIdx];
  }
  drawCard(state: InternalState, userData: PlayerData, request: IDrawCardRequest): string | void {
    const hand = state.hands.get(userData.playerName)!;
    hand.push(state.deck.pop()!);
  }
  getUserState(state: InternalState, userData: PlayerData): PlayerState {
    return {
      hand: state.hands.get(userData.playerName)!,
      players: state.players,
      turn: state.turn,
      pile: state.pile,
      winner: state.winner,
    };
  }
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
