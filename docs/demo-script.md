# 3-minute demo script

Before the pitch: `npm run dev` (or `npm run build && npm start`), open `http://localhost:3000` in
a fresh browser profile. Set `MOSAIC_AI=off` if the Wi-Fi is unreliable; everything below works
offline. In a second tab, open `/teacher`, click **Load a sample class** and **Add sample AI drafts**.

| Time | Screen | Say | Do |
|---|---|---|---|
| 0:00 | Landing | "Every student learns differently, but every textbook teaches the same way. Galileo's question: which lands first?" | Pick **Bowling ball** → **Drop them**. Then **Now add air** → drop again. |
| 0:25 | Landing, learners section | "Mosaic doesn't ask you to label yourself. It watches what you do and shapes the same lesson for you." | Click **Deep diver**, **Quick answers**, **Hands-on**. |
| 0:45 | Home (`/dashboard`) | "One clear next step, and the loop: knows you, teaches by doing, finds weak spots, plans your path." | **Load a demo week**. Point at "You are here" and the learning mix. |
| 1:05 | Simulation Lab | "Ask any science question. An agent builds the experiment, and the engine checks the AI's answer key before you see it." | Type a question in **Ask for any experiment**, open **How it was built**. Then open *Throwing on the Moon*, drag the cannon. |
| 1:35 | Pip | "Pip only answers from your lecture, cites the slide, and gives hints, not answers." | **Ask Pip** → a starter question → **Give me a hint** → switch to 🎮 **Quest**. Ask "How do I fix my bike?" to show the pause for the lecturer. |
| 2:05 | Planner | "Exams in 12 days: sessions sized to her 10-minute focus span, extra time on forces, a 2-minute first step." | `/planner` → **Load demo exams** → **Start with 2 minutes**. |
| 2:25 | Teacher Studio | "Teachers see the class, never the child: 64% predicted the heavy ball lands first. And every AI experiment can need their approval." | `/teacher`: misconceptions → **Questions for you** → **Experiment reviews** → approve one. |
| 2:50 | Close | "Not another tool that summarises your notes. It teaches by doing, knows you, and plans your path." | Back to the landing page. |

## Likely questions

- **"Isn't 'learning styles' debunked?"** Yes, fixed styles are. Mosaic adapts to *what works*, measured from behaviour and results, shows the evidence, and lets students disagree.
- **"How do you stop hallucinations?"** The AI never writes simulation code or answer keys: it picks a tested model, and the engine computes the answer and rejects any explanation that disagrees. Pip answers only from retrieved slides, and invented citations are removed.
- **"What if the AI is down before an exam?"** Offline mode: the closest ready-made experiment and slide-grounded coaching. No key needed.
- **"Privacy with under-18s?"** Consent gate, data on the device with export and delete, no diagnosis ever, teachers see counts only with a minimum group of 5.
- **"How does it scale?"** Specs are data, so new topics are new specs, not new code; the MCP server lets any AI client build and run experiments.
