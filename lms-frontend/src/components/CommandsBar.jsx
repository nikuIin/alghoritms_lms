// src/components/CommandsBar.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CommandsBar.css";
import { useParams } from "react-router-dom"; // Import useParams

const CommandsBar = ({ onCommandClick }) => {
  // Change onCommandDrop to onCommandClick
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { assignmentId } = useParams(); // Get assignmentId

  useEffect(() => {
    const fetchCommands = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/actions/${assignmentId}/`,
        );
        const actions = response.data[0].actions;

        // Transform the actions into a more usable format
        const formattedCommands = actions.map((action) => {
          const name = action[3]; // name
          const yChanges = action[7]; // y_changes
          return {
            id: action[1], // action_id
            name: name,
            x_changes: action[5], // x_changes
            y_changes:
              name === "Step up" || name === "Step down" ? -yChanges : yChanges, //Conditional
          };
        });
        setCommands(formattedCommands);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCommands();
  }, [assignmentId]);

  const handleCommandClick = (command) => {
    onCommandClick(command); // Call the onCommandClick prop with the command
  };

  if (loading) {
    return <div>Loading commands...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="commands-bar">
      <h3>Commands</h3>
      {commands.map((command) => (
        <div
          key={command.id}
          className="command"
          onClick={() => handleCommandClick(command)} // Add onClick handler
        >
          {command.name}
        </div>
      ))}
    </div>
  );
};

export default CommandsBar;
