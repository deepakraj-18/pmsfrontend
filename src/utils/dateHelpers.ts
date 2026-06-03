import { parseISO, isValid, differenceInDays, startOfDay } from 'date-fns';

export const formatLocalDate = (dateVal: Date | string | null | undefined): string | null => {
    if (!dateVal) return null;
    let d: Date;
    if (typeof dateVal === 'string' && dateVal.includes('T') === false && dateVal.includes(' ') === false) {
        d = parseISO(dateVal);
    } else {
        d = new Date(dateVal);
    }

    if (!isValid(d)) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const calculateDaysLeft = (endDateVal: Date | string | null | undefined): number | null => {
    if (!endDateVal) return null;

    let endDate: Date;
    if (typeof endDateVal === 'string' && endDateVal.includes('T') === false && endDateVal.includes(' ') === false) {
        endDate = parseISO(endDateVal);
    } else {
        endDate = new Date(endDateVal);
    }

    if (!isValid(endDate)) return null;

    const normalizedEndDate = startOfDay(endDate);
    const normalizedToday = startOfDay(new Date());

    return differenceInDays(normalizedEndDate, normalizedToday);
};

export const formatDaysLeftText = (daysLeft: number | null): string => {
    if (daysLeft === null) return 'No due date';
    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return '1 day left';
    if (daysLeft > 365) return 'More than a year left';
    return `${daysLeft} days left`;
};

export const calculateDaysToDate = (targetDateVal: Date | string | null | undefined): number | null => {
    if (!targetDateVal) return null;
    let targetDate: Date;
    if (typeof targetDateVal === 'string' && targetDateVal.includes('T') === false && targetDateVal.includes(' ') === false) {
        targetDate = parseISO(targetDateVal);
    } else {
        targetDate = new Date(targetDateVal);
    }
    if (!isValid(targetDate)) return null;
    const normalizedTarget = startOfDay(targetDate);
    const normalizedToday = startOfDay(new Date());
    return differenceInDays(normalizedTarget, normalizedToday);
};
