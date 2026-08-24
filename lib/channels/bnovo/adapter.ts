/**
 * Адаптер канала Bnovo, реализующий контракт ChannelSyncAdapter.
 * Регистрируется в реестре каналов и вызывается ядром календаря без его правок.
 */

import type {
  ChannelCalendarEntry,
  ChannelSyncAdapter,
  ChannelSyncContext,
  ChannelSyncResult,
} from "@/lib/channels";
import type { ListingChannelConnection } from "@noble-peak/shared";
import {
  getBnovoCredentials,
  importBnovoBookings,
  importBnovoClosedSales,
  publishListingToBnovo,
  publishClosedSalesToBnovo,
} from "./sync";
import { getChannelSyncRecord } from "@/lib/models";

export const bnovoAdapter: ChannelSyncAdapter = {
  type: "bnovo",

  async pull(
    context: ChannelSyncContext,
    connection: ListingChannelConnection
  ): Promise<ChannelSyncResult> {
    if (!getBnovoCredentials(connection)) {
      return { imported: [], pushed: 0 };
    }
    const sync = await getChannelSyncRecord(connection.id);
    await importBnovoBookings(context.listing, connection, sync);
    await importBnovoClosedSales(context.listing, connection, sync);

    const entries: ChannelCalendarEntry[] = [];
    for (const calendar of context.calendars ?? []) {
      for (const [date, status] of Object.entries(calendar.dates ?? {})) {
        if (status === "booked" || status === "closed") {
          entries.push({ unitId: calendar.unitId, date, status });
        }
      }
    }
    return { imported: entries, pushed: 0 };
  },

  async push(
    context: ChannelSyncContext,
    connection: ListingChannelConnection
  ): Promise<ChannelSyncResult> {
    if (!getBnovoCredentials(connection)) {
      return { imported: [], pushed: 0 };
    }
    const sync = await getChannelSyncRecord(connection.id);
    await publishListingToBnovo(context.listing, connection, sync);
    await publishClosedSalesToBnovo(context.listing, connection, sync);
    return { imported: [], pushed: 1 };
  },
};
