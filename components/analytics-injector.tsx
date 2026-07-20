"use client";

import { useEffect, useState } from "react";

interface AnalyticsCounter {
  id: string;
  name: string;
  code: string;
}

export function AnalyticsInjector() {
  const [counters, setCounters] = useState<AnalyticsCounter[]>([]);

  useEffect(() => {
    fetch("/api/analytics-counters")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCounters(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (counters.length === 0) return;

    const cleanupFns: (() => void)[] = [];

    for (const counter of counters) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "none";
      wrapper.innerHTML = counter.code;

      const scripts = wrapper.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        for (const attr of oldScript.attributes) {
          newScript.setAttribute(attr.name, attr.value);
        }
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        cleanupFns.push(() => newScript.remove());
      });

      const noscripts = wrapper.querySelectorAll("noscript");
      noscripts.forEach((noscript) => {
        const fragment = document.createElement("div");
        fragment.innerHTML = noscript.innerHTML;
        const img = fragment.querySelector("img");
        if (img) {
          document.body.appendChild(img);
          cleanupFns.push(() => img.remove());
        }
      });
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [counters]);

  return null;
}
