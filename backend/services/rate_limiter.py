import time
from collections import deque
from typing import Deque, Dict


class SocketRateLimiter:
    def __init__(self, max_calls: int = 25, per_seconds: int = 5) -> None:
        self.max_calls = max_calls
        self.per_seconds = per_seconds
        self._events: Dict[str, Deque[float]] = {}

    def allow(self, key: str) -> bool:
        now = time.time()
        queue = self._events.setdefault(key, deque())
        while queue and now - queue[0] > self.per_seconds:
            queue.popleft()
        if len(queue) >= self.max_calls:
            return False
        queue.append(now)
        return True


rate_limiter = SocketRateLimiter()
