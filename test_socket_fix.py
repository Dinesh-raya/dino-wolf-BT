import aiohttp
import asyncio
import json

async def test_socket_io():
    """Test Socket.IO handshake directly"""
    url = 'http://localhost:8000/socket.io/?EIO=4&transport=polling'
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            print(f"Status: {resp.status}")
            print(f"Headers: {dict(resp.headers)}")
            content = await resp.text()
            print(f"Response length: {len(content)}")
            print(f"First 500 chars: {content[:500]}")
            
            # Check if it's Socket.IO response (should start with 0 or similar)
            if content and (content[0] == '0' or 'socket.io' in content.lower()):
                print("SUCCESS: Got Socket.IO response")
                try:
                    # Parse Socket.IO handshake
                    if content[0] == '0':
                        data = json.loads(content[1:])
                        print(f"Socket.IO handshake data: {data}")
                except:
                    pass
            else:
                print("ERROR: Not a Socket.IO response")

async def test_health():
    """Test health endpoint"""
    url = 'http://localhost:8000/health'
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            print(f"\nHealth check - Status: {resp.status}")
            content = await resp.text()
            print(f"Health response: {content}")

async def main():
    print("Testing backend server...")
    await test_health()
    print("\n" + "="*50)
    await test_socket_io()

if __name__ == "__main__":
    asyncio.run(main())