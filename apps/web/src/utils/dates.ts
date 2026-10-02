export const getHumanReadableTimeRemaining = (endDate: EpochTimeStamp) => {
  const now = new Date().getTime();
  const timeDiff = endDate - now;
  
  if (timeDiff <= 0) {
    return 'Time Elapsed';
  }
  
  const totalSeconds = Math.floor(timeDiff / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours;
  
  const timeComponents = [];
  

  if (hours > 0) {
    timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  }
  if (seconds > 0) {
    timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  }
  
  return timeComponents[0];
};