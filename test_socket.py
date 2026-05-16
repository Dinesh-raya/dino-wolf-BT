import asyncio
import socketio
import sys

async def test_socket():
    sio = socketio.AsyncClient()
    
    @sio.event
    async def connect():
        print("Connected to server")
        
    @sio.event
    async def disconnect():
        print("Disconnected from server")
        
    @sio.event
    async def room_state_update(data):
        print(f"Room state update: {data}")
        
    @sio.event
    async def game_state_update(data):
        print(f"Game state update: {data}")
        
    try:
        await sio.connect('http://localhost:8000', auth={'name': 'TestPlayer'})
        print("Connection successful")
        
        # Create a room
        print("Creating room...")
        await sio.emit('room:create', {'name': 'TestPlayer', 'color': 'cyan', 'is_private': False})
        
        # Wait for response
        await asyncio.sleep(2)
        
        await sio.disconnect()
        print("Test completed")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(test_socket())