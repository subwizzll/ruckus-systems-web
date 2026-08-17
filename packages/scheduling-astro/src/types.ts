export type BookingModalService = {
  id: string;
  title: string;
  description: string;
  duration: number | string;
  amount: number;
  priceInfo?: string | null;
  minDaysInAdvance?: number;
  maxDaysInAdvance?: number;
  formats?: Array<"zoom" | "google-meet" | "phone" | "in-person">;
  isOnline?: boolean;
  isInPerson?: boolean;
  isPhone?: boolean;
};
