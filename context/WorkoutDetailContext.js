import React, { createContext, useState, useContext } from 'react';

const WorkoutDetailContext = createContext({
  activeWorkout: null,
  setActiveWorkout: () => {},
  playbackWorkout: null,
  setPlaybackWorkout: () => {},
});

export const WorkoutDetailProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);

  const [playbackWorkout, setPlaybackWorkout] = useState(null);

  const value = { 
    activeWorkout, 
    setActiveWorkout,
    playbackWorkout,
    setPlaybackWorkout
  };

  return (
    <WorkoutDetailContext.Provider value={value}>
      {children}
    </WorkoutDetailContext.Provider>
  );
};

export const useActiveWorkout = () => {
  const context = useContext(WorkoutDetailContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within a WorkoutDetailProvider');
  }
  return context;
};