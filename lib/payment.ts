export * from "@noble-peak/shared";

import { isDatabaseAvailable } from "./db";
import { getPaymentSettings } from "./models";
import {
  clearPaymentCredentials,
  setPaymentCredentials,
} from "@noble-peak/shared";

export async function loadPaymentSettings(): Promise<void> {
  clearPaymentCredentials();
  try {
    if (await isDatabaseAvailable()) {
      const settings = await getPaymentSettings();
      if (settings?.terminalKey && settings?.password) {
        setPaymentCredentials(settings.terminalKey, settings.password);
      }
    }
  } catch {
    // DB unavailable — env fallback будет использован автоматически
  }
}
