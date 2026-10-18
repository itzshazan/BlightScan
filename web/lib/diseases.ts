// Mirrors the `diseases` table (spec 5.1). Once Supabase is connected, these rows are seeded there
// and the pages read from the table instead, so content can change without a redeploy.
import type { DiseaseLabel } from "./types";

/** Anything a scan result can point at, including "Healthy". */
export interface DiseaseInfo {
  slug: string | null;
  label: DiseaseLabel;
  name: string;
  shortSymptom: string;
  summary: string;
  treatment_organic: string[];
  treatment_chemical: string[];
  pathogen?: string;
  prevention?: string[];
}

/** A row of the diseases table. */
export interface Disease extends DiseaseInfo {
  slug: string;
  pathogen: string;
  pathogenType: string;
  severity: "Moderate" | "High";
  deck: string;
  symptoms: string[];
  conditions: { key: string; value: string; note: string }[];
  favourable_conditions: string;
  spread_mode: string;
  prevention: string[];
  related: string;
}

export const sources: { title: string; url: string }[] = [
  {
    title: "Early blight of tomato and potato — University of Minnesota Extension",
    url: "https://extension.umn.edu/disease-management/early-blight-tomato-and-potato",
  },
  { title: "Late blight — University of Minnesota Extension", url: "https://extension.umn.edu/disease-management/late-blight" },
  { title: "PlantVillage dataset (Hughes & Salathé, 2015)", url: "https://github.com/spMohanty/PlantVillage-Dataset" },
];

export const diseases: Disease[] = [
  {
    slug: "early-blight",
    label: "early_blight",
    name: "Early Blight",
    pathogen: "Alternaria solani",
    pathogenType: "Fungus",
    severity: "Moderate",
    summary:
      "A common fungal disease that starts on the oldest, lowest leaves as brown spots with rings like a target. It weakens the plant gradually rather than overnight.",
    deck: "Brown target-like spots on lower leaves that slowly climb the plant.",
    shortSymptom: "Brown spots with concentric rings and a yellow halo on older leaves.",
    symptoms: [
      "Small dark-brown to black spots on the oldest, lowest leaves first",
      "Spots grow into lesions with concentric rings, like a target or bullseye",
      "A yellow halo around each lesion; badly affected leaves turn yellow and drop",
      "Dark, slightly sunken lesions on stems; seedlings can show collar rot at the soil line",
      "Leathery, sunken dark patches with rings near the stem end of fruit",
    ],
    conditions: [
      { key: "Warmth", value: "24–29 °C", note: "Spores germinate fastest in warm weather." },
      { key: "Humidity", value: "≥ 90% RH", note: "Long humid spells, heavy dew or fog." },
      { key: "Leaf wetness", value: "Hours of wet leaves", note: "Rain, overhead watering or dew keep leaves wet." },
    ],
    favourable_conditions:
      "Warm days with frequent rain, heavy dew or overhead irrigation. Alternating wet and dry periods help spores form and spread. Plants that are stressed, poorly fed or carrying a heavy fruit load are more susceptible.",
    spread_mode:
      "The fungus survives between seasons in infected plant debris, in soil and on seed. Spores are carried to new leaves by wind, splashing rain and irrigation water, and on hands, tools and clothing. Lower leaves are hit first because they are closest to splashing soil.",
    treatment_organic: [
      "Pick off and bag infected lower leaves as soon as spots appear; do not compost them",
      "Mulch around plants to stop soil splashing onto leaves",
      "Water at the base (drip or furrow) in the morning so foliage dries quickly",
      "Stake and prune for airflow; remove leaves touching the soil",
      "Copper-based sprays or Bacillus subtilis biofungicides as a protectant, following the label",
    ],
    treatment_chemical: [
      "Protectant fungicides such as chlorothalonil or mancozeb, applied before disease builds up",
      "Systemic options such as azoxystrobin or difenoconazole where locally registered",
      "Rotate fungicide groups (FRAC codes) to slow resistance",
      "Always follow label rates and pre-harvest intervals; check with your local KVK or extension officer",
    ],
    prevention: [
      "Inspect lower leaves twice a week during warm, humid weather",
      "Keep 60–90 cm between plants to maintain airflow",
      "Clean tools and stakes between plots",
      "Rotate away from tomato, potato and brinjal for 2–3 years",
      "Remove and destroy crop debris after harvest",
      "Use certified disease-free seed and tolerant varieties where available",
    ],
    related: "late-blight",
  },
  {
    slug: "late-blight",
    label: "late_blight",
    name: "Late Blight",
    pathogen: "Phytophthora infestans",
    pathogenType: "Oomycete (water mould)",
    severity: "High",
    summary:
      "A fast-moving disease caused by a water mould, the same pathogen behind the Irish potato famine. In cool, wet weather it can destroy a field within days.",
    deck: "Water-soaked patches that turn brown-black and can take a field within a week.",
    shortSymptom: "Pale, water-soaked patches that quickly turn brown-black, often at leaf edges.",
    symptoms: [
      "Pale-green to grey-green, water-soaked patches, often starting at leaf tips and edges",
      "Patches enlarge quickly and turn brown to black with no target rings",
      "White, fuzzy growth on the underside of leaves in humid conditions, usually at lesion edges",
      "Greasy-looking brown lesions on stems and leaf stalks",
      "Firm, greasy brown blotches on green or ripe fruit",
    ],
    conditions: [
      { key: "Cool temperatures", value: "10–25 °C", note: "Mild nights and cool days are ideal." },
      { key: "Humidity", value: "≥ 90% RH", note: "Fog, mist and long humid spells." },
      { key: "Leaf wetness", value: "Rain & dew", note: "Spores need free water to infect." },
    ],
    favourable_conditions:
      "Cool, wet weather: mild temperatures with long spells of high humidity, fog or rain. Consecutive days with these conditions (the idea behind the Hutton criteria) sharply raise the risk of an outbreak.",
    spread_mode:
      "Spores form on infected leaves and are carried by wind over long distances, sometimes several kilometres, and by splashing rain. New outbreaks often start from infected transplants, volunteer potato plants or cull piles. Under the right weather a single infected plant can seed a whole field.",
    treatment_organic: [
      "Infected tissue cannot be cured: remove and bag affected plants immediately",
      "Do not compost infected material; bury it deep or destroy it",
      "Avoid overhead irrigation and working in the field while foliage is wet",
      "Copper-based sprays as a protectant on healthy plants before wet spells",
    ],
    treatment_chemical: [
      "Protectants such as mancozeb or chlorothalonil ahead of forecast wet weather",
      "Oomycete-specific fungicides such as cymoxanil, dimethomorph or mandipropamid where registered",
      "Metalaxyl-based products only in mixtures; resistance is widespread",
      "Follow label rates and pre-harvest intervals; ask your KVK or extension officer for local advice",
    ],
    prevention: [
      "Inspect plants daily after cool, wet spells",
      "Monitor local weather and blight advisories",
      "Remove volunteer potato and tomato plants near the field",
      "Use healthy, certified transplants",
      "Practise field sanitation: clear cull piles and debris",
      "Choose varieties with late-blight resistance where available",
    ],
    related: "early-blight",
  },
];

export const healthy: DiseaseInfo = {
  slug: null,
  label: "healthy",
  name: "Healthy",
  shortSymptom: "Even green colour, firm leaflets and no spots, rings or water-soaked patches.",
  summary:
    "No signs of early or late blight were found on this leaf. Keep monitoring, especially after warm humid spells or cool wet weather.",
  treatment_organic: [
    "Keep watering at the base and mulch the soil",
    "Continue twice-weekly inspections of lower leaves",
    "Maintain spacing and staking for airflow",
  ],
  treatment_chemical: ["No treatment needed. Consider a protectant spray only if a high-risk forecast is issued for your area"],
};

export function getDisease(slug: string): Disease | null {
  return diseases.find((d) => d.slug === slug) ?? null;
}

export function getByLabel(label: DiseaseLabel): DiseaseInfo {
  if (label === "healthy") return healthy;
  return diseases.find((d) => d.label === label) ?? healthy;
}
