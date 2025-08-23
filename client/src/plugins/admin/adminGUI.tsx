import React, { useState } from "react";

export default function AdminUI() {
  const [pluginStats, setPluginStats] = React.useState<Record<string, any>>({});
  const [pluginLogs, setPluginLogs] = React.useState<Record<string, any>>({});
  const [selectedPlugin, setSelectedPlugin] = React.useState<string | null>(null);
  const [selectedCommand, setSelectedCommand] = React.useState("");
  const [commandInput, setCommandInput] = React.useState("");
  const [commandOutput, setCommandOutput] = React.useState("");
  const [inputError, setInputError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const stats = await fetchAdminStats();
        setPluginStats(stats);
        const logs = await fetchPluginLogs();
        setPluginLogs(logs);
      } catch (e) {
        console.error("Error fetching admin data:", e);
      }
    }
    fetchData();
  }, []);

  async function runCommand() {
    if (!selectedPlugin || !selectedCommand) {
      setCommandOutput("Please select a plugin and enter a command.");
      return;
    }

    let parsedData = {};
    setInputError(null);

    if (commandInput.trim()) {
      try {
        parsedData = JSON.parse(commandInput);
      } catch {
        setInputError("Invalid JSON in data input.");
        return;
      }
    }

    try {
      const result = await runPluginCommand(selectedPlugin, selectedCommand, parsedData);
      setCommandOutput(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setCommandOutput(`Error: ${error.message || error.toString()}`);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin UI</h2>

      <section>
        <h3>Plugin Stats</h3>
        <pre>{JSON.stringify(pluginStats, null, 2)}</pre>
      </section>

      <section>
        <h3>Plugin Logs</h3>
        <pre>{JSON.stringify(pluginLogs, null, 2)}</pre>
      </section>

      <section>
        <h3>Run Plugin Command</h3>
        <select onChange={e => setSelectedPlugin(e.target.value)} value={selectedPlugin ?? ""}>
          <option value="">Select Plugin</option>
          {Object.keys(pluginStats).map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Command"
          onChange={e => setSelectedCommand(e.target.value)}
          value={selectedCommand}
          style={{ marginLeft: 10 }}
        />

        <textarea
          placeholder="JSON data"
          onChange={e => setCommandInput(e.target.value)}
          value={commandInput}
          rows={4}
          cols={50}
          style={{ display: "block", marginTop: 10 }}
        />

        {inputError && <div style={{ color: "red" }}>{inputError}</div>}

        <button onClick={runCommand} style={{ marginTop: 10 }}>
          Run Command
        </button>
      </section>

      <section>
        <h3>Output</h3>
        <pre>{commandOutput}</pre>
      </section>
    </div>
  );
}

export function AdminUIToggler() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <button
        style={{ position: "fixed", bottom: 10, right: 10, zIndex: 1000 }}
        onClick={() => setVisible(v => !v)}
      >
        Toggle Admin UI
      </button>
      {visible && (
        <div
          style={{
            position: "fixed",
            bottom: 50,
            right: 10,
            width: 400,
            height: 600,
            backgroundColor: "white",
            border: "1px solid black",
            overflow: "auto",
            zIndex: 1000,
          }}
        >
          <AdminUI />
        </div>
      )}
    </>
  );
}

// Dummy implementations / imports for your api client functions to avoid errors
async function fetchAdminStats() {
  // implement or import actual version
  return {};
}
async function fetchPluginLogs() {
  // implement or import actual version
  return {};
}
async function runPluginCommand(plugin: string, command: string, data: any) {
  // implement or import actual version
  return {};
}
