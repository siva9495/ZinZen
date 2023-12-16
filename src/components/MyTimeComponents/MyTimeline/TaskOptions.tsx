import React from "react";
import { ITask } from "@src/Interfaces/Task";

type TaskAction = "Skip" | "Reschedule" | "Done" | "Focus";

interface TaskOptionsProps {
  task: ITask;
  handleActionClick: (action: TaskAction, task: ITask) => void;
}

const ActionButton: React.FC<{
  action: TaskAction;
  task: ITask;
  onActionClick: (action: TaskAction, task: ITask) => void;
}> = ({ action, task, onActionClick }) => (
  <button type="button" onClick={() => onActionClick(action, task)}>
    {action}
  </button>
);

export const TaskOptions: React.FC<TaskOptionsProps> = ({ task, handleActionClick }) => {
  return (
    <div className="MTL-options">
      <ActionButton action="Skip" task={task} onActionClick={handleActionClick} />
      <ActionButton action="Reschedule" task={task} onActionClick={handleActionClick} />
      <ActionButton action="Done" task={task} onActionClick={handleActionClick} />
      <ActionButton action="Focus" task={task} onActionClick={handleActionClick} />
    </div>
  );
};
