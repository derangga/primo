// Copied from PIHPS on 2026-10-08:
// https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetRefProvince
// https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetRefCommodityAndCategory
// Names are trimmed; PIHPS sends "Cabai Merah Keriting " with a trailing space. Every price is per kg.

// ump2026: provincial minimum wage 2026 in whole rupiah per month, effective 2026-01-01 (PP 49/2025).
// No Kemnaker page was readable (its list was published on Instagram), so every figure is one that
// at least two independent outlets agree on:
// https://finance.detik.com/berita-ekonomi-bisnis/d-8295123/daftar-lengkap-ump-di-38-provinsi-yang-langsung-berlaku-januari-2026
// https://www.idxchannel.com/economics/catat-ini-daftar-lengkap-kenaikan-upah-minimum-provinsi-2026/all
// https://metrotvnews.com/read/KXyCWXPX-berlaku-mulai-januari-kemnaker-rilis-daftar-resmi-ump-2026-di-38-provinsi
// Sumatera Utara uses the governor decree 188.44/896/KPTS/2025 (3,228,971); the Kemnaker list says 3,228,949.
// Papua and Papua Barat use their own UMP, not that of the four newer Papua provinces (docs/adr/0005).
export const provinces = [
  { id: 1, name: "Aceh", ump2026: 3_932_552 },
  { id: 2, name: "Sumatera Utara", ump2026: 3_228_971 },
  { id: 3, name: "Sumatera Barat", ump2026: 3_182_955 },
  { id: 4, name: "Riau", ump2026: 3_780_495 },
  { id: 5, name: "Kepulauan Riau", ump2026: 3_879_520 },
  { id: 6, name: "Jambi", ump2026: 3_471_497 },
  { id: 7, name: "Bengkulu", ump2026: 2_827_250 },
  { id: 8, name: "Sumatera Selatan", ump2026: 3_942_963 },
  { id: 9, name: "Kepulauan Bangka Belitung", ump2026: 4_035_000 },
  { id: 10, name: "Lampung", ump2026: 3_047_734 },
  { id: 11, name: "Banten", ump2026: 3_100_881 },
  { id: 12, name: "Jawa Barat", ump2026: 2_317_601 },
  { id: 13, name: "DKI Jakarta", ump2026: 5_729_876 },
  { id: 14, name: "Jawa Tengah", ump2026: 2_327_386 },
  { id: 15, name: "DI Yogyakarta", ump2026: 2_417_495 },
  { id: 16, name: "Jawa Timur", ump2026: 2_446_880 },
  { id: 17, name: "Bali", ump2026: 3_207_459 },
  { id: 18, name: "Nusa Tenggara Barat", ump2026: 2_673_861 },
  { id: 19, name: "Nusa Tenggara Timur", ump2026: 2_455_898 },
  { id: 20, name: "Kalimantan Barat", ump2026: 3_054_552 },
  { id: 21, name: "Kalimantan Selatan", ump2026: 3_725_000 },
  { id: 22, name: "Kalimantan Tengah", ump2026: 3_686_138 },
  { id: 23, name: "Kalimantan Timur", ump2026: 3_762_431 },
  { id: 24, name: "Kalimantan Utara", ump2026: 3_775_243 },
  { id: 25, name: "Gorontalo", ump2026: 3_405_144 },
  { id: 26, name: "Sulawesi Selatan", ump2026: 3_921_088 },
  { id: 27, name: "Sulawesi Tenggara", ump2026: 3_306_496 },
  { id: 28, name: "Sulawesi Tengah", ump2026: 3_179_565 },
  { id: 29, name: "Sulawesi Utara", ump2026: 4_002_630 },
  { id: 30, name: "Sulawesi Barat", ump2026: 3_315_934 },
  { id: 31, name: "Maluku", ump2026: 3_334_490 },
  { id: 32, name: "Maluku Utara", ump2026: 3_510_240 },
  { id: 33, name: "Papua", ump2026: 4_436_283 },
  { id: 34, name: "Papua Barat", ump2026: 3_841_000 },
] as const;

export const categories = [
  { id: "cat_1", name: "Beras" },
  { id: "cat_2", name: "Daging Ayam" },
  { id: "cat_3", name: "Daging Sapi" },
  { id: "cat_4", name: "Telur Ayam" },
  { id: "cat_5", name: "Bawang Merah" },
  { id: "cat_6", name: "Bawang Putih" },
  { id: "cat_7", name: "Cabai Merah" },
  { id: "cat_8", name: "Cabai Rawit" },
  { id: "cat_9", name: "Minyak Goreng" },
  { id: "cat_10", name: "Gula Pasir" },
] as const;

export const variants = [
  { id: "com_1", name: "Beras Kualitas Bawah I", categoryId: "cat_1" },
  { id: "com_2", name: "Beras Kualitas Bawah II", categoryId: "cat_1" },
  { id: "com_3", name: "Beras Kualitas Medium I", categoryId: "cat_1" },
  { id: "com_4", name: "Beras Kualitas Medium II", categoryId: "cat_1" },
  { id: "com_5", name: "Beras Kualitas Super I", categoryId: "cat_1" },
  { id: "com_6", name: "Beras Kualitas Super II", categoryId: "cat_1" },
  { id: "com_7", name: "Daging Ayam Ras Segar", categoryId: "cat_2" },
  { id: "com_8", name: "Daging Sapi Kualitas 1", categoryId: "cat_3" },
  { id: "com_9", name: "Daging Sapi Kualitas 2", categoryId: "cat_3" },
  { id: "com_10", name: "Telur Ayam Ras Segar", categoryId: "cat_4" },
  { id: "com_11", name: "Bawang Merah Ukuran Sedang", categoryId: "cat_5" },
  { id: "com_12", name: "Bawang Putih Ukuran Sedang", categoryId: "cat_6" },
  { id: "com_13", name: "Cabai Merah Besar", categoryId: "cat_7" },
  { id: "com_14", name: "Cabai Merah Keriting", categoryId: "cat_7" },
  { id: "com_15", name: "Cabai Rawit Hijau", categoryId: "cat_8" },
  { id: "com_16", name: "Cabai Rawit Merah", categoryId: "cat_8" },
  { id: "com_17", name: "Minyak Goreng Curah", categoryId: "cat_9" },
  { id: "com_18", name: "Minyak Goreng Kemasan Bermerk 1", categoryId: "cat_9" },
  { id: "com_19", name: "Minyak Goreng Kemasan Bermerk 2", categoryId: "cat_9" },
  { id: "com_20", name: "Gula Pasir Kualitas Premium", categoryId: "cat_10" },
  { id: "com_21", name: "Gula Pasir Lokal", categoryId: "cat_10" },
] as const;
