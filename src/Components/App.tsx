// src/components/MyComponent.tsx

import { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/Store"; // Adjust the path if needed

interface LuxResponse {
    luxSensor: number;
}

const MyComponent = observer(() => {
    const store = useStore();

    const [testStarted, setTestStarted] = useState(false);
    const [intervalId, setIntervalId] = useState<number | null>(null);
    const [timeoutId, setTimeoutId] = useState<number | null>(null);

    const [testDuration, setTestDuration] = useState<number>(1);     // in minutes
    const [pollingInterval, setPollingInterval] = useState<number>(1); // in seconds

    // ref to ensure only one initial fetch, even in StrictMode
    const didInitialFetch = useRef(false);

    const getReading = async () => {
        try {
            const res = await fetch("http://192.168.2.123/lux");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { luxSensor }: LuxResponse = await res.json();
            const id = Date.now().toString();
            store.addReading(id, {
                timestamp: new Date().toISOString(),
                luxValue: luxSensor,
            });
        } catch (error) {
            console.error("Error fetching reading:", error);
        }
    };

    // One-time initial fetch (runs only once)
    useEffect(() => {
        if (!didInitialFetch.current) {

            didInitialFetch.current = true;
        }
    }, []);

    // Start/stop polling when testStarted changes
    useEffect(() => {
        if (testStarted) {
            // immediate fetch when test starts
            getReading();

            // set up interval for polling
            const iid = window.setInterval(getReading, pollingInterval * 1000);
            setIntervalId(iid);

            // schedule stop after the duration
            const tid = window.setTimeout(() => {
                setTestStarted(false);
            }, testDuration * 60_000);
            setTimeoutId(tid);
        } else {
            // cleanup when test stops
            if (intervalId !== null) {
                clearInterval(intervalId);
                setIntervalId(null);
            }
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                setTimeoutId(null);
            }
        }

        // cleanup on unmount or before re-running
        return () => {
            if (intervalId !== null) clearInterval(intervalId);
            if (timeoutId !== null) clearTimeout(timeoutId);
        };
    }, [testStarted, pollingInterval, testDuration]);

    return (
        <div>
            <h2>All Readings:</h2>
            <ul>
                {Array.from(store.readings.entries()).map(([id, r]) => (
                    <li key={id}>
                        {r.timestamp}: {r.luxValue.toFixed(1)}
                    </li>
                ))}
            </ul>

            <div style={{ margin: "1rem 0" }}>
                <label>
                    Test duration (minutes):
                    <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={testDuration}
                        onChange={e => setTestDuration(Number(e.target.value))}
                        style={{ marginLeft: 8, width: 60 }}
                    />
                </label>
                <label style={{ marginLeft: 24 }}>
                    Polling interval (seconds):
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={pollingInterval}
                        onChange={e => setPollingInterval(Number(e.target.value))}
                        style={{ marginLeft: 8, width: 60 }}
                    />
                </label>
            </div>

            <button onClick={() => setTestStarted(s => !s)}>
                {testStarted ? "Stop Test" : "Start Test"}
            </button>
            <button onClick={getReading} style={{ marginLeft: 8 }}>
                Fetch Reading
            </button>
            <button onClick={store.clearReadings} style={{ marginLeft: 8 }}>
                Clear Readings
            </button>
        </div>
    );
});

export default MyComponent;
