import type { MetadataRoute } from "next";
import { nav } from "@/lib/nav";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ozgrowthco.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return nav.map((n) => ({ url: `${siteUrl}${n.href === "/" ? "/" : `${n.href}/`}` }));
}
