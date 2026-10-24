import Link from "next/link";
import { Logo } from "@/components/logo";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Logo />
      <h1 className="mt-8 text-4xl">Privacy notice</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        Fieldwork stores your confirmed profile, documents, job matches, and application history in South Africa-facing
        infrastructure (Supabase). We use OpenAI for extraction and document drafting, Apify for PNet discovery, and
        Resend for email. We do not sell auto-apply on PNet, LinkedIn, or Indeed. Automatic submission, if you enable it,
        only runs on workflows we have marked as permitted (currently the local mock form).
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
        <li>You can edit your profile at any time.</li>
        <li>You can delete your account from Profile; that removes your auth user and cascaded rows.</li>
        <li>We do not collect identity numbers or dates of birth unless a future permitted workflow requires them.</li>
        <li>Job listings are untrusted text and cannot override your pause, consent, or application mode.</li>
      </ul>
      <Link href="/" className="mt-8 inline-block text-sm underline">
        Home
      </Link>
    </main>
  );
}
