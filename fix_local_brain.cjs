const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `  // AMD PO3 Rule
  if (smc.amdPattern === 'BULLISH') {
      totalScore += 5; // AMD has very high priority for zero floating entry
  } else if (smc.amdPattern === 'BEARISH') {
      totalScore -= 5;
  }`;

const replacement = `  // AMD PO3 Rule
  if (smc.amdPattern === 'BULLISH') {
      totalScore += 5; // AMD has very high priority for zero floating entry
  } else if (smc.amdPattern === 'BEARISH') {
      totalScore -= 5;
  }

  // ICT Quarterly Theory (AMDX / XAMD)
  if (smc.quarterlyTheory === 'AMDX_BULLISH' || smc.quarterlyTheory === 'XAMD_BULLISH') {
      totalScore += 6;
  } else if (smc.quarterlyTheory === 'AMDX_BEARISH' || smc.quarterlyTheory === 'XAMD_BEARISH') {
      totalScore -= 6;
  }`;

code = code.replace(target, replacement);

const targetNarrative = `    let layer4 = \`[FinLLM-B & Transformer Models - THE STRATEGIST]: Deteksi False Breakout & analisa market struktural kompleks Multi-TF (Topscore SMC). Market Phase: \${smc.phase}. LLM-reasoning ML Gating Confidence: \${structureConfidence}%.\`;`;
const replacementNarrative = `    let layer4 = \`[FinLLM-B & Transformer Models - THE STRATEGIST]: Deteksi False Breakout & analisa market struktural kompleks Multi-TF (Topscore SMC). \${smc.quarterlyTheory !== 'NONE' ? \`Terdeteksi ICT Quarterly Theory (\${smc.quarterlyTheory.replace('_', ' ')}). Siklus Manipulasi/Judas Swing telah selesai dan siap distribusi.\` : \`Market Phase: \${smc.phase}.\`} LLM-reasoning ML Gating Confidence: \${structureConfidence}%.\`;`;

code = code.replace(targetNarrative, replacementNarrative);

fs.writeFileSync(file, code);
