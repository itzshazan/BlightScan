// Project-level settings. Anything marked TODO is filled in from real results, never invented.
export const site = {
  name: "BlightScan",
  tagline: "Early blight detection for tomato growers",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  github: "https://github.com/itzshazan/BlightScan",
  linkedin: "https://www.linkedin.com/in/shazan-khan-0017b3380",
  email: "shazankhan324@gmail.com",
  university: "Manav Rachna University",
  universityAddress: "Sector 43, Aravalli Hills, Delhi–Surajkund Road, Faridabad, Haryana 121004",
  datasetUrl: "https://github.com/spMohanty/PlantVillage-Dataset",
  student: { name: "Shazan Khan", roll: "[Roll no.]", program: "B.Tech CSE (AI & ML)" },
  guide: { name: "Pooja Parmar", department: "Education Department" },
  legalUpdated: "18 October 2026",
};

// Pretrained model served by ml-service/ (no training in this project). Metrics are the model
// author's, measured on PlantVillage photos of leaves never seen in training; field photos will score lower.
export const model = {
  name: "plant-disease-dinov2-small",
  author: "rodynaemad",
  url: "https://huggingface.co/rodynaemad/plant-disease-dinov2-small",
  license: "CC BY-SA 4.0",
  version: "dinov2-small-plantvillage-int8",
  architecture: "DINOv2-small backbone (frozen) + linear classifier",
  runtime: "ONNX Runtime, int8, CPU",
  inputSize: "224 × 224 × 3",
  classes: 3, // BlightScan reports 3 of the model's 38 classes
  modelClasses: 38,
  datasetImages: 54305, // PlantVillage colour set
  testImages: 10862,
  // PlantVillage images of the three classes BlightScan reports
  classCounts: { early_blight: 1000, late_blight: 1909, healthy: 1591 },
  split: { train: 80, test: 20 }, // leaf-grouped: all photos of one leaf on the same side
  metrics: { accuracy: 98.7 as number | null, f1: 98.1 as number | null },
  avgResponseMs: null as number | null, // TODO: measure after deploying (photo upload → result)
};

// Our own test of the served model and the MobileNetV2 fallback, 3 classes as the app reports them.
// From ml-service/eval/results.json (scripts/evaluate.py); re-run it and update these if the model changes.
export const evaluation = {
  resultsUrl: "https://github.com/itzshazan/BlightScan/blob/main/ml-service/eval/RESULTS.md",
  lab: { name: "PlantVillage lab photos", n: 450, accuracy: 99.1, f1: 0.991, warned: 7.1, accuracyNotWarned: 100.0, fallbackAccuracy: 97.8, mcnemarP: 0.18 },
  field: { name: "PlantDoc field photos", n: 262, accuracy: 57.6, f1: 0.494, warned: 90.5, accuracyNotWarned: 84.0, fallbackAccuracy: 63.7, mcnemarP: 0.114 },
};
