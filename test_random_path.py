import aiohttp
import asyncio

async def test():
    # Test a random path that shouldn't exist
    test_paths = [
        "/nonexistent",
        "/api/test",
        "/test.html",
    ]
    
    async with aiohttp.ClientSession() as session:
        for path in test_paths:
            url = f'http://localhost:8000{path}'
            print(f"\nTesting: {url}")
            try:
                async with session.get(url) as resp:
                    print(f"  Status: {resp.status}")
                    print(f"  Content-Type: {resp.headers.get('Content-Type')}")
                    content = await resp.text()
                    if len(content) > 200:
                        content = content[:200] + "..."
                    print(f"  Preview: {content}")
            except Exception as e:
                print(f"  Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())