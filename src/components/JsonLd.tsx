/**
 * Emits a structured-data block. Server-rendered, so crawlers and answer
 * engines that do not execute JavaScript still see it.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <>
      {payload.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          // The content is ours, built from our own database — but `<` is still
          // escaped so a stray character in a review can never close the tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
