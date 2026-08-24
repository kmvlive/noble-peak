import { z } from "zod";
import { LISTING_UNIT_OBJECT } from "@noble-peak/shared";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createListingBookingSchema = z
  .object({
    listingId: z.string().min(1).max(200),
    listingTitle: z.string().min(1).max(300),
    unitId: z.string().min(1).max(200).default(LISTING_UNIT_OBJECT),
    clientName: z.string().min(1).max(200),
    clientPhone: z.string().min(1).max(50),
    checkIn: z
      .string()
      .regex(isoDateRegex, "Дата должна быть в формате ГГГГ-ММ-ДД"),
    checkOut: z
      .string()
      .regex(isoDateRegex, "Дата должна быть в формате ГГГГ-ММ-ДД"),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Дата выезда должна быть позже даты заезда",
    path: ["checkOut"],
  });

export type CreateListingBookingInput = z.infer<
  typeof createListingBookingSchema
>;
