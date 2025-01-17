export const calculateDaysGone = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const difference = endDate.getTime() - startDate.getTime();
    return Math.floor(difference / (1000 * 3600 * 24));
};

export const formatDate = (date: string): string => {
    const parsedDate = new Date(date);
    return parsedDate.toDateString();
};
