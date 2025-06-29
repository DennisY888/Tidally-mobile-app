// context/WorkoutDetailContext.js
import React, { createContext, useState, useContext } from 'react';


// Create the context with a default shape for better autocompletion.
const WorkoutDetailContext = createContext({
  activeWorkout: null,
  setActiveWorkout: () => {},
});


// Provider component. holds the state.
export const WorkoutDetailProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);

  // The 'value' object is what consuming components will receive.
  const value = { activeWorkout, setActiveWorkout };

  return (
    <WorkoutDetailContext.Provider value={value}>
      {children}
    </WorkoutDetailContext.Provider>
  );
};


// custom hook for easy consumption. Following best practice.
export const useActiveWorkout = () => {
  const context = useContext(WorkoutDetailContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within a WorkoutDetailProvider');
  }
  return context;
};