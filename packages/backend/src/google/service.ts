import { google, type calendar_v3 } from "googleapis";
import { JWT } from "google-auth-library";
import type { CreateCalendarEventInput, CreateCalendarEventResponse } from "./type";

function getJwtClient(): JWT {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const subjectEmail = process.env.GOOGLE_SUBJECT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !subjectEmail || !privateKey) {
    if (!clientEmail) console.error("❌ Missing GOOGLE_CLIENT_EMAIL environment variable.");
    if (!subjectEmail) console.error("❌ Missing GOOGLE_SUBJECT_EMAIL environment variable.");
    if (!privateKey) console.error("❌ Missing GOOGLE_PRIVATE_KEY environment variable.");
    throw new Error("Missing Google service-account env vars");
  }

  return new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    subject: subjectEmail,
  });
}

class GoogleServiceClass {
  private readonly calendar: calendar_v3.Calendar;

  constructor() {
    this.calendar = google.calendar({ version: "v3", auth: getJwtClient() });
  }

  async getCalendarList() {
    return this.calendar.calendarList.list();
  }

  async getPrimaryTimeZone(): Promise<string> {
    try {
      const list = await this.getCalendarList();
      const primary =
        list.data.items?.find((i) => i.primary && !i.id?.includes("#holiday")) ||
        list.data.items?.find((i) => !i.id?.includes("#holiday"));
      return primary?.timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }

  async getFreeBusy(timeMin: Date, timeMax: Date) {
    const calendarList = await this.getCalendarList();
    const items =
      calendarList.data.items
        ?.filter((item) => !(item.id || "").includes("#holiday"))
        .map((item) => ({ id: item.id as string })) || [];

    return (this.calendar.freebusy.query as any)(
      {
        requestBody: { timeMin, timeMax, items },
      },
      undefined,
    );
  }

  async createCalendarEvent(
    eventData: CreateCalendarEventInput,
  ): Promise<CreateCalendarEventResponse> {
    try {
      const calendarListResponse = await this.getCalendarList();
      const primaryCalendar = calendarListResponse.data.items?.find(
        (cal) => cal.primary && !cal.id?.includes("#holiday"),
      );
      if (!primaryCalendar?.id) {
        throw new Error("Primary calendar not found");
      }

      const timezone = eventData.timezone || primaryCalendar.timeZone || "America/New_York";
      const event: calendar_v3.Schema$Event = {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.startTime.toISOString(), timeZone: timezone },
        end: { dateTime: eventData.endTime.toISOString(), timeZone: timezone },
        attendees: [
          {
            email: eventData.attendeeEmail,
            displayName: eventData.attendeeName,
            responseStatus: "needsAction",
          },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        guestsCanSeeOtherGuests: false,
      };

      const response = await this.calendar.events.insert({
        calendarId: primaryCalendar.id,
        requestBody: event,
        sendUpdates: "all",
      });

      if (!response.data?.id) throw new Error("Failed to create calendar event");

      return {
        success: true,
        data: {
          eventId: response.data.id,
          eventLink: response.data.htmlLink || "",
          htmlLink: response.data.htmlLink || "",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create calendar event",
      };
    }
  }

  async deleteCalendarEvent(eventId: string) {
    try {
      const list = await this.getCalendarList();
      const primary = list.data.items?.find((cal) => cal.primary && !cal.id?.includes("#holiday"));
      if (!primary?.id) throw new Error("Primary calendar not found");
      await this.calendar.events.delete({
        calendarId: primary.id,
        eventId,
        sendUpdates: "all",
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete calendar event",
      };
    }
  }

  async updateCalendarEvent(
    eventId: string,
    updates: {
      startTime?: Date;
      endTime?: Date;
      summary?: string;
      description?: string;
      rescheduleUrl?: string;
      cancelUrl?: string;
    },
  ) {
    try {
      const list = await this.getCalendarList();
      const primary = list.data.items?.find((cal) => cal.primary && !cal.id?.includes("#holiday"));
      if (!primary?.id) throw new Error("Primary calendar not found");
      const timezone = primary.timeZone || "America/New_York";

      const requestBody: calendar_v3.Schema$Event = {};
      if (updates.summary) requestBody.summary = updates.summary;
      if (updates.description) requestBody.description = updates.description;
      if (updates.startTime) {
        requestBody.start = { dateTime: updates.startTime.toISOString(), timeZone: timezone };
      }
      if (updates.endTime) {
        requestBody.end = { dateTime: updates.endTime.toISOString(), timeZone: timezone };
      }

      await this.calendar.events.patch({
        calendarId: primary.id,
        eventId,
        requestBody,
        sendUpdates: "all",
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update calendar event",
      };
    }
  }
}

let _googleService: GoogleServiceClass | null = null;
export function getGoogleService(): GoogleServiceClass {
  if (!_googleService) {
    _googleService = new GoogleServiceClass();
  }
  return _googleService;
}

export type GoogleService = GoogleServiceClass;
