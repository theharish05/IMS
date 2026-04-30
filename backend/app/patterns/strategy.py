from abc import ABC, abstractmethod

class AlertStrategy(ABC):
    @abstractmethod
    def trigger_alert(self, component_id: str, payload: dict):
        pass

class P0AlertStrategy(AlertStrategy):
    def trigger_alert(self, component_id: str, payload: dict):
        print(f"[ALERT P0] CRITICAL FAILURE on {component_id}! Paging SRE immediately.")

class P1AlertStrategy(AlertStrategy):
    def trigger_alert(self, component_id: str, payload: dict):
        print(f"[ALERT P1] HIGH SEVERITY on {component_id}. Notifying on-call engineers.")

class P2AlertStrategy(AlertStrategy):
    def trigger_alert(self, component_id: str, payload: dict):
        print(f"[ALERT P2] Warning on {component_id}. Creating ticket.")

class AlertContext:
    def __init__(self, strategy: AlertStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: AlertStrategy):
        self._strategy = strategy

    def execute_alert(self, component_id: str, payload: dict):
        self._strategy.trigger_alert(component_id, payload)

def get_alert_strategy(severity: str) -> AlertStrategy:
    if severity == "P0":
        return P0AlertStrategy()
    elif severity == "P1":
        return P1AlertStrategy()
    else:
        return P2AlertStrategy()
