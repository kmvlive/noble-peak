import { z } from "zod";
import { HOUSING_TYPES, getListingSubtypesForType } from "@noble-peak/shared";
import type { HousingType } from "@noble-peak/shared";

export const housingTypeSchema = z.enum(
  HOUSING_TYPES.map((t) => t.value) as [HousingType, ...HousingType[]]
);

export const createListingSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(10_000).default(""),
    images: z.array(z.string()).max(30).default([]),
    housingType: housingTypeSchema,
    subtype: z.string().min(1).max(50),
    city: z.string().min(1).max(100),
    address: z.string().max(300).optional(),
    price: z.number().nonnegative(),
    guests: z.number().int().nonnegative().default(1),
  })
  .superRefine((val, ctx) => {
    if (!isSubtypeValidForType(val.housingType, val.subtype)) {
      ctx.addIssue({
        code: "custom",
        path: ["subtype"],
        message: "Подтип не соответствует выбранному типу жилья",
      });
    }
  });

export function isSubtypeValidForType(
  type: z.infer<typeof housingTypeSchema>,
  subtype: string
): boolean {
  return getListingSubtypesForType(type).some((s) => s.value === subtype);
}

export type CreateListingInput = z.infer<typeof createListingSchema>;
