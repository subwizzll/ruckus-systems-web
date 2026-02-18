/**
 * Shared business logic for Step 2 time selection (calendar + time slots).
 * Used by BookingModal and reschedule page to enforce DRY.
 */

export const WORK_DAY_START_MINUTES = 9 * 60;
export const WORK_DAY_END_MINUTES = 17 * 60;

export interface Slot {
  start_time: string;
  end_time: string;
}

export function isSlotWithinBusinessHours(
  slot: Slot | null | undefined,
  startMinutes = WORK_DAY_START_MINUTES,
  endMinutes = WORK_DAY_END_MINUTES
): boolean {
  if (!slot?.start_time || !slot?.end_time) return false;
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return false;

  const startDay = start.getDay();
  const endDay = end.getDay();
  const isWeekday = startDay >= 1 && startDay <= 5;
  if (!isWeekday || startDay !== endDay) return false;

  const startM = start.getHours() * 60 + start.getMinutes();
  const endM = end.getHours() * 60 + end.getMinutes();
  return startM >= startMinutes && endM <= endMinutes;
}

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isAtCurrentMonth(currentDate: Date): boolean {
  const now = new Date();
  return (
    currentDate.getFullYear() === now.getFullYear() &&
    currentDate.getMonth() === now.getMonth()
  );
}

export function groupSlotsByTimeOfDay(slots: Slot[]): {
  morning: Slot[];
  afternoon: Slot[];
  evening: Slot[];
} {
  const morning: Slot[] = [];
  const afternoon: Slot[] = [];
  const evening: Slot[] = [];
  for (const slot of slots) {
    const hour = new Date(slot.start_time).getHours();
    if (hour < 12) morning.push(slot);
    else if (hour < 17) afternoon.push(slot);
    else evening.push(slot);
  }
  return { morning, afternoon, evening };
}

export function formatSlotTime(slot: Slot): string {
  return new Date(slot.start_time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Build HTML for Morning/Afternoon/Evening time-slot sections (shared markup). */
export function buildTimeSlotsHTML(
  morning: Slot[],
  afternoon: Slot[],
  evening: Slot[]
): string {
  const section = (title: string, list: Slot[]) => {
    if (!list.length) return "";
    const buttons = list
      .map((slot) => {
        const label = formatSlotTime(slot);
        const data = JSON.stringify(slot).replace(/'/g, "&#39;");
        return `<button type="button" class="time-slot-button" data-slot='${data}'>${label}</button>`;
      })
      .join("");
    return `
  <h4 class="mb-2 mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">${title}</h4>
  <div class="grid grid-cols-2 gap-3">
    ${buttons}
  </div>
`;
  };
  return (
    section("Morning", morning) +
    section("Afternoon", afternoon) +
    section("Evening", evening)
  );
}

export function getSlotsByDate(
  availableSlots: Slot[],
  toLocalDateStrFn: (d: Date) => string
): Record<string, Slot[]> {
  const slotsByDate: Record<string, Slot[]> = {};
  for (const slot of availableSlots) {
    const dateKey = toLocalDateStrFn(new Date(slot.start_time));
    if (!slotsByDate[dateKey]) slotsByDate[dateKey] = [];
    slotsByDate[dateKey].push(slot);
  }
  return slotsByDate;
}

export interface CalendarDayModel {
  dateStr: string;
  daySlots: Slot[];
  isCurrentMonth: boolean;
  isAvailable: boolean;
  isToday: boolean;
  isSelected: boolean;
  classes: string;
  dayNumber: number;
}

export function buildCalendarDayModels(config: {
  currentDate: Date;
  selectedDate: string | null;
  availableSlots: Slot[];
}): CalendarDayModel[] {
  const { currentDate, selectedDate, availableSlots } = config;
  const slotsByDate = getSlotsByDate(availableSlots, toLocalDateStr);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startCalendar = new Date(firstDay);
  startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const models: CalendarDayModel[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(startCalendar);
    day.setDate(startCalendar.getDate() + i);
    const dateStr = toLocalDateStr(day);
    const daySlots = slotsByDate[dateStr] || [];
    const isCurrentMonth = day.getMonth() === month;
    const isAvailable = daySlots.length > 0 && day >= today;
    const isToday = day.toDateString() === today.toDateString();
    const isSelected = selectedDate === dateStr;
    let classes = "calendar-day";
    if (!isCurrentMonth) classes += " text-slate-300 dark:text-slate-600";
    else if (!isAvailable) classes += " unavailable";
    else classes += " available";
    if (isToday) classes += " today";
    if (isSelected) classes += " selected";
    models.push({
      dateStr,
      daySlots,
      isCurrentMonth,
      isAvailable,
      isToday,
      isSelected,
      classes,
      dayNumber: day.getDate(),
    });
  }
  return models;
}

export function formatSelectedDateLabel(dateStr: string): string {
  const [yr, mo, dy] = dateStr.split("-").map(Number);
  return new Date(yr, mo - 1, dy).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

