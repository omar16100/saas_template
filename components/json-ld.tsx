import { env } from "@/lib/env";

function Script({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: env.NEXT_PUBLIC_APP_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
        logo: `${env.NEXT_PUBLIC_APP_URL}/icon.png`,
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: env.NEXT_PUBLIC_APP_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${env.NEXT_PUBLIC_APP_URL}/search?q={query}`,
          "query-input": "required name=query",
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: it.url,
        })),
      }}
    />
  );
}

export function ArticleJsonLd(props: {
  headline: string;
  description?: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
}) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: props.headline,
        description: props.description,
        author: { "@type": "Person", name: props.author ?? env.NEXT_PUBLIC_APP_NAME },
        datePublished: props.datePublished,
        dateModified: props.dateModified ?? props.datePublished,
        mainEntityOfPage: props.url,
      }}
    />
  );
}

export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: it.a },
        })),
      }}
    />
  );
}

export function SoftwareAppJsonLd(props: { name: string; price: string; currency: string }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: props.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: props.price,
          priceCurrency: props.currency,
        },
      }}
    />
  );
}
