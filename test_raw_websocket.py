import asyncio
import websockets
import json

async def test_websocket():
    """Test raw WebSocket connection to Socket.IO"""
    uri = "ws://localhost:8000/socket.io/?EIO=4&transport=websocket"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket")
            
            # Send ping
            await websocket.send("2probe")
            response = await websocket.recv()
            print(f"Response to probe: {response}")
            
            # Send connect
            await websocket.send('40')
            response = await websocket.recv()
            print(f"Connect response: {response}")
            
    except Exception as e:
        print(f"Error: {e}")

async def test_polling():
    """Test HTTP polling transport"""
    import aiohttp
    
    url = 'http://localhost:8000/socket.io/?EIO=4&transport=polling'
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            print(f"\nPolling test - Status: {resp.status}")
            print(f"Headers: {dict(resp.headers)}")
            content = await resp.text()
            print(f"Response (first 200 chars): {content[:200]}")
            
            # Socket.IO handshake should start with '0'
            if content and content[0] == '0':
                print("SUCCESS: Got Socket.IO handshake")
                try:
                    data = json.loads(content[1:])
                    print(f"Handshake data: {data}")
                except:
                    print(f"Raw handshake: {content}")
            else:
                print(f"FAIL: Not a Socket.IO handshake")

async def main():
    print("Testing Socket.IO server...")
    await test_polling()
    print("\n" + "="*50)
    await test_websocket()

if __name__ == "__main__":
    asyncio.run(main())