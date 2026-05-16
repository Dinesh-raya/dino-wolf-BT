import asyncio
import socketio

async def test():
    sio = socketio.AsyncClient()
    
    @sio.event
    async def connect():
        print("Connected!")
        
    @sio.event
    async def disconnect():
        print("Disconnected!")
    
    try:
        print("Connecting to http://localhost:8000...")
        await sio.connect('http://localhost:8000')
        print("Connection successful")
        await sio.wait()
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        await sio.disconnect()

if __name__ == "__main__":
    asyncio.run(test())