// store.ts (or similar)
import {
    types,
    Instance,
    SnapshotIn,
    getSnapshot,
    applySnapshot,
} from "mobx-state-tree";
import { createContext, useContext } from "react";

const ReadingModel = types.model("Reading", {
    timestamp: types.string,
    luxValue: types.number,
});

export type Reading = Instance<typeof ReadingModel>;
export type ReadingSnapshotIn = SnapshotIn<typeof ReadingModel>;

const ReadingStore = types
    .model("ReadingStore", {
        readings: types.map(ReadingModel),
    })
    .actions((self) => ({
        addReading(id: string, reading: ReadingSnapshotIn) {
            self.readings.set(id, reading);
        },
        removeReading(id: string) {
            self.readings.delete(id);
        },
        clearReadings() {
            self.readings.clear();
        },
        // Action to load data from a snapshot
        loadData(snapshot: any) {
            applySnapshot(self, snapshot);
        },
    }));

export type ReadingStoreType = Instance<typeof ReadingStore>;

// Create the store instance
const readingStore = ReadingStore.create({ readings: {} });

// Create a React Context for the store
const StoreContext = createContext<ReadingStoreType>(readingStore); // Provide a default value

// Custom hook to use the store in components
export const useStore = () => useContext(StoreContext);

// Store Provider component
export const StoreProvider = StoreContext.Provider;

// Function to save the store's data (example using localStorage)
export const saveStoreData = () => {
    try {
        const snapshot = getSnapshot(readingStore);
        localStorage.setItem("readingStoreData", JSON.stringify(snapshot));
    } catch (error) {
        console.error("Failed to save store data:", error);
    }
};

// Function to load the store's data (example using localStorage)
export const loadStoreData = () => {
    try {
        const storedData = localStorage.getItem("readingStoreData");
        if (storedData) {
            const snapshot = JSON.parse(storedData);
            readingStore.loadData(snapshot);
        }
    } catch (error) {
        console.error("Failed to load store data:", error);
    }
};

export default readingStore; // Export the instance
