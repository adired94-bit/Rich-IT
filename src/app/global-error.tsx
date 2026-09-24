"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "monospace", padding: 24, whiteSpace: "pre-wrap" }}>
        <h1>Diagnostic: global-error</h1>
        <p>
          <strong>message:</strong> {error.message}
        </p>
        <p>
          <strong>digest:</strong> {error.digest}
        </p>
        <p>
          <strong>stack:</strong>
        </p>
        <pre>{error.stack}</pre>
      </body>
    </html>
  );
}
