import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Crawling policy.
 *
 * The AI crawlers are named explicitly and allowed on purpose. For a small
 * local food business, being quotable inside ChatGPT, Perplexity and Google's
 * AI Overviews is worth more than the traffic a blocked crawler would have
 * sent — somebody asking "vegan bakery that's safe for diabetics near me" is
 * a customer, and we would like to be the answer.
 *
 * The private paths below are excluded from everyone: they hold order data,
 * or they are one-time pages that would be meaningless in a search result.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/admin",
    "/admin/",
    "/api/",
    "/order/thank-you",
    "/order/paid",
    "/gift-cards/sent",
    "/club/welcome",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },

      // Answer engines, invited in.
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "Claude-Web", allow: "/", disallow },
      { userAgent: "anthropic-ai", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Perplexity-User", allow: "/", disallow },
      { userAgent: "Google-Extended", allow: "/", disallow },
      { userAgent: "Applebot-Extended", allow: "/", disallow },
      { userAgent: "Bingbot", allow: "/", disallow },
      { userAgent: "cohere-ai", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
