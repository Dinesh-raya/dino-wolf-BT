import asyncio
import socketio
import logging

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)

async def test_proxy_connection():
    """Test socket connection through proxy (port 3000) like frontend does"""
    sio = socketio.AsyncClient(
        logger=True, 
        engineio_logger=True,
        reconnection=False
    )
    
    @sio.event
    async def connect():
        print("=== PROXY CONNECT SUCCESS ===")
        
    @sio.event
    async def connect_error(data):
        print(f"=== PROXY CONNECT ERROR: {data} ===")
        
    @sio.event
    async def disconnect():
        print("=== PROXY DISCONNECT ===")
    
    try:
        print("=== Testing connection through proxy (port 3000) ===")
        print("Connecting to http://localhost:3000 (frontend dev server)...")
        
        auth_data = {
            'name': 'ProxyPlayer',
            'sessionToken': ''
        }
        
        await sio.connect('http://localhost:3000', auth=auth_data)
        
        print("Connection established through proxy!")
        
        # Try to create a room
        def create_callback(response):
            print(f"=== ROOM CREATE THROUGH PROXY: {response} ===")
        
        await sio.emit('room:create', {
            'name': 'ProxyPlayer',
            'color': 'cyan'
        }, callback=create_callback)
        
        # Wait for response
        await asyncio.sleep(2)
        
        await sio.disconnect()
        print("=== Proxy test completed ===")
        
    except Exception as e:
        print(f"=== EXCEPTION: {type(e).__name__}: {e} ===")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_proxy_connection())