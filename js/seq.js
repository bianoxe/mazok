function sanitizeSeq(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length && out.length < SEQ_MAX; i++) {
    const step = raw[i];
    if (!step || typeof step !== "object") continue;
    if (step.t === "boss" && BOSSES.some(b => b.id === step.id)) out.push({ t: "boss", id: step.id });
    else if (step.t === "wood") {
      const id = step.id | 0;
      if (id >= 0 && id < THEMES.length) out.push({ t: "wood", id });
    }
  }
  return out;
}
save.seq = sanitizeSeq(save.seq);

