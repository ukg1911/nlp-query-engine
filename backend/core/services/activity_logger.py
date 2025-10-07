from collections import deque
from datetime import datetime, timezone

class ActivityLogger:
    """
    A simple in-memory logger to track recent system activities.
    Uses a deque for efficient fixed-size logging.
    """
    def __init__(self, max_size: int = 10):
        """Initializes a deque with a maximum size to store activities."""
        self.activities = deque(maxlen=max_size)

    def log(self, type: str, description: str, status: str = "success"):
        """
        Adds a new activity to the log. Each activity is a dictionary
        containing event details and a timestamp.
        """
        activity = {
            "id": str(datetime.now(timezone.utc).timestamp()), # Unique ID based on timestamp
            "type": type,
            "description": description,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": status,
        }
        self.activities.appendleft(activity) # Add to the front of the deque

    def get_activities(self) -> list:
        """Returns a list of all current activities."""
        return list(self.activities)

# Create a single, shared instance (singleton) of the logger
# that will be imported and used by other parts of the application.
activity_logger = ActivityLogger()
