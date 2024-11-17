import React, { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

const PoolTableTracker = () => {
  const fileName = "KingsTableSessions.xlsx";
  const [tables, setTables] = useState(
    Array.from({ length: 5 }, (_, i) => ({
      tableNumber: i + 1,
      playerName: "",
      hourlyRate: 200, // Default hourly rate
      startTime: null,
      elapsedTime: 0,
      totalFees: 0,
      timerActive: false,
    }))
  );
  const timersRef = useRef([]); // Keep track of active timers

  // Memoized function to start timers
  const startTimers = useCallback(() => {
    // Clear existing timers
    timersRef.current.forEach((timer) => clearInterval(timer));
    timersRef.current = [];

    // Start new timers for active tables
    tables.forEach((table, index) => {
      if (table.timerActive) {
        const timer = setInterval(() => {
          setTables((prevTables) =>
            prevTables.map((t, idx) =>
              idx === index
                ? { ...t, elapsedTime: t.elapsedTime + 1 }
                : t
            )
          );
        }, 1000);
        timersRef.current.push(timer);
      }
    });
  }, [tables]);

  // Load or initialize the file
  useEffect(() => {
    const loadOrInitializeFile = () => {
      try {
        const workbook = XLSX.readFile(fileName);
        const currentDate = new Date().toLocaleDateString("en-CA");

        if (workbook.SheetNames.includes(currentDate)) {
          const worksheet = workbook.Sheets[currentDate];
          const data = XLSX.utils.sheet_to_json(worksheet);
          const loadedTables = data.map((row) => ({
            tableNumber: parseInt(row.Table.replace("Table ", "")),
            playerName: row.Player || "",
            hourlyRate: row["Hourly Rate"] || 200,
            startTime: row["Start Time"]
              ? new Date(row["Start Time"])
              : null,
            elapsedTime: row["Elapsed Time"] || 0,
            totalFees: parseFloat(row["Total Fees"]) || 0,
            timerActive: false, // Always inactive on load
          }));
          setTables(loadedTables);
        } else {
          initializeFile(workbook, currentDate);
        }
      } catch (error) {
        const workbook = XLSX.utils.book_new();
        initializeFile(workbook);
      }
    };

    const initializeFile = (
      workbook,
      tabName = new Date().toLocaleDateString("en-CA")
    ) => {
      const initialData = tables.map((table) => ({
        Date: new Date().toLocaleDateString("en-CA"),
        Table: `Table ${table.tableNumber}`,
        Player: table.playerName,
        "Hourly Rate": table.hourlyRate,
        "Start Time": null,
        "Elapsed Time": table.elapsedTime,
        "Total Fees": table.totalFees.toFixed(2),
      }));

      const worksheet = XLSX.utils.json_to_sheet(initialData);
      XLSX.utils.book_append_sheet(workbook, worksheet, tabName);
      XLSX.writeFile(workbook, fileName);
      console.log(`${fileName} has been initialized.`);
    };

    loadOrInitializeFile();
  }, [tables]); // Tables are included as they affect initialization.

  // Start/clean up timers when `tables` changes
  useEffect(() => {
    startTimers();

    return () => {
      // Cleanup timers
      timersRef.current.forEach((timer) => clearInterval(timer));
    };
  }, [tables, startTimers]); // Both `tables` and `startTimers` are dependencies.

  const saveSession = () => {
    const workbook = XLSX.readFile(fileName);
    const currentDate = new Date().toLocaleDateString("en-CA");
    const sessionData = tables.map((table) => ({
      Date: new Date().toLocaleDateString("en-CA"),
      Table: `Table ${table.tableNumber}`,
      Player: table.playerName,
      "Hourly Rate": table.hourlyRate,
      "Start Time": table.startTime
        ? table.startTime.toISOString()
        : null,
      "Elapsed Time": table.elapsedTime,
      "Total Fees": table.totalFees.toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(sessionData);
    workbook.Sheets[currentDate] = worksheet;
    workbook.SheetNames.includes(currentDate) ||
      workbook.SheetNames.push(currentDate);

    XLSX.writeFile(workbook, fileName);
    console.log("Session data saved to file.");
  };

  const handleStart = (index) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) =>
        idx === index
          ? { ...table, startTime: new Date(), timerActive: true }
          : table
      )
    );
  };

  const handlePause = (index) => {
    setTables((prevTables) =>
      prevTables.map((table, idx) =>
        idx === index ? { ...table, timerActive: false } : table
      )
    );
  };

  const handleStop = (index) => {
    const updatedTable = tables[index];
    const totalHours = updatedTable.elapsedTime / 3600;
    const totalFees = (totalHours * updatedTable.hourlyRate).toFixed(2);

    setTables((prevTables) =>
      prevTables.map((table, idx) =>
        idx === index
          ? { ...table, totalFees: parseFloat(totalFees), timerActive: false }
          : table
      )
    );

    saveSession();
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>K1NGS Table Tracker</h1>

      {/* Summary Table */}
      <table style={{ width: "100%", marginBottom: "20px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Table</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Player</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Elapsed Time</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Total Fees</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table) => (
            <tr key={table.tableNumber}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                Table {table.tableNumber}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {table.playerName || "-"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {formatTime(table.elapsedTime)}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                ₱{table.totalFees.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Individual Table Controls */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {tables.map((table, index) => (
          <div
            key={table.tableNumber}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
              width: "200px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <h3>Table {table.tableNumber}</h3>
            <div style={{ marginBottom: "10px" }}>
              <label>
                Player Name:{" "}
                <input
                  type="text"
                  value={table.playerName}
                  onChange={(e) =>
                    setTables((prevTables) =>
                      prevTables.map((t, idx) =>
                        idx === index ? { ...t, playerName: e.target.value } : t
                      )
                    )
                  }
                />
              </label>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>
                Hourly Rate:{" "}
                <input
                  type="number"
                  value={table.hourlyRate}
                  onChange={(e) =>
                    setTables((prevTables) =>
                      prevTables.map((t, idx) =>
                        idx === index
                          ? { ...t, hourlyRate: parseFloat(e.target.value) }
                          : t
                      )
                    )
                  }
                />
              </label>
            </div>
            <div>
              <h4>Elapsed Time: {formatTime(table.elapsedTime)}</h4>
              <h4>Total Fees: ₱{table.totalFees.toFixed(2)}</h4>
            </div>
            <div>
              <button
                onClick={() => handleStart(index)}
                disabled={table.timerActive}
              >
                Start
              </button>
              <button
                onClick={() => handlePause(index)}
                disabled={!table.timerActive}
              >
                Pause
              </button>
              <button
                onClick={() => handleStop(index)}
                disabled={!table.startTime}
              >
                Stop & Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoolTableTracker;
