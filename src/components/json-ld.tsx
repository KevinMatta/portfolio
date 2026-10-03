import { profile, stack } from "@/content/profile";
import { siteUrl } from "@/lib/site";

export function PersonJsonLd({ locale, jobTitle, description }: { locale: string; jobTitle: string; description: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: `${siteUrl}/${locale}`,
    image: `${siteUrl}/${locale}/opengraph-image/og`,
    jobTitle,
    description,
    email: `mailto:${profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: "San Pedro Sula", addressCountry: "HN" },
    worksFor: { "@type": "Organization", name: "Creative Information Technologies" },
    knowsAbout: stack.map((s) => s.tool),
    sameAs: [profile.github, profile.linkedin],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
