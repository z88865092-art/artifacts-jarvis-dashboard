export const useJarvisMemory = () => {
  const saveTask = (command: string, response: string) => {
    // LocalStorage mein data save karna (Offline Memory)
    const memory = JSON.parse(localStorage.getItem("jarvis_memory") || "[]");
    const newEntry = { command, response, timestamp: new Date().toISOString() };

    // Memory limit: pichli 50 commands store karein
    const updatedMemory = [...memory, newEntry].slice(-50);
    localStorage.setItem("jarvis_memory", JSON.stringify(updatedMemory));

    console.log("Jarvis Learned:", newEntry);
  };

  return { saveTask };
};
