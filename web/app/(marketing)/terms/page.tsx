import { LegalPage } from "@/components/legal-page";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata = { title: "Terms of Use" };

const sections = [
  {
    id: "using",
    title: "Using the service",
    body: (
      <p>
        BlightScan is a free tool built as a {site.student.program} project at {site.university}. You may use it to analyse photos of tomato leaves and monitor your own fields.
        Please don&apos;t upload content you don&apos;t have the right to share, or try to disrupt or reverse-engineer the service.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    body: <p>You are responsible for keeping your login details safe and for activity under your account. Tell us straight away if you think your account has been misused.</p>,
  },
  {
    id: "predictions",
    title: "AI predictions",
    body: (
      <>
        <p>
          Diagnoses come from a machine-learning model and can be wrong. The model recognises only healthy leaves, early blight and late blight, and was trained mostly on lab
          photos.
        </p>
        <p>Every result shows a confidence score. Treat low-confidence results with extra caution and retake the photo or request an expert review.</p>
      </>
    ),
  },
  {
    id: "decisions",
    title: "Agricultural decisions",
    body: (
      <p>
        BlightScan supports your judgement; it does not replace it. Confirm a diagnosis with a qualified agronomist, KVK or extension officer before applying treatments, and always
        follow pesticide labels and local regulations. We are not liable for crop losses or treatment decisions based on the service.
      </p>
    ),
  },
  {
    id: "weather",
    title: "Weather forecasts",
    body: <p>Spread forecasts rely on third-party weather data and a rule-based model. Forecasts become less reliable further ahead and are estimates, not guarantees.</p>,
  },
  {
    id: "availability",
    title: "Service availability",
    body: (
      <p>
        The service runs on free hosting tiers. The model service may sleep when idle, so the first scan after a quiet period can take up to a minute. We may change or pause
        features at any time.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination and deletion",
    body: <p>You can delete your account at any time from Settings. We may suspend accounts that misuse the service. Deletion permanently removes your data.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms? Email{" "}
        <a href={`mailto:${site.email}`} className="text-accent hover:underline">
          {site.email}
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Use"
      sections={sections}
      actions={
        <>
          <Button href="/privacy" variant="outline">
            Privacy Policy
          </Button>
          <Button href="/signup">Create Account</Button>
          <Button href="/contact" variant="ghost">
            Contact Us
          </Button>
        </>
      }
    />
  );
}
