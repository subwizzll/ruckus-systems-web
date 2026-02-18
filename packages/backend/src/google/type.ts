export interface CreateCalendarEventInput {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail: string;
  attendeeName: string;
  timezone?: string;
  zoomMeetingUrl?: string;
}

export interface CreateCalendarEventResponse {
  success: boolean;
  data?: {
    eventId: string;
    eventLink: string;
    htmlLink: string;
  };
  error?: string;
}
