import { priceFill, type Bucket } from "~/buckets";

// The 12 px swatch of a bucket. No data is the hatched one.
export function BucketSwatch(props: { readonly bucket: Bucket }) {
  return props.bucket === "no-data" ? (
    <i className="no-data-swatch inline-block size-3 flex-none rounded-[3px]" />
  ) : (
    <i
      className="inline-block size-3 flex-none rounded-[3px]"
      style={{ background: priceFill[props.bucket] }}
    />
  );
}
