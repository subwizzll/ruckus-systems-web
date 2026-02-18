import { DateTime } from "luxon";
import { getGoogleService } from "../google/service";

export interface Slot {
  start_time: string;
  end_time: string;
  date: string;
  available: boolean;
}

export interface SlotsResponse {
  success: boolean;
  data?: {
    slots: Slot[];
    total: number;
  };
  error?: string;
}

interface BusyInterval {
  start: string;
  end: string;
}

function mergeBusyIntervals(intervals: BusyInterval[]): BusyInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  const merged: BusyInterval[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (new Date(current.start).getTime() <= new Date(last.end).getTime()) {
      if (new Date(current.end).getTime() > new Date(last.end).getTime()) {
        last.end = current.end;
      }
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function generateDaySlots(
  date: DateTime,
  busyIntervals: BusyInterval[],
  timezone: string,
  durationMinutes: number,
): Slot[] {
  const slots: Slot[] = [];
  let currentSlotStart = date.startOf("day");
  const dayEnd = date.endOf("day");

  while (currentSlotStart < dayEnd) {
    const slotDisplayEnd = currentSlotStart.plus({ minutes: 30 });
    const eventEnd = currentSlotStart.plus({ minutes: durationMinutes });
    const isAvailable = !busyIntervals.some((busy) => {
      const busyStart = DateTime.fromISO(busy.start, { zone: timezone });
      const busyEnd = DateTime.fromISO(busy.end, { zone: timezone });
      return currentSlotStart < busyEnd && eventEnd > busyStart;
    });
    if (isAvailable) {
      slots.push({
        start_time: currentSlotStart.toISO()!,
        end_time: slotDisplayEnd.toISO()!,
        date: date.toISODate()!,
        available: true,
      });
    }
    currentSlotStart = currentSlotStart.plus({ minutes: 30 });
  }
  return slots;
}

export async function fetchTimeSlots(eventDuration: number): Promise<SlotsResponse> {
  try {
    const googleService = getGoogleService();
    const timezone = await googleService.getPrimaryTimeZone();
    const today = DateTime.now().setZone(timezone).startOf("day");
    const endDate = today.plus({ days: 60 }).endOf("day");

    const freeBusyResponse = (await googleService.getFreeBusy(
      today.toJSDate(),
      endDate.toJSDate(),
    )) as any;
    const calendars = freeBusyResponse?.data?.calendars;
    if (!calendars) return { success: false, error: "No calendars accessible" };

    const allBusyIntervals: BusyInterval[] = [];
    for (const [calendarId, calendarData] of Object.entries(calendars as Record<string, any>)) {
      if (calendarData.errors?.length) continue;
      if (calendarId.includes("#holiday")) continue;
      allBusyIntervals.push(...(calendarData.busy || []));
    }

    const mergedBusyIntervals = mergeBusyIntervals(allBusyIntervals);
    const allSlots: Slot[] = [];
    let currentDay = today;
    while (currentDay <= endDate) {
      const dayStart = currentDay.startOf("day");
      const dayEnd = currentDay.endOf("day");
      const dayBusyIntervals = mergedBusyIntervals.filter((busy) => {
        const busyStart = DateTime.fromISO(busy.start, { zone: timezone });
        const busyEnd = DateTime.fromISO(busy.end, { zone: timezone });
        return busyStart < dayEnd && busyEnd > dayStart;
      });
      allSlots.push(...generateDaySlots(currentDay, dayBusyIntervals, timezone, eventDuration));
      currentDay = currentDay.plus({ days: 1 });
    }

    return { success: true, data: { slots: allSlots, total: allSlots.length } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Internal server error" };
  }
}
