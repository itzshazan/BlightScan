import { LegalPage } from "@/components/legal-page";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata = { title: "Privacy Policy" };

const sections = [
  {
    id: "information",
    title: "Information we collect",
    body: (
      <>
        <p>When you use BlightScan we collect:</p>
        <ul>
          <li>Account details: your name, email address and, if you add them, phone number, state, district and profile photo.</li>
          <li>Leaf photos you upload, with any notes you add.</li>
          <li>Fields you create: name, variety, area, planting date and the map location you pin.</li>
          <li>Results the service produces: diagnoses, confidence scores, spread forecasts and expert reviews.</li>
          <li>Messages you send through the contact form.</li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use information",
    body: (
      <ul>
        <li>To analyse your leaf photos and show you the result.</li>
        <li>To calculate spread-risk forecasts for your fields.</li>
        <li>To send the email alerts you switch on in settings.</li>
        <li>To let an expert review a scan when you request it.</li>
        <li>To measure and improve how well the model performs, using aggregated statistics.</li>
      </ul>
    ),
  },
  {
    id: "storage",
    title: "Storage and access",
    body: (
      <>
        <p>
          Data is stored with Supabase. Leaf photos are kept in a private storage bucket and served only through short-lived signed links. Row-level security means each account
          can read only its own scans and fields.
        </p>
        <p>Experts and administrators can view scans for review and moderation. They cannot see your password.</p>
      </>
    ),
  },
  {
    id: "weather",
    title: "Weather requests",
    body: (
      <p>
        To build forecasts we send your field&apos;s latitude and longitude to Open-Meteo, a free weather service. No name, email or account identifier is sent with the request.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Service providers and sharing",
    body: (
      <>
        <p>We do not sell your data. It is processed only by the services that run BlightScan:</p>
        <ul>
          <li>Supabase: authentication, database and file storage.</li>
          <li>Vercel: hosting the website.</li>
          <li>Render or Hugging Face: hosting the model service that analyses photos.</li>
          <li>Google: only if you choose to sign in with Google.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "Retention and deletion",
    body: (
      <p>
        We keep your data while your account is active. Deleting a scan removes its photo and record. Deleting your account from Settings removes your profile, fields, scans and
        photos permanently.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    body: (
      <ul>
        <li>Edit your profile details at any time.</li>
        <li>Turn email alerts and summaries on or off.</li>
        <li>Download your scan history as CSV.</li>
        <li>Delete individual scans, fields or your whole account.</li>
      </ul>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about privacy? Email{" "}
        <a href={`mailto:${site.email}`} className="text-accent hover:underline">
          {site.email}
        </a>{" "}
        or use the contact form.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      sections={sections}
      actions={
        <>
          <Button href="/profile">Manage Account</Button>
          <Button href="/contact" variant="outline">
            Contact Us
          </Button>
          <Button href="/terms" variant="ghost">
            Terms of Use
          </Button>
        </>
      }
    />
  );
}
