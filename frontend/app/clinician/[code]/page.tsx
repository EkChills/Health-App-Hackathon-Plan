export default async function BriefPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <section>
      <h1>Brief</h1>
      <p className="muted">
        Clinician screen 6. Problem list, meds and interaction flags, key
        trends, last three documents, AI draft summary in a visibly distinct
        block.
      </p>
      <p className="muted">Share code: {code}</p>
    </section>
  );
}
