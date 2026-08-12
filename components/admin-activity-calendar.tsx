"use client";

import { getToken } from "./admin-layout-client";
import { ActivityCalendarEditor } from "./activity-calendar-editor";

interface AdminActivityCalendarProps {
  activityId: string;
}

export function AdminActivityCalendar({
  activityId,
}: AdminActivityCalendarProps) {
  return (
    <ActivityCalendarEditor
      activityId={activityId}
      fetchUrl={`/api/admin/activities/${activityId}/calendar`}
      saveUrl={`/api/admin/activities/${activityId}/calendar`}
      ordersUrl={`/api/admin/activities/${activityId}/order-dates`}
      tokenProvider={() => getToken()}
    />
  );
}
