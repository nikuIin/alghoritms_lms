import React from "react";
import "./SolutionBar.css";

const SolutionBar = ({
  solution,
  onSolutionRemove,
  onAddToCycle,
  onCycleIterationsChange,
  commands,
  disabled,
}) => {
  const handleSolutionClick = (index) => {
    if (!disabled) {
      onSolutionRemove(index);
    }
  };

  const handleAddToCycle = (cycleIndex, commandId) => {
    if (!disabled) {
      const command = commands.find((cmd) => cmd.id === parseInt(commandId));
      if (command) {
        onAddToCycle(cycleIndex, command);
      }
    }
  };

  const handleIterationsChange = (cycleIndex, value) => {
    if (!disabled) {
      onCycleIterationsChange(cycleIndex, value);
    }
  };

  return (
    <div className="solution-bar">
      <h3>Решение</h3>
      <div className="solution-list">
        {solution.length === 0 && (
          <div className="empty-message">Решение пусто</div>
        )}
        {solution.map((item, index) => (
          <div
            key={index}
            className={`solution-item ${disabled ? "disabled" : ""}`}
          >
            {item.type === "cycle" ? (
              <div className="cycle-item">
                <div className="cycle-header">
                  <span>Цикл ({item.iterations} итераций)</span>
                  <button
                    className="remove-button"
                    onClick={() => handleSolutionClick(index)}
                    disabled={disabled}
                  >
                    Удалить цикл
                  </button>
                </div>
                <div className="cycle-controls">
                  <label>
                    Итерации:
                    <input
                      type="number"
                      min="1"
                      value={item.iterations}
                      onChange={(e) =>
                        handleIterationsChange(index, e.target.value)
                      }
                      disabled={disabled}
                    />
                  </label>
                  <label>
                    Добавить команду:
                    <select
                      onChange={(e) => handleAddToCycle(index, e.target.value)}
                      disabled={disabled}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Выберите команду
                      </option>
                      {commands.map((command) => (
                        <option key={command.id} value={command.id}>
                          {command.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="cycle-commands">
                  {item.commands.length === 0 && (
                    <div className="empty-message">Нет команд в цикле</div>
                  )}
                  {item.commands.map((command, cmdIndex) => (
                    <div key={cmdIndex} className="cycle-command">
                      {command.name}
                      <button
                        className="remove-button"
                        onClick={() => {
                          if (!disabled) {
                            const newSolution = [...solution];
                            newSolution[index].commands.splice(cmdIndex, 1);
                            onSolutionRemove(index, newSolution[index]);
                          }
                        }}
                        disabled={disabled}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="command-item">
                {item.name}
                <button
                  className="remove-button"
                  onClick={() => handleSolutionClick(index)}
                  disabled={disabled}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SolutionBar;
