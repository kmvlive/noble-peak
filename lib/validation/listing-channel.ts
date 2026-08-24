import { z } from "zod";
import { CHANNEL_MANAGERS } from "@/lib/channels";

const listingChannelTypeSchema = z.enum(
  CHANNEL_MANAGERS.map((c) => c.type) as [
    (typeof CHANNEL_MANAGERS)[number]["type"],
    ...(typeof CHANNEL_MANAGERS)[number]["type"][],
  ]
);

const channelCredentialSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(1000).default(""),
});

export const listingChannelConnectionSchema = z
  .object({
    id: z.string().min(1).max(200),
    type: listingChannelTypeSchema,
    credentials: z.array(channelCredentialSchema).max(50).default([]),
  })
  .superRefine((conn, ctx) => {
    const manager = CHANNEL_MANAGERS.find((c) => c.type === conn.type);
    if (!manager) return;

    const valuesByKey = new Map(
      conn.credentials.map((c) => [c.key, c.value.trim()])
    );

    for (const field of manager.credentialFields) {
      if (field.required && !valuesByKey.get(field.key)) {
        ctx.addIssue({
          code: "custom",
          path: ["credentials"],
          message: `Поле «${field.label}» обязательно для канала ${manager.name}`,
        });
      }
    }

    const knownKeys = new Set(manager.credentialFields.map((f) => f.key));
    for (const cred of conn.credentials) {
      if (!knownKeys.has(cred.key)) {
        ctx.addIssue({
          code: "custom",
          path: ["credentials"],
          message: `Неизвестное поле «${cred.key}» для канала ${manager.name}`,
        });
      }
    }
  });

export const listingChannelConnectionsSchema = z
  .array(listingChannelConnectionSchema)
  .max(20)
  .optional();

export type ListingChannelConnectionInput = z.infer<
  typeof listingChannelConnectionSchema
>;
