import asyncio
import socketio
import sys

async def test_improved_socket():
    """Test socket connection with improved configuration"""
    sio = socketio.AsyncClient(
        reconnection=True,
        reconnection_attempts=5,
        reconnection_delay=1000,
        reconnection_delay_max=10000,
        randomization_factor=0.5
    )
    
    connected = False
    
    @sio.event
    async def connect():
        nonlocal connected
        connected = True
        print("✅ Successfully connected to server!")
        print(f"  Socket ID: {sio.sid}")
        
    @sio.event
    async def connect_error(data):
        print(f"❌ Connection error: {data}")
        
    @sio.event
    async def disconnect():
        print("⚠️  Disconnected from server")
    
    try:
        print("Testing improved socket connection...")
        print(f"Connecting to: http://localhost:8000")
        
        await sio.connect('http://localhost:8000', transports=['websocket', 'polling'])
        
        # Wait a bit to see if connection succeeds
        await asyncio.sleep(2)
        
        if connected:
            print("\n✅ TEST PASSED: Socket connection successful with improved configuration!")
            
            # Test creating a room
            print("\nTesting room creation...")
            response = await sio.call('room:create', {'name': 'TestPlayer', 'color': 'blue'})
            print(f"Room creation response: {response}")
            
            if response and response.get('status') == 'success':
                room_code = response.get('room_code')
                print(f"✅ Room created successfully: {room_code}")
                
                # Test joining the room
                print(f"\nTesting room join for room: {room_code}")
                join_response = await sio.call('room:join', {
                    'room_code': room_code,
                    'name': 'TestPlayer2',
                    'color': 'red'
                })
                print(f"Room join response: {join_response}")
                
                if join_response and join_response.get('status') == 'success':
                    print("✅ Room join successful!")
                else:
                    print("❌ Room join failed")
            else:
                print("❌ Room creation failed")
                
        else:
            print("\n❌ TEST FAILED: Could not establish connection")
            
        await sio.disconnect()
        
    except Exception as e:
        print(f"\n❌ Exception during test: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        if sio.connected:
            await sio.disconnect()

if __name__ == '__main__':
    asyncio.run(test_improved_socket())