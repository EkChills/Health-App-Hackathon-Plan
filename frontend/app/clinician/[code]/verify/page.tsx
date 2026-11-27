export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <section>
      <h1>Verify &amp; note</h1>
      <p className="muted">
        Clinician screen 7. Accept or dismiss flags, add a clinical note.
      </p>
      <p className="muted">Share code: {code}</p>
    </section>
  );
}
