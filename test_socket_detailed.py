import asyncio
import socketio
import aiohttp
import sys

async def test_socketio_handshake():
    """Test if Socket.IO handshake works"""
    try:
        async with aiohttp.ClientSession() as session:
            # Try polling transport handshake
            url = 'http://localhost:8000/socket.io/?EIO=4&transport=polling'
            async with session.get(url) as response:
                print(f"Socket.IO handshake status: {response.status}")
                print(f"Content-Type: {response.headers.get('Content-Type')}")
                text = await response.text()
                print(f"First 100 chars: {text[:100]}")
                
                # Socket.IO handshake should return something like "0{"sid":"...",...}"
                if response.status == 200 and text.startswith('0'):
                    print("✓ Socket.IO handshake successful")
                    return True
                else:
                    print("✗ Socket.IO handshake failed")
                    return False
    except Exception as e:
        print(f"Handshake test error: {e}")
        return False

async def test_websocket_direct():
    """Test direct WebSocket connection"""
    try:
        import websockets
        async with websockets.connect('ws://localhost:8000/ws/socket.io/?EIO=4&transport=websocket') as ws:
            print("✓ Direct WebSocket connection successful")
            return True
    except Exception as e:
        print(f"Direct WebSocket error: {e}")
        return False

async def test_socketio_client():
    """Test Socket.IO client connection"""
    sio = socketio.AsyncClient(logger=True, engineio_logger=True)
    
    connected = False
    
    @sio.event
    async def connect():
        nonlocal connected
        connected = True
        print("✓ Socket.IO client connected")
        
    @sio.event
    async def connect_error(data):
        print(f"Socket.IO connect error: {data}")
        
    try:
        print("Attempting Socket.IO client connection...")
        await sio.connect('http://localhost:8000', transports=['websocket', 'polling'], wait_timeout=10)
        
        # Wait a bit to see if connection succeeds
        await asyncio.sleep(2)
        
        if connected:
            await sio.disconnect()
            print("✓ Socket.IO client test passed")
            return True
        else:
            print("✗ Socket.IO client never connected")
            return False
    except Exception as e:
        print(f"Socket.IO client error: {e}")
        return False
    finally:
        if sio.connected:
            await sio.disconnect()

async def main():
    print("=== Testing Socket.IO Server ===")
    
    print("\n1. Testing Socket.IO handshake...")
    handshake_ok = await test_socketio_handshake()
    
    print("\n2. Testing direct WebSocket...")
    ws_ok = await test_websocket_direct()
    
    print("\n3. Testing Socket.IO client...")
    client_ok = await test_socketio_client()
    
    print("\n=== Summary ===")
    print(f"Handshake: {'PASS' if handshake_ok else 'FAIL'}")
    print(f"Direct WebSocket: {'PASS' if ws_ok else 'FAIL'}")
    print(f"Socket.IO Client: {'PASS' if client_ok else 'FAIL'}")
    
    if handshake_ok and client_ok:
        print("\n✓ Socket.IO server appears to be working correctly")
        sys.exit(0)
    else:
        print("\n✗ Socket.IO server has issues")
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())