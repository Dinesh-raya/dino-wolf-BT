import asyncio
import socketio
import sys
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

async def debug_socket():
    sio = socketio.AsyncClient(logger=True, engineio_logger=True)
    
    @sio.event
    async def connect():
        print("=== CONNECTED TO SERVER ===")
        
    @sio.event
    async def connect_error(data):
        print(f"=== CONNECT ERROR: {data} ===")
        
    @sio.event
    async def disconnect():
        print("=== DISCONNECTED FROM SERVER ===")
        
    @sio.event
    async def message(data):
        print(f"=== MESSAGE: {data} ===")
    
    try:
        print("Attempting to connect to http://localhost:8000...")
        # Try with minimal auth
        await sio.connect('http://localhost:8000', auth={'name': 'DebugPlayer'})
        print("Connection successful!")
        
        # Wait a bit to see if we stay connected
        await asyncio.sleep(3)
        
        await sio.disconnect()
        print("Debug completed")
    except Exception as e:
        print(f"=== EXCEPTION: {type(e).__name__}: {e} ===")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(debug_socket())