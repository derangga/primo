import { StorageUnavailable } from "@primo/contract/errors";

export function DataBadge(props: { readonly date: string | StorageUnavailable }) {
  return (
    <span>
      {props.date instanceof StorageUnavailable
        ? "Data unavailable"
        : `Data ${props.date} · PIHPS eceran`}
    </span>
  );
}
