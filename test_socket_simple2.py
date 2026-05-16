import asyncio
import aiohttp
import sys

async def test():
    print("Testing Socket.IO server...")
    
    # Test 1: Check if /socket.io/ endpoint returns proper Socket.IO response
    async with aiohttp.ClientSession() as session:
        url = 'http://localhost:8000/socket.io/?EIO=4&transport=polling'
        try:
            async with session.get(url) as response:
                print(f"Status: {response.status}")
                print(f"Content-Type: {response.headers.get('Content-Type')}")
                text = await response.text()
                print(f"Response (first 200 chars): {text[:200]}")
                
                # Check if it's Socket.IO response (should start with '0')
                if text.startswith('0'):
                    print("SUCCESS: Socket.IO handshake works!")
                    return True
                elif '<!doctype html>' in text.lower():
                    print("ERROR: Got HTML instead of Socket.IO response")
                    print("This means the Socket.IO middleware is not intercepting /socket.io/ requests")
                    return False
                else:
                    print(f"UNEXPECTED: {text[:100]}")
                    return False
        except Exception as e:
            print(f"ERROR: {e}")
            return False

async def main():
    result = await test()
    sys.exit(0 if result else 1)

if __name__ == '__main__':
    asyncio.run(main())