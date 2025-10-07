import yaml
from pathlib import Path

def load_config():
    # Adjust path to be relative to the project root where the script runs
    config_path = Path("backend/config.yml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

config = load_config()