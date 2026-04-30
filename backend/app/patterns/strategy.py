from abc import ABC, abstractmethod

class AlertStrategy(ABC):
    @abstractmethod
    def alert(self, component_id: str, payload: dict):
        pass

class P0Strategy(AlertStrategy):
    def alert(self, component_id: str, payload: dict):
        print(f"[P0 ALERT] CRITICAL FAILURE on {component_id}! Paging on-call immediately. Details: {payload}")

class P1Strategy(AlertStrategy):
    def alert(self, component_id: str, payload: dict):
        print(f"[P1 ALERT] High priority failure on {component_id}. Sending SMS. Details: {payload}")

class P2Strategy(AlertStrategy):
    def alert(self, component_id: str, payload: dict):
        print(f"[P2 ALERT] Warning on {component_id}. Logging to Slack. Details: {payload}")

class DefaultStrategy(AlertStrategy):
    def alert(self, component_id: str, payload: dict):
        print(f"[INFO] Issue on {component_id}. Logged for review. Details: {payload}")

class AlertContext:
    def __init__(self, strategy: AlertStrategy):
        self.strategy = strategy
        
    def execute_alert(self, component_id: str, payload: dict):
        self.strategy.alert(component_id, payload)

def get_alert_strategy(severity: str) -> AlertStrategy:
    severity = severity.upper()
    if severity == "P0":
        return P0Strategy()
    elif severity == "P1":
        return P1Strategy()
    elif severity == "P2":
        return P2Strategy()
    return DefaultStrategy()
