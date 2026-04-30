from abc import ABC, abstractmethod

class WorkItemState(ABC):
    @abstractmethod
    def next_state(self, work_item_context, rca_exists: bool = False) -> str:
        pass

class OpenState(WorkItemState):
    def next_state(self, work_item_context, rca_exists: bool = False) -> str:
        return "INVESTIGATING"

class InvestigatingState(WorkItemState):
    def next_state(self, work_item_context, rca_exists: bool = False) -> str:
        return "RESOLVED"

class ResolvedState(WorkItemState):
    def next_state(self, work_item_context, rca_exists: bool = False) -> str:
        if not rca_exists:
            raise ValueError("Mandatory RCA is missing. Cannot move to CLOSED state.")
        return "CLOSED"

class ClosedState(WorkItemState):
    def next_state(self, work_item_context, rca_exists: bool = False) -> str:
        raise ValueError("Work Item is already CLOSED.")

class WorkItemStateMachine:
    def __init__(self, initial_state: str):
        self.state_str = initial_state
        self.state = self._get_state_obj(initial_state)

    def _get_state_obj(self, state_str: str) -> WorkItemState:
        states = {
            "OPEN": OpenState(),
            "INVESTIGATING": InvestigatingState(),
            "RESOLVED": ResolvedState(),
            "CLOSED": ClosedState()
        }
        return states.get(state_str, OpenState())

    def transition(self, rca_exists: bool = False):
        new_state_str = self.state.next_state(self, rca_exists)
        self.state_str = new_state_str
        self.state = self._get_state_obj(new_state_str)
        return self.state_str
