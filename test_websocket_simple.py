import asyncio
import websockets
import sys

async def test_websocket():
    try:
        # Try to connect to the WebSocket endpoint
        async with websockets.connect('ws://localhost:8000/ws/socket.io/') as websocket:
            print("WebSocket connection successful")
            return True
    except Exception as e:
        print(f"WebSocket connection failed: {e}")
        return False

async def test_http():
    import aiohttp
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:8000/') as response:
                print(f"HTTP GET status: {response.status}")
                return response.status == 200
    except Exception as e:
        print(f"HTTP GET failed: {e}")
        return False

async def main():
    print("Testing backend connection...")
    
    # Test HTTP first
    http_ok = await test_http()
    
    # Test WebSocket
    ws_ok = await test_websocket()
    
    if http_ok and ws_ok:
        print("All tests passed!")
        sys.exit(0)
    else:
        print("Some tests failed")
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())