import asyncio
import socketio
import json
import logging

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)

async def test_frontend_behavior():
    """Test socket connection mimicking frontend behavior"""
    sio = socketio.AsyncClient(
        logger=True, 
        engineio_logger=True,
        reconnection=False
    )
    
    @sio.event
    async def connect():
        print("=== FRONTEND-STYLE CONNECT SUCCESS ===")
        
    @sio.event
    async def connect_error(data):
        print(f"=== FRONTEND-STYLE CONNECT ERROR: {data} ===")
        
    @sio.event
    async def disconnect():
        print("=== FRONTEND-STYLE DISCONNECT ===")
    
    try:
        print("=== Testing frontend-style connection ===")
        print("1. Setting auth like frontend does...")
        # Frontend sets: socket.auth = { name: playerName, sessionToken: '' }
        auth_data = {
            'name': 'FrontendPlayer',
            'sessionToken': ''  # Empty string like frontend
        }
        
        print(f"2. Connecting with auth: {auth_data}")
        await sio.connect('http://localhost:8000', auth=auth_data)
        
        print("3. Connection established, testing room creation...")
        # Frontend emits: socket.emit('room:create', { name, color }, callback)
        def create_callback(response):
            print(f"=== ROOM CREATE CALLBACK: {response} ===")
        
        await sio.emit('room:create', {
            'name': 'FrontendPlayer',
            'color': 'cyan'
        }, callback=create_callback)
        
        # Wait for response
        await asyncio.sleep(2)
        
        print("4. Disconnecting...")
        await sio.disconnect()
        print("=== Test completed ===")
        
    except Exception as e:
        print(f"=== EXCEPTION: {type(e).__name__}: {e} ===")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_frontend_behavior())