import { z } from "zod";
import { LISTING_UNIT_OBJECT } from "@noble-peak/shared";

export const listingDateStatusSchema = z.enum([
  "available",
  "booked",
  "closed",
]);

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const listingCalendarDatesSchema = z
  .record(z.string().min(1).max(32), listingDateStatusSchema)
  .refine((dates) =>
    Object.keys(dates).every((date) => isoDateRegex.test(date))
  );

export const setListingCalendarSchema = z.object({
  listingId: z.string().min(1).max(200),
  unitId: z.string().min(1).max(200).default(LISTING_UNIT_OBJECT),
  dates: listingCalendarDatesSchema,
});

export const setListingDateStatusSchema = z.object({
  listingId: z.string().min(1).max(200),
  unitId: z.string().min(1).max(200).default(LISTING_UNIT_OBJECT),
  date: z.string().regex(isoDateRegex, "Дата должна быть в формате ГГГГ-ММ-ДД"),
  status: listingDateStatusSchema,
});

export type SetListingCalendarInput = z.infer<typeof setListingCalendarSchema>;
export type SetListingDateStatusInput = z.infer<
  typeof setListingDateStatusSchema
>;

export const listingCalendarPricesSchema = z
  .record(
    z.string().min(1).max(32),
    z.number().int().positive().max(10_000_000)
  )
  .refine((prices) =>
    Object.keys(prices).every((date) => isoDateRegex.test(date))
  );

export const setListingPricesSchema = z.object({
  listingId: z.string().min(1).max(200),
  unitId: z.string().min(1).max(200).default(LISTING_UNIT_OBJECT),
  prices: listingCalendarPricesSchema,
});

export const setListingMinNightsSchema = z.object({
  listingId: z.string().min(1).max(200),
  unitId: z.string().min(1).max(200).default(LISTING_UNIT_OBJECT),
  minNights: z.number().int().min(1).max(365),
});

export type SetListingPricesInput = z.infer<typeof setListingPricesSchema>;
export type SetListingMinNightsInput = z.infer<
  typeof setListingMinNightsSchema
>;
