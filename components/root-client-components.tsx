"use client";

import dynamic from "next/dynamic";

export const BridgeProvider = dynamic(
  () =>
    import("@/components/bridge-provider").then((m) => ({
      default: m.BridgeProvider,
    })),
  { ssr: false }
);

export const AnalyticsInjector = dynamic(
  () =>
    import("@/components/analytics-injector").then((m) => ({
      default: m.AnalyticsInjector,
    })),
  { ssr: false }
);

export const NotificationPoller = dynamic(
  () =>
    import("@/components/notification-poller").then((m) => ({
      default: m.NotificationPoller,
    })),
  { ssr: false }
);

export const HeaderAuth = dynamic(
  () =>
    import("@/components/header-auth").then((m) => ({
      default: m.HeaderAuth,
    })),
  { ssr: false }
);

export const HeaderSectionSwitch = dynamic(
  () =>
    import("@/components/header-section-switch").then((m) => ({
      default: m.HeaderSectionSwitch,
    })),
  { ssr: false }
);

export const HeaderCity = dynamic(
  () =>
    import("@/components/header-city").then((m) => ({
      default: m.HeaderCity,
    })),
  { ssr: false }
);

export const FooterMenu = dynamic(
  () =>
    import("@/components/footer-menu").then((m) => ({
      default: m.FooterMenu,
    })),
  { ssr: false }
);

export const InstallPrompt = dynamic(
  () =>
    import("@/components/install-prompt").then((m) => ({
      default: m.InstallPrompt,
    })),
  { ssr: false }
);

export const Toaster = dynamic(
  () =>
    import("@/components/ui/sonner").then((m) => ({
      default: m.Toaster,
    })),
  { ssr: false }
);
