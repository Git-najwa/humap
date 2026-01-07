// Singleton pour stocker l'instance Socket.io
let io = null;

export function setIO(socketIO) {
  io = socketIO;
}

export function getIO() {
  return io;
}
