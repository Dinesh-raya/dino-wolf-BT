import asyncio
import socketio
import sys

async def test_socket():
    sio = socketio.AsyncClient(logger=True, engineio_logger=True)
    
    @sio.event
    async def connect():
        print("Connected to server")
        
    @sio.event
    async def disconnect():
        print("Disconnected from server")
        
    @sio.event
    async def connect_error(data):
        print(f"Connection error: {data}")
        
    @sio.event
    async def room_state_update(data):
        print(f"Room state update: {data}")
        
    @sio.event
    async def game_state_update(data):
        print(f"Game state update: {data}")
        
    try:
        print("Attempting to connect to ws://localhost:8000...")
        await sio.connect('http://localhost:8000', transports=['websocket', 'polling'])
        print("Connection successful")
        
        # Wait a bit to see if we get any events
        await asyncio.sleep(2)
        
        await sio.disconnect()
        print("Test completed successfully")
        return True
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = asyncio.run(test_socket())
    sys.exit(0 if success else 1)