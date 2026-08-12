import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

// Next.js re-renders components a lot; if every component that wants live
// updates opened its own connection, the backend would see a new socket
// per mount. Keeping one module-level instance means the whole app shares
// a single connection, opened lazily the first time anything needs it.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { autoConnect: true });
  }
  return socket;
}
