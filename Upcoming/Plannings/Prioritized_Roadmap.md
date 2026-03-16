# Prioritized Implementation Roadmap

This roadmap organizes the **Optimal MVP Plan** into actionable phases, prioritized by immediate user utility and implementation feasibility.

## 🏆 Priority 0: The "Killer" Feature (Next Immediate Steps)
### 1. Bus Spott (Virtual Radar)
- **Relevance**: 10/10 (Highest frequency problem in Kerala wards)
- **Status**: Planning complete. Ready for implementation.
- **Key Task**: Add "Route Name" & "Direction" inputs to Traffic posts.

## 🥈 Priority 1: Direct Social Value
### 2. Market Price Intelligence
- **Relevance**: 9/10 (Daily economic utility)
- **Status**: Planning complete.
- **Key Task**: Add numeric "Price" field to Market category and implement client-side daily average logic.

## 🥉 Priority 2: Social Trust & Accountability
### 3. Grievance Audit
- **Relevance**: 7/10 (High impact, but lower frequency than Transit/Market)
- **Status**: Planning complete.
- **Key Task**: Add `[Pending / Resolved]` status toggles and visual indicators (Red/Green).

---

## 📅 Execution Phases

### **Phase 1: Ultra-Lite (Dev Preview)**
*Focus: Data Capture*
- [ ] Add `busRoute` and `direction` to Traffic posts.
- [ ] Add `price` and `unit` to Market posts.
- [ ] Implement simple card indicators for the above.

### **Phase 2: Automation (The "Magic" Phase)**
*Focus: Automated Utility*
- [ ] **Bus Radar**: Implement 20-min auto-decay and countdown progress bar.
- [ ] **Market Index**: Implement client-side daily average ticker.
- [ ] **Audit Trail**: Implement "Resolved" status logic.

### **Phase 3: Safety & Scale (Community Build)**
*Focus: Trust Guardrails*
- [ ] **3-Flag Rule**: Automated hide-logic after 3 reports.
- [ ] **Proximity Gating**: Limit "Me Too" actions by distance.
- [ ] **Karma Velocity**: Add cooldowns to prevent spamming.

---
*Next Action: Begin Phase 1 - Bus Spott Lite Implementation.*
