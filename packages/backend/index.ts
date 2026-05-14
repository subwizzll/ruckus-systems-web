export * from "./src/auth";
export { sendEmail } from "./src/lib/resend";
export {
  verifyToken,
  generateToken,
  generateRescheduleToken,
  generateCancelToken,
  validateBookingToken,
  decodeBookingToken,
  type TokenPayload,
  type BookingTokenPayload,
} from "./src/lib/jwt";
export {
  BOOKING_CONFIRMATION_EMAIL_SUBJECT,
  buildBookingConfirmationEmailHtml,
  type BookingConfirmationEmailInput,
} from "./src/emails/booking-confirmation";
export {
  RESCHEDULE_CONFIRMATION_EMAIL_SUBJECT,
  buildRescheduleConfirmationEmailHtml,
  type RescheduleConfirmationEmailInput,
} from "./src/emails/reschedule-confirmation";
export {
  CANCEL_CONFIRMATION_EMAIL_SUBJECT,
  buildCancelConfirmationEmailHtml,
  type CancelConfirmationEmailInput,
} from "./src/emails/cancel-confirmation";
export * from "./src/booking/index";
export * from "./src/zoom/meeting";
export * from "./src/booking/slots";
export { type GoogleService } from "./src/google/service";
export type {
  CreateCalendarEventInput,
  CreateCalendarEventResponse,
} from "./src/google/type";
export * from "./src/payment/index";
export type { Practitioner, ApiCredential, AuthSession, Booking } from "@workspace/database";
export {
  apiCredentials,
  practitioners,
  authSessions,
  bookings,
  saveBooking,
  getBookingById,
  updateBookingStatus,
  updateBookingTime,
  getBookingByPaymentIntent,
} from "@workspace/database";
