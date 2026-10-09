// DESIGN.UI.md, Type and numbers: dot for thousands, a comma before the single decimal of a percent,
// whole rupiah, and a real minus sign (−) for a fall.
const thousands = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

const percent = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// 16400 as "16.400".
export const formatRupiah = (rupiah: number) => thousands.format(rupiah);

const kilogramsFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

// 338 as "338". A median of two provinces can end in a half: 199.5 as "199,5".
export const formatKilograms = (kg: number) => kilogramsFormat.format(kg);

export type Change = {
  readonly direction: "up" | "down" | "flat";
  // "+Rp 550", "−Rp 2.500" or "Rp 0".
  readonly rupiah: string;
  // "+3,4%", "−15,2%" or "0,0%".
  readonly percent: string;
  // Both together, rupiah first and percent in brackets: "+Rp 550 (+3,4%)".
  readonly text: string;
};

// The change from `reference` to `value`. A rise or a fall of less than half a tenth of a percent
// reads as flat, so the sign never contradicts the figure beside it.
export function changeBetween(value: number, reference: number): Change {
  const diff = value - reference;
  const tenths = Math.round(Math.abs((diff / reference) * 100) * 10);

  if (diff === 0 || tenths === 0) {
    const rupiah = `Rp ${formatRupiah(Math.abs(diff))}`;

    return { direction: "flat", rupiah, percent: "0,0%", text: `${rupiah} (0,0%)` };
  }

  const sign = diff > 0 ? "+" : "−";
  const rupiah = `${sign}Rp ${formatRupiah(Math.abs(diff))}`;
  const percentText = `${sign}${percent.format(tenths / 10)}%`;

  return {
    direction: diff > 0 ? "up" : "down",
    rupiah,
    percent: percentText,
    text: `${rupiah} (${percentText})`,
  };
}
