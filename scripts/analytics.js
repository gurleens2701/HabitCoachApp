export function calculateStreak(logs) {
    if (!logs?.length) return 0;
    
    let currentStreak = 0;
    const today = new Date();
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  
    for (let i = 0; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (logDate.toDateString() === expectedDate.toDateString() 
          && sortedLogs[i].completed) {
        currentStreak++;
      } else break;
    }
    
    return currentStreak;
  }
  
  export function calculateCompletionRate(logs, startDate) {
    if (!logs?.length) return 0;
    
    const totalDays = Math.ceil(
      (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)
    );
    const completedDays = logs.filter(log => log.completed).length;
    
    return Math.round((completedDays / totalDays) * 100);
  }