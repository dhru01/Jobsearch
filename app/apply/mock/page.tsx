"use client";

import { useState } from "react";

export default function MockApplyPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p id="confirmation" className="rounded-2xl bg-good-bg px-4 py-3 text-good">
          Application received. This is a Fieldwork test form, not a real employer.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-3xl">Mock graduate application</h1>
      <p className="mt-2 text-sm text-muted">Local testing only. Playwright fills this form. Nothing is sent to PNet or LinkedIn.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <label className="block text-sm">
          Full name
          <input id="full_name" name="full_name" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input id="email" name="email" type="email" required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Phone
          <input id="phone" name="phone" className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Expected salary
          <input id="salary" name="salary" className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          Why this role?
          <textarea id="why" name="why" rows={4} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="block text-sm">
          CV
          <input id="cv" name="cv" type="file" className="mt-1 w-full text-sm" />
        </label>
        <button type="submit" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">
          Submit application
        </button>
      </form>
    </main>
  );
}
