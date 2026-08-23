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

export const listingRoomSchema = z.object({
  name: z.string().max(200).optional().default(""),
  capacity: z.number().int().min(1, "Вместимость должна быть не меньше 1"),
  price: z.number().min(0, "Цена не может быть отрицательной"),
});

export const createPartnerListingSchema = z
  .object({
    housingType: housingTypeSchema,
    subtype: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    description: z.string().max(10_000).default(""),
    city: z.string().min(1).max(100),
    address: z.string().max(300).optional(),
    images: z.array(z.string()).max(30).default([]),
    rooms: z
      .array(listingRoomSchema)
      .min(1, "Добавьте хотя бы один номер")
      .max(100)
      .optional(),
    meals: z.array(z.string().min(1).max(200)).max(50).optional(),
  })
  .superRefine((val, ctx) => {
    if (!isSubtypeValidForType(val.housingType, val.subtype)) {
      ctx.addIssue({
        code: "custom",
        path: ["subtype"],
        message: "Подтип не соответствует выбранному типу жилья",
      });
    }
    if (val.housingType === "rooms" && (!val.rooms || val.rooms.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["rooms"],
        message: "Для типа «Номера / спальные места» нужен хотя бы один номер",
      });
    }
  });

export type CreatePartnerListingInput = z.infer<
  typeof createPartnerListingSchema
>;
