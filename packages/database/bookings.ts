import { sql } from "./neon";

export interface Booking {
  id: string;
  zoom_meeting_id?: string;
  calendar_event_id?: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone?: string;
  service_id: string;
  service_title: string;
  start_time: Date;
  duration_minutes: number;
  timezone: string;
  format: "online" | "in-person";
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: "confirmed" | "rescheduled" | "cancelled";
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingInput {
  id: string;
  zoomMeetingId?: string;
  calendarEventId?: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceId: string;
  serviceTitle: string;
  startTime: Date;
  durationMinutes: number;
  timezone: string;
  format: "online" | "in-person";
  stripePaymentIntentId?: string;
  amount: number;
  currency?: string;
  status?: "confirmed" | "rescheduled" | "cancelled";
  notes?: string;
}

export const bookings = {
  async save(data: CreateBookingInput): Promise<Booking> {
    const result = await sql`
      INSERT INTO bookings (
        id,
        zoom_meeting_id, calendar_event_id,
        client_first_name, client_last_name, client_email, client_phone,
        service_id, service_title,
        start_time, duration_minutes, timezone, format,
        stripe_payment_intent_id, amount, currency,
        status, notes,
        created_at, updated_at
      )
      VALUES (
        ${data.id},
        ${data.zoomMeetingId || null}, ${data.calendarEventId || null},
        ${data.clientFirstName}, ${data.clientLastName}, ${data.clientEmail}, ${data.clientPhone || null},
        ${data.serviceId}, ${data.serviceTitle},
        ${data.startTime}, ${data.durationMinutes}, ${data.timezone}, ${data.format},
        ${data.stripePaymentIntentId || null}, ${data.amount}, ${data.currency || "usd"},
        ${data.status || "confirmed"}, ${data.notes || null},
        NOW(), NOW()
      )
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error("Failed to create booking");
    }

    return result[0] as Booking;
  },

  async findById(id: string): Promise<Booking | null> {
    const result = await sql`
      SELECT * FROM bookings WHERE id = ${id}
    `;
    return result.length > 0 ? (result[0] as Booking) : null;
  },

  async updateStatus(
    id: string,
    status: "confirmed" | "rescheduled" | "cancelled",
  ): Promise<Booking> {
    const result = await sql`
      UPDATE bookings
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error("Booking not found");
    }

    return result[0] as Booking;
  },

  async updateTime(
    id: string,
    startTime: Date,
    durationMinutes?: number,
  ): Promise<Booking> {
    const result =
      durationMinutes !== undefined
        ? await sql`
          UPDATE bookings
          SET start_time = ${startTime}, duration_minutes = ${durationMinutes},
              status = 'rescheduled', updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `
        : await sql`
          UPDATE bookings
          SET start_time = ${startTime}, status = 'rescheduled', updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;

    if (result.length === 0) {
      throw new Error("Booking not found");
    }

    return result[0] as Booking;
  },

  async findByPaymentIntent(paymentIntentId: string): Promise<Booking | null> {
    const result = await sql`
      SELECT * FROM bookings WHERE stripe_payment_intent_id = ${paymentIntentId}
    `;
    return result.length > 0 ? (result[0] as Booking) : null;
  },
};

export const saveBooking = bookings.save;
export const getBookingById = bookings.findById;
export const updateBookingStatus = bookings.updateStatus;
export const updateBookingTime = bookings.updateTime;
export const getBookingByPaymentIntent = bookings.findByPaymentIntent;
