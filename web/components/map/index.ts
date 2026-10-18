"use client";
import dynamic from "next/dynamic";
import { createElement } from "react";

const loading = () => createElement("div", { className: "h-full min-h-[18rem] w-full animate-pulse bg-ink/[0.06]" });

export const PinMap = dynamic(() => import("./leaflet-map").then((m) => m.PinMap), { ssr: false, loading });
export const RiskMap = dynamic(() => import("./leaflet-map").then((m) => m.RiskMap), { ssr: false, loading });
