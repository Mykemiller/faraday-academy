"use client";

// Error state in the interface's voice (spec §10): what happened + what to do. No stack traces.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-serif text-2xl text-forest">We couldn&apos;t load the catalog.</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-forest-70">
        Something went wrong on our side. Reload to try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-warm-white"
      >
        Reload
      </button>
    </main>
  );
}
