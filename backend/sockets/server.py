import socketio

# Initialize the Socket.IO server with CORS enabled
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*' # For development; restrict in production
)
