import React from "react";
import "./CommandsBar.css";

const CommandsBar = ({
  commands,
  onCommandClick,
  disabled,
  isCycleAvailable,
}) => {
  const handleCommandClick = (command) => {
    if (!disabled) {
      onCommandClick(command);
    }
  };

  return (
    <div className="commands-bar">
      <h3>Доступные команды</h3>
      <div className="commands-list">
        {commands.map((command) => (
          <div
            key={command.id}
            className={`command ${disabled ? "disabled" : ""}`}
            onClick={() => handleCommandClick(command)}
          >
            {command.name}
          </div>
        ))}
        {isCycleAvailable && (
          <div
            className={`command cycle-command ${disabled ? "disabled" : ""}`}
            onClick={() => handleCommandClick("cycle")}
          >
            Добавить цикл
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandsBar;
