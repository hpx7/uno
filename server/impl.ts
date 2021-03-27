import { Methods } from "./.rtag/methods";
import {
  UserData,
  Result,
  PlayerState,
  ICreateGameRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IPlayCardRequest,
  IDrawCardRequest,
  Card,
  PlayerName,
  Color,
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
  createGame(user: UserData, request: ICreateGameRequest): InternalState {
    const deck = [];
    for (let i = 2; i <= 9; i++) {
      deck.push({ value: i, color: Color.RED });
      deck.push({ value: i, color: Color.BLUE });
      deck.push({ value: i, color: Color.GREEN });
      deck.push({ value: i, color: Color.YELLOW });
    }
    return { deck, players: [user.name], hands: new Map(), turn: user.name };
  }
  joinGame(state: InternalState, user: UserData, request: IJoinGameRequest): Result {
    state.players.push(user.name);
    return Result.success();
  }
  startGame(state: InternalState, user: UserData, request: IStartGameRequest): Result {
    state.deck = shuffle(state.deck);
    state.players.forEach((playerName) => {
      state.hands.set(playerName, []);
      for (let i = 0; i < 7; i++) {
        state.hands.get(playerName)!.push(state.deck.pop()!);
      }
    });
    state.pile = state.deck.pop();
    return Result.success();
  }
  playCard(state: InternalState, user: UserData, request: IPlayCardRequest): Result {
    if (state.turn != user.name) {
      return Result.error("Not your turn");
    }
    if (request.card.color != state.pile!.color && request.card.value != state.pile!.value) {
      return Result.error("Doesn't match top of pile");
    }
    const hand = state.hands.get(user.name)!;
    const cardIdx = hand.findIndex((card) => card.value == request.card.value && card.color == request.card.color);
    if (cardIdx < 0) {
      return Result.error("Card not in hand");
    }
    // remove from hand
    hand.splice(cardIdx, 1);
    // update pile
    state.pile = request.card;
    // check if won
    if (hand.length == 0) {
      state.winner = user.name;
      return Result.success();
    }
    // upate turn
    const currIdx = state.players.indexOf(state.turn);
    const nextIdx = (currIdx + 1) % state.players.length;
    state.turn = state.players[nextIdx];
    return Result.success();
  }
  drawCard(state: InternalState, user: UserData, request: IDrawCardRequest): Result {
    const hand = state.hands.get(user.name)!;
    hand.push(state.deck.pop()!);
    return Result.success();
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    return {
      hand: state.hands.get(user.name)!,
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
