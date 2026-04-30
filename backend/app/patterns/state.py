class WorkItemStateContext:
    def __init__(self, work_item, rca=None):
        self.work_item = work_item
        self.rca = rca

    def transition_to(self, new_state: str):
        valid_states = ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]
        if new_state not in valid_states:
            raise ValueError(f"Invalid state: {new_state}")
            
        if new_state == "CLOSED":
            if not self.rca or not self.rca.root_cause_category or not self.rca.fix_applied or not self.rca.prevention_steps:
                raise ValueError("Mandatory RCA Constraint Failed: Cannot close work item without a complete RCA.")
                
        self.work_item.state = new_state
