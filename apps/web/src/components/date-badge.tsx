import { useQuery } from "@tanstack/react-query";
import { BadgeView } from "~/components/badge-view";
import { badgeStateOfResponse } from "~/date-badge-state";
import { datesOptions } from "~/queries";

// Any failure reads the same to the visitor: the request failed, the response did not match the
// contract, or the backend could not read its database.
export function DateBadge() {
  const dates = useQuery({ ...datesOptions, select: badgeStateOfResponse });

  switch (dates.status) {
    case "pending":
      return <BadgeView state={{ kind: "loading" }} />;

    case "error":
      return <BadgeView state={{ kind: "error" }} />;

    case "success":
      return <BadgeView state={dates.data} />;
  }
}
