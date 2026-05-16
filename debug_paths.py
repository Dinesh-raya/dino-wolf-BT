import os

# Simulate the path construction from main.py
backend_dir = os.path.dirname(__file__)
frontend_dist = os.path.join(os.path.dirname(__file__), '../frontend/dist')

print(f"backend_dir: {backend_dir}")
print(f"frontend_dist: {frontend_dist}")
print(f"frontend_dist exists: {os.path.exists(frontend_dist)}")

# Check what's in the parent directory
parent = os.path.dirname(backend_dir)
print(f"\nParent directory: {parent}")
print(f"Contents of parent:")
for item in os.listdir(parent):
    print(f"  {item}")