"use client";

import { getToken } from "./partner-layout-client";
import { ActivityCalendarEditor } from "./activity-calendar-editor";

interface PartnerActivityCalendarProps {
  activityId: string;
}

export function PartnerActivityCalendar({
  activityId,
}: PartnerActivityCalendarProps) {
  return (
    <ActivityCalendarEditor
      activityId={activityId}
      fetchUrl={`/api/partner/activities/${activityId}/calendar`}
      saveUrl={`/api/partner/activities/${activityId}/calendar`}
      tokenProvider={() => getToken()}
    />
  );
}
