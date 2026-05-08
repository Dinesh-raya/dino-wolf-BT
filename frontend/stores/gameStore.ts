import { create } from 'zustand';
import { socket } from '../services/socket';

interface Player {
  id: string;
  name: string;
  position: int;
  money: number;
  is_in_jail: boolean;
  is_bankrupt: boolean;
  properties_owned: number[];
  connected: boolean;
  color: string;
}

interface RoomState {
  room_id: string;
  host_id: string;
  players: Record<string, Player>;
  status: string;
}

interface GameState {
  room: RoomState;
  properties: Record<number, any>;
  turn_order: string[];
  current_turn_index: number;
  history_log: string[];
}

interface TurnState {
  active_player_id: string;
  phase: string;
  can_roll: boolean;
  can_end_turn: boolean;
  time_remaining: number;
}

interface GameStore {
  connected: boolean;
  myId: string | null;
  room: RoomState | null;
  game: GameState | null;
  turn: TurnState | null;
  error: string | null;
  
  connect: () => void;
  joinRoom: (code: string, name: string, color: string) => void;
  createRoom: (name: string, color: string) => void;
  startGame: () => void;
  rollDice: () => void;
  endTurn: () => void;
  buyProperty: (id: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  // Socket listeners setup once
  socket.on('connect', () => {
    set({ connected: true, myId: socket.id });
  });

  socket.on('disconnect', () => {
    set({ connected: false });
  });

  socket.on('room:state_update', (room: RoomState) => {
    set({ room });
  });

  socket.on('game:start', (data: { game: GameState, turn: TurnState }) => {
    set({ game: data.game, turn: data.turn, room: data.game.room });
  });

  socket.on('game:state_update', (data: { game: GameState, turn: TurnState }) => {
    set({ game: data.game, turn: data.turn, room: data.game.room });
  });

  return {
    connected: false,
    myId: null,
    room: null,
    game: null,
    turn: null,
    error: null,

    connect: () => {
      if (!socket.connected) socket.connect();
    },

    joinRoom: (code, name, color) => {
      socket.emit('room:join', { room_code: code, name, color }, (response: any) => {
        if (response.status === 'error') {
          set({ error: response.message });
        } else {
          set({ room: response.room, error: null });
        }
      });
    },

    createRoom: (name, color) => {
      socket.emit('room:create', { name, color }, (response: any) => {
        if (response.status === 'error') {
          set({ error: response.message });
        } else {
          set({ room: response.room, error: null });
        }
      });
    },

    startGame: () => {
      socket.emit('game:start', {}, (response: any) => {
        if (response.status === 'error') set({ error: response.message });
      });
    },

    rollDice: () => {
      socket.emit('game:dice_roll', {}, (response: any) => {
         if (response.status === 'error') set({ error: response.message });
      });
    },

    endTurn: () => {
      socket.emit('game:end_turn', {}, (response: any) => {
        if (response.status === 'error') set({ error: response.message });
      });
    },

    buyProperty: (id) => {
      socket.emit('property:buy', { property_id: id }, (response: any) => {
        if (response.status === 'error') set({ error: response.message });
      });
    }
  };
});
