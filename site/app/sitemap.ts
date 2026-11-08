import type { MetadataRoute } from "next";
import { nav } from "@/lib/nav";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return nav.map((n) => ({ url: `${siteUrl}${n.href === "/" ? "" : n.href}` }));
}
