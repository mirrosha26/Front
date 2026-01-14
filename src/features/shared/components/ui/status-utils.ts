export const getStatusColor = (status: string | undefined) => {
  if (!status) return 'default';

  const statusLower = status.toLowerCase();
  if (statusLower.includes('active'))
    return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
  if (statusLower.includes('closed'))
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
  if (statusLower.includes('pending'))
    return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
  return 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
};

export const getStatusText = (status: string | undefined) => {
  if (!status) return 'No status';
  return status;
}; 

// Функции для статуса назначения карточки группе
export const getAssignmentStatusColor = (status: string | undefined) => {
  if (!status) return 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  
  const statusUpper = status.toUpperCase();
  if (statusUpper === 'REVIEW') {
    return 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  }
  if (statusUpper === 'REACHING_OUT') {
    return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
  }
  if (statusUpper === 'CONNECTED') {
    return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
  }
  if (statusUpper === 'NOT_A_FIT') {
    return 'bg-zinc-100/50 text-zinc-500 border-zinc-200/50 dark:bg-zinc-800/30 dark:text-zinc-500 dark:border-zinc-700/50 opacity-60';
  }
  return 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
};

export const getAssignmentStatusText = (status: string | undefined) => {
  if (!status) return '';
  
  const statusUpper = status.toUpperCase();
  const statusMap: Record<string, string> = {
    'REVIEW': 'Review',
    'REACHING_OUT': 'Reaching out',
    'CONNECTED': 'Connected',
    'NOT_A_FIT': 'Not a Fit'
  };
  
  return statusMap[statusUpper] || status;
}; 