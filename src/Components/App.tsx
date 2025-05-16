// src/components/MyComponent.tsx

import { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/Store"; // Adjust the path if needed
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import "./App.css"; // Import the CSS file
import * as XLSX from "xlsx"; // Import the xlsx library

interface LuxResponse {
    luxSensor: number;
}

const MyComponent = observer(() => {
    const store = useStore();

    const [testStarted, setTestStarted] = useState(false);
    const intervalIdRef = useRef<number | null>(null);
    const timeoutIdRef = useRef<number | null>(null);
    const [ipAddress, setIpAddress] = useState<string>("192.168.2.123");

    const [testDuration, setTestDuration] = useState<number>(1); // in minutes
    const [pollingInterval, setPollingInterval] = useState<number>(1); // in seconds

    // ref to ensure only one initial fetch, even in StrictMode
    const didInitialFetch = useRef(false);

    const getReading = async () => {
        try {
            const url = `http://${ipAddress}/lux`;
            console.log(`Fetching from ${url}`);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { luxSensor }: LuxResponse = await res.json();
            const id = Date.now().toString();
            const options: Intl.DateTimeFormatOptions = {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            };

            store.addReading(id, {
                timestamp: new Date()
                    .toLocaleTimeString("en-US", options)
                    .replace(/ AM| PM$/, ""),
                luxValue: luxSensor,
            });
        } catch (error) {
            console.error("Error fetching reading:", error);
        }
    };

    // Function to generate and trigger the Excel download
    const exportToExcel = () => {
        const data = Array.from(store.readings.values()).map((reading) => ({
            Timestamp: reading.timestamp,
            "Lux Value": reading.luxValue,
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lux Readings");

        // Generate a file name
        const filename = `lux_readings_${new Date().toISOString()}.xlsx`;

        // Trigger the download
        XLSX.writeFile(workbook, filename);
    };

    // One-time initial fetch (runs only once)
    useEffect(() => {
        if (!didInitialFetch.current) {
            didInitialFetch.current = true;
            // You could add an initial fetch here if desired,
            // but it's not strictly necessary if you fetch
            // immediately when the test starts.
        }
    }, []);

    // Start/stop polling when testStarted, pollingInterval, or testDuration changes
    useEffect(() => {
        if (testStarted) {
            // immediate fetch when test starts
            getReading();

            // set up interval for polling
            const iid = window.setInterval(getReading, pollingInterval * 1000);
            intervalIdRef.current = iid;

            // schedule stop after the duration
            const tid = window.setTimeout(() => {
                setTestStarted(false);
                exportToExcel(); // Export when the test finishes automatically
            }, testDuration * 60_000);
            timeoutIdRef.current = tid;
        } else {
            // cleanup when test stops
            if (intervalIdRef.current !== null) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
            if (timeoutIdRef.current !== null) {
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = null;
            }
        }

        // cleanup on unmount or before re-running the effect
        return () => {
            if (intervalIdRef.current !== null) {
                clearInterval(intervalIdRef.current);
            }
            if (timeoutIdRef.current !== null) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, [testStarted, pollingInterval, testDuration]);

    return (
        <div className="App">
            <h1>Lux Sensor Test</h1>
            <div className="input-group">
                <label>
                    IP Address:
                    <input
                        type="string" // Changed to string
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        style={{ marginLeft: 8, width: 120 }}
                    />
                </label>

                <p>Current IP Address: {ipAddress}</p>
            </div>
            <div className="input-group">
                <label>
                    Test duration (minutes):
                    <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={testDuration}
                        onChange={(e) => setTestDuration(Number(e.target.value))}
                        style={{ marginLeft: 8, width: 60 }}
                    />
                </label>
                <label>
                    Polling interval (seconds):
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={pollingInterval}
                        onChange={(e) => setPollingInterval(Number(e.target.value))}
                        style={{ marginLeft: 8, width: 60 }}
                    />
                </label>
            </div>

            <div className="button-group">
                <button
                    onClick={() => {
                        setTestStarted((s) => !s);
                        if (testStarted) {
                            exportToExcel(); // Export when the "Stop Test" button is pressed
                        }
                    }}
                >
                    {testStarted ? "Stop Test" : "Start Test"}
                </button>
                <button onClick={getReading}>Fetch Reading</button>
                <button onClick={store.clearReadings}>Clear Readings</button>
            </div>

            <h2>Current Readings:</h2>

            <div className="chartDiv">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={Array.from(store.readings.values())}
                        margin={{ right: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis domain={[0, 40]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="luxValue" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

export default MyComponent;
