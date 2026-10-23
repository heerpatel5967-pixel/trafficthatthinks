# 🚦 Traffic That Thinks (3T)
### AI-Powered Adaptive Traffic Management System
**JU Techfest 2026 | SC-01 — Track 02: Smart Cities & IoT**

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=vite)](https://github.com)
[![Simulation Invariants](https://img.shields.io/badge/Safety_Invariants-20%2F20_PASS-emerald?style=for-the-badge&logo=shield)](https://github.com)
[![Convention](https://img.shields.io/badge/Traffic_Model-Indian_LHT_(IRC:93)-cyan?style=for-the-badge)](https://github.com)
[![Stack](https://img.shields.io/badge/Stack-React_18_•_Three.js_•_TypeScript-blue?style=for-the-badge)](https://github.com)

---

## 🌟 Executive Summary

**Traffic That Thinks (3T)** is a complete, interactive, cyber-aesthetic smart-city traffic management platform built for the **JU Techfest 2026 Smart Cities & IoT track**. 

Unlike static dashboards or video mockups, **Traffic That Thinks** implements a full **closed-loop deterministic simulation cycle**:
```
Traffic Input ──► Real-Time Congestion Scoring ──► Decision-Making ──► Safe FSM Transitions ──► 3D Vehicle Kinematics ──► Empirical Metrics ──► Fixed vs Adaptive Benchmark
```

The system enforces strict **mathematical safety invariants** (only one approach green at any instant, guaranteed yellow and all-red clearance intervals) while dynamically adapting green times to live congestion and providing early upstream radar detection for emergency ambulances, fire tenders, and police cruisers.

---

## 🏛️ Official Hackathon Requirements Compliance Matrix

| # | Official Hackathon Requirement | Implementation Location | Verification / Demonstration |
|---|-------------------------------|-------------------------|------------------------------|
| **1** | Model one four-way intersection or short urban corridor | [`IntersectionGeometry.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/intersection.ts), [`SimulationRenderer.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/three/SimulationRenderer.ts) | 4-way cross junction (N, E, S, W) with multi-lane roads, stop lines, lane dividers, zebra crossings, and 3D procedural vehicle models. |
| **2** | Track vehicle counts, queue lengths, speeds, and signal phases | [`congestionScoring.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/congestionScoring.ts), [`metrics.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/metrics.ts) | Real-time continuous sampling of vehicle positions, queued vehicles (speed < 0.8 m/s), queue distance in metres, and active FSM phase. |
| **3** | Contextual factors: weather, road incidents, emergency vehicles, time of day | [`engine.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/engine.ts) | Monsoon rain reduces free-flow speed by 20%; West corridor incident halves lane capacity; peak hour arrival surges; early radar ambulance detection. |
| **4** | Recommend signal timings or route actions & explain reasons | [`adaptiveController.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/adaptiveController.ts), [`DecisionLogView.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/pages/DecisionLogView.tsx) | Transparent 50/30/20 heuristic score; bounded green duration calculation; human-readable rationale logged for every phase change and override. |
| **5** | Compare adaptive control with a fixed-timing baseline | [`ComparisonView.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/pages/ComparisonView.tsx), [`fixedController.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/fixedController.ts) | Scientific headless comparison runner executing both Fixed (25s cycle) and Adaptive AI under identical pseudo-random seeds and vehicle arrivals. |
| **6** | Measure waiting time, queue length, throughput, emergency delay | [`metrics.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/metrics.ts), [`AnalyticsView.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/pages/AnalyticsView.tsx) | Live empirical time-series charts displaying true vehicle-seconds waited, peak queue, completed exit count, and emergency stopping delay. |
| **7** | Support repeatable scenarios & produce measurable results | [`scenarioFactory.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/scenarioFactory.ts), [`ScenarioLabView.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/pages/ScenarioLabView.tsx) | 10 one-click standardized test scenarios with pinned Mulberry32 random seeds, generating 100% reproducible outcomes. |
| **8** | Clearly label simulated data, assumptions, and estimated outcomes | [`HackathonSafetyView.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/pages/HackathonSafetyView.tsx), [`SettingsView.tsx`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/pages/SettingsView.tsx) | All simulation assumptions (IDM headway, braking parameters, speed limits) are explicitly documented and distinguished from statutory Indian legal timings. |
| **9** | Never connect prototype to public traffic lights or unauthorized infrastructure | [`engine.ts`](file:///c:/Users/Lenovo/OneDrive/Desktop/traffic%20that%20thinks/src/simulation/engine.ts) | Pure local client-side mathematical simulation. Zero external API keys, zero unauthorized hardware connections, 100% safe. |

---

## 🛡️ Critical Signal Safety Invariants (FSM)

The signal controller is implemented as a strict **Finite-State Machine (FSM)**:
```
GREEN (Approach X) ──► YELLOW (Approach X, 3s) ──► ALL_RED (All 4 Red, 2s) ──► NEXT_GREEN (Approach Y)
```

### Safety Invariants Enforced on Every Tick:
1. **Mutual Exclusion:** Exactly one approach may be `GREEN` during a normal green phase. Conflicting approaches are strictly `RED`.
2. **Clearance Preservation:** Transitions NEVER skip `YELLOW` clearance or `ALL_RED` clearance, even during emergency preemption requests.
3. **Starvation Prevention:** Corridors waiting longer than 45–55 seconds receive automated priority boosts to prevent traffic stagnation.
4. **Failsafe Invariant Sentinel:** If conflicting signals are ever commanded, the intersection instantly defaults to `ALL_RED`, freezes vehicle entries, and logs a critical fault.

---

## 🚑 Emergency Vehicle Early Detection & Priority Preemption

When an ambulance, fire engine, or police vehicle enters the upstream radar zone (configurable 60m–250m):
1. **Detection:** Radar registers vehicle type, speed, distance to stop line, and calculated arrival time (ETA).
2. **Safe Preemption Transition:** 
   - If the emergency approach is already green, green is held until the vehicle clears.
   - If another approach is green, the controller immediately commands safe `YELLOW` (3s) $\to$ `ALL_RED` (2s) $\to$ `GREEN` for the emergency approach.
3. **Corridor Lock:** Conflicting approaches remain locked at `RED`. The 3D view renders a glowing green priority corridor.
4. **Clearance & Handback:** Once the emergency vehicle clears the conflict box, normal adaptive control resumes seamlessly.
5. **Multi-Emergency Priority:** Tier 1 (Ambulance) > Tier 2 (Fire Tender) > Tier 3 (Police Convoy). Conflicting emergency vehicles are safely serviced in sequence.

---

## 📐 Transparent Congestion Scoring Formula

Unlike uninspectable "black-box" models, **Traffic That Thinks** calculates an auditable, normalized composite score ($0 - 100$) for every approach:

$$\text{Congestion Score} = (0.50 \times \text{Queue Severity}) + (0.30 \times \text{Volume Score}) + (0.20 \times \text{Speed Reduction})$$

Where:
- $\text{Queue Severity} = \min\left(100, \frac{\text{Queue Count}}{\text{Max Queue Capacity}} \times 100 \times \text{Incident Factor}\right)$
- $\text{Volume Score} = \min\left(100, \frac{\text{Vehicle Count on Approach}}{\text{Max Approach Capacity}} \times 100\right)$
- $\text{Speed Reduction} = \min\left(100, \frac{v_{\text{free}} - v_{\text{avg}}}{v_{\text{free}}} \times 100\right)$

Bounded Green Allocation:
$$\text{Allocated Green} = \text{clamp}\left(\text{MinGreen} + \frac{\text{Score}}{100} \times (\text{MaxGreen} - \text{MinGreen}), \text{MinGreen}, \text{MaxGreen}\right)$$

---

## 🇮🇳 Indian Traffic Safety Model & Standards

1. **Left-Hand Traffic (LHT):** Implements Indian driving convention pursuant to the **Indian Motor Vehicles Act, 1988 (Section 119)** and the **Rules of the Road Regulations, 1989**.
2. **Vehicle Distribution:** Features realistic Indian urban vehicle distributions: cars (50%), two-wheelers/motorcycles (20%), auto-rickshaws (15%), buses (10%), commercial trucks (5%).
3. **Signal Guidelines:** Conforms to **IRC:93-1985 Guidelines on Traffic Signals** and **IRC:67-2012 Code of Practice for Road Signs**.
4. **Emergency Right-of-Way:** Aligns with Central Motor Vehicles Rules regarding emergency corridor clearance.

---

## 💻 Tech Stack & Architecture

- **Frontend Framework:** React 18 with TypeScript and Vite 5.
- **3D Graphics Engine:** Three.js with procedural low-poly Indian vehicle meshes, animated traffic lights, radar sweep rings, and dynamic lighting.
- **Hardware Fallback:** High-performance HTML5 2D Canvas Radar simulation for low-end devices.
- **Styling:** Vanilla CSS & Tailwind CSS with smart city cyber-command design tokens.
- **Charts & Telemetry:** Recharts for empirical time-series analysis.
- **Icons:** Lucide React.
- **Persistence:** LocalStorage with safe error handling.

---

## 🚀 Installation & Local Development

### Prerequisites:
- Node.js LTS (v18, v20, or higher)
- NPM or PNPM

### Steps:
```bash
# 1. Clone repository
git clone https://github.com/your-username/traffic-that-thinks.git
cd "traffic that thinks"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Build Production Bundle:
```bash
npm run build
```
The compiled, minified bundle will be output to the `dist/` directory, ready for instant static deployment to Vercel, Netlify, or GitHub Pages.

---

## ☁️ Vercel Deployment Instructions

1. Push this repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your `traffic-that-thinks` repository.
4. Keep the default settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **"Deploy"**. The application will be live with full WebGL support in under 60 seconds!

---

## 🧪 Automated 20-Invariant Self-Test Suite

Click the **"Self-Test"** button in the top navigation bar to execute the live 20-point invariant test suite:
1. Signal Mutual Exclusion at initialization.
2. Conflict Matrix rejection of simultaneous greens.
3. Safe Yellow transition clearance enforcement.
4. All-Red clearance interval verification (all 4 approaches red).
5. Mulberry32 PRNG seed reproducibility.
6. Intelligent Driver Model (IDM) acceleration clamp.
7. Stop line deceleration on RED signal.
8. Upstream radar early detection trigger.
9. Outgoing phase clearance before emergency green.
10. Transparent 0–100 bounded congestion scoring.
11. Emergency clearance restoring normal adaptive control.
12. Indian Left-Hand Traffic coordinate positioning.
13. Multi-emergency arbitration (Ambulance > Police).
14. Starvation prevention tracking timers.
15. Numerical telemetry stability (zero NaN or infinite metrics).
16. Throughput strictly counting completed exits.
17. Scenario Factory loading all 10 scenarios.
18. Monsoon weather speed reduction modifier.
19. Road incident lane blockage capacity reduction.
20. Safe isolated simulated prototype boundary verification.

---

## 🎯 3-Minute Hackathon Demonstration Guide

1. **Overview Dashboard (0:00 - 0:45):**
   - Introduce **Traffic That Thinks** as an AI-powered adaptive management prototype for Smart Cities.
   - Point out live KPI cards, master simulation clock, and active signal phase badge.
   - Show the 4-approach congestion gauges calculating scores in real time.
2. **Live 3D Simulation & Radar (0:45 - 1:30):**
   - Switch to **Live 3D Simulation**. Orbit the 3D intersection, switch to Top-Down and Curb POV camera presets.
   - Toggle to **2D Radar** view to demonstrate hardware-independent fallback.
3. **Emergency Preemption Wave (1:30 - 2:15):**
   - Navigate to **Emergency Command** or click "East Ambulance" in the navbar.
   - Highlight the radar detection at 150m, observe the safe yellow clearance on conflicting approaches, and watch the emergency green wave illuminate.
4. **Fixed vs. Adaptive Comparison Benchmark (2:15 - 3:00):**
   - Navigate to **Fixed vs Adaptive Comparison**.
   - Click **"Execute Match Benchmark"**. Explain that both controllers run the exact same seed and arrival sequence.
   - Review the calculated improvements in average waiting time and throughput, and download the verified CSV test log.

---

## 📄 License & Attribution

Developed for **JU Techfest 2026 | SC-01 — Track 02: Smart Cities & IoT**.  
Licensed under the **MIT License**.
