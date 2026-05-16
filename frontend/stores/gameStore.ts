import { create } from 'zustand';
import { socket } from '../services/socket';

interface Player {
  id: string;
  session_id?: string;
  reconnect_token?: string;
  name: string;
  position: number;
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

interface AuctionState {
  property_id: number;
  highest_bidder_id: string | null;
  current_bid: number;
  time_remaining: number;
  active: boolean;
  participants: string[];
}

interface GameStore {
  connected: boolean;
  myId: string | null;
  room: RoomState | null;
  game: GameState | null;
  turn: TurnState | null;
  auction: AuctionState | null;
  error: string | null;
  
  connect: () => void;
  joinRoom: (code: string, name: string, color: string) => void;
  createRoom: (name: string, color: string) => void;
  startGame: () => void;
  rollDice: () => void;
  endTurn: () => void;
  buyProperty: (id: number) => void;
  startAuction: (propertyId: number) => void;
  placeBid: (amount: number) => void;
  endAuction: () => void;
}

export const useGameStore = create<GameStore>((set) => {
  // Socket listeners setup once
  socket.on('connect', () => {
    set({ connected: true, myId: socket.id });
  });

  socket.on('disconnect', () => {
    set({ connected: false });
  });

  socket.on('connect_error', (error) => {
    set({ error: error.message || 'Connection failed' });
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

  socket.on('auction:start', (data: { auction: AuctionState }) => {
    set({ auction: data.auction, error: null });
  });

  socket.on('auction:state_update', (data: { auction: AuctionState }) => {
    set({ auction: data.auction, error: null });
  });

  socket.on('auction:end', () => {
    set({ auction: null });
  });

  return {
    connected: false,
    myId: null,
    room: null,
    game: null,
    turn: null,
    auction: null,
    error: null,

    connect: () => {
      const playerName = localStorage.getItem('dino_player_name') || 'Player';
      const sessionToken = localStorage.getItem('dino_session_token') || '';
      socket.auth = { name: playerName, sessionToken };
      if (!socket.connected) socket.connect();
    },

    joinRoom: (code, name, color) => {
      localStorage.setItem('dino_player_name', name || 'Player');
      const reconnectToken = localStorage.getItem('dino_reconnect_token') || undefined;
      socket.emit('room:join', { room_code: code, name, color, reconnect_token: reconnectToken }, (response: any) => {
        if (response.status === 'error') {
          set({ error: response.message });
        } else {
          if (response.reconnectToken) {
            localStorage.setItem('dino_reconnect_token', response.reconnectToken);
          }
          set({ room: response.room, error: null });
        }
      });
    },

    createRoom: (name, color) => {
      localStorage.setItem('dino_player_name', name || 'Player');
      socket.emit('room:create', { name, color }, (response: any) => {
        if (response.status === 'error') {
          set({ error: response.message });
        } else {
          if (response.reconnectToken) {
            localStorage.setItem('dino_reconnect_token', response.reconnectToken);
          }
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
    },

    startAuction: (propertyId) => {
      socket.emit('auction:start', { property_id: propertyId }, (response: any) => {
        if (response.status === 'error') set({ error: response.message });
      });
    },

    placeBid: (amount) => {
      socket.emit('auction:bid', { amount }, (response: any) => {
        if (response.status === 'error') set({ error: response.message });
      });
    },

    endAuction: () => {
      socket.emit('auction:end', {}, (response: any) => {
        if (response.status === 'error') set({ error: response.message });
      });
    }
  };
});
