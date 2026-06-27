# **AccessAI — Product Context Document**

**Hackathon:** Grab the Future Hackathon | June 27–28, 2026 **Team Stack:** PostgreSQL · React Native · Node.js **Document type:** Product context & user case specification

---

## **Table of Contents**

1. [Problem Statement](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#1-problem-statement)  
2. [Target Users](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#2-target-users)  
3. [Solution Overview](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#3-solution-overview)  
4. [Key Assumptions](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#4-key-assumptions)  
5. [Feature Scope](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#5-feature-scope)  
   * 5.1 [Must-Have Features](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#51-must-have-features)  
   * 5.2 [Nice-to-Have Features](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#52-nice-to-have-features)  
6. [System Architecture & Data Sources](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#6-system-architecture--data-sources)  
7. [AI Layer](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#7-ai-layer)  
8. [Partner Integration Model](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#8-partner-integration-model)  
9. [Driver & Restaurant Notification System](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#9-driver--restaurant-notification-system)  
10. [Reward & Incentive System](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#10-reward--incentive-system)  
11. [Post-Delivery Experience](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#11-post-delivery-experience)  
12. [Tech Stack & AI Tools](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#12-tech-stack--ai-tools)  
13. [End-to-End User Flow](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#13-end-to-end-user-flow)  
14. [SDG & Sustainability Alignment](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#14-sdg--sustainability-alignment)  
15. [Demo Strategy (36-hour scope)](https://claude.ai/chat/a6caf1cc-331f-49bc-b3be-2f3817535f9d#15-demo-strategy-36-hour-scope)

---

## **1\. Problem Statement**

Vietnam has over **6.2 million people living with disabilities** (approximately 7% of the population), including individuals with visual impairments, limb differences, and motor disabilities. The rapid digitization of urban services — food delivery, ride-hailing, logistics — has created a paradox: the more sophisticated these apps become, the less accessible they are to people who need them most.

Current super-apps like Grab, ShopeeFood, Be, and XanhSM are designed around:

* Complex multi-tap navigation flows  
* Small visual buttons and icon-heavy interfaces  
* Minimal or absent voice interaction  
* No accommodation for users who cannot use a touchscreen reliably

As a result, **disabled individuals in Vietnamese cities are effectively excluded from the digital urban economy**, unable to independently order food, book a ride, or access delivery services without relying on another person. This is not just a UX inconvenience — it is a structural barrier to independence and dignity in daily life.

---

## **2\. Target Users**

### **Primary User: People with Disabilities**

| User Type | Specific Barrier |
| ----- | ----- |
| Visually impaired / blind users | Cannot navigate visual interfaces; no reliable way to read menus, confirm orders, or track delivery |
| Users with missing or limited hand function (e.g., limb loss, cerebral palsy) | Cannot perform multi-tap/swipe gestures required by standard apps |
| Users with low digital literacy combined with physical disability | Doubly excluded from current UI paradigms |

**Disability toggle:** Users can optionally self-identify as a person with a disability. This toggle unlocks enhanced accommodations from partner drivers and restaurants — but it is never mandatory and never shared without consent.

### **Secondary User: Mainstream "Hands-Free" Users**

Any user who prefers or requires hands-free interaction:

* People driving or on a motorbike who want to place an order  
* People cooking, exercising, or otherwise occupied  
* Users who simply want a faster, lower-friction ordering experience

**Key design principle:** The app must work flawlessly for the primary user group, while remaining fully usable — and preferable — for mainstream users. The accessibility layer is the product, not a separate mode.

---

## **3\. Solution Overview**

**AccessAI** is a third-party mobile application (React Native, iOS & Android) that sits on top of existing urban service platforms — Grab, Be, XanhSM, ShopeeFood — and provides a **fully voice-driven interface** for ordering food and booking rides.

Rather than replacing these platforms, AccessAI acts as an **accessibility layer and intelligent agent**: the user speaks their intent, the AI validates and processes the request, and the order is placed through the partner platform's API. The partner platform handles fulfillment; AccessAI handles the human interface.

The experience is designed so that a blind person can, from unlock to delivery, **never have to touch a button** — every interaction is mediated by voice and conversational AI.

**Core proposition in one sentence:**

*AccessAI lets any person — blind, limbless, or simply hands-free — order food and book rides through natural conversation, while ensuring drivers and restaurants know exactly how to serve them.*

---

## **4\. Key Assumptions**

The following assumptions underpin the product and must be validated or caveat-ed in the pitch:

| \# | Assumption | Risk Level | Mitigation |
| ----- | ----- | ----- | ----- |
| 1 | **API access:** Grab, Be, XanhSM, or ShopeeFood would enter a partnership to provide API access (menu data, order placement, driver data, tracking) to AccessAI | High | Demo uses mock data; pitch frames this as "pending partnership." Grab's presence as organizer makes this a direct pitch opportunity. |
| 2 | **Voice accuracy in Vietnamese:** AI voice recognition performs reliably in Vietnamese, including regional accents and disability-related speech patterns | Medium | Use Whisper or Google STT which have strong Vietnamese support; add manual fallback input |
| 3 | **Driver willingness:** Grab/Be drivers will comply with accessibility notifications and deliver to the door when flagged | Medium | Incentive system (bonus points/rating boost) addresses compliance; platform enforcement is a partnership term |
| 4 | **Restaurant compliance:** Restaurants notified of a disabled customer will take extra care with confirmation and communication | Medium | Notification is informational only; no workflow change required from the restaurant side initially |
| 5 | **User willingness to self-disclose:** Disabled users are comfortable toggling the disability flag | Low | Toggle is optional, off by default, and framed positively ("unlock enhanced service") |
| 6 | **Mobile OS accessibility compatibility:** React Native app works seamlessly with iOS VoiceOver and Android TalkBack | Low | Standard practice; testable in 36 hours |

---

## **5\. Feature Scope**

### **5.1 Must-Have Features**

These define the MVP and must be demonstrable — even with mock data — by Day 2 submission.

#### **M1 — Voice-First Ordering Interface**

* User activates the app with a wake phrase or single tap  
* Full conversation flow: "I want to order pho from \[restaurant\]" → AI confirms, reads back details, asks for address confirmation → places order  
* All outputs are spoken back via Text-to-Speech (TTS), never requiring the user to read a screen  
* Every app state is narrated: "Your order has been placed. Estimated arrival: 25 minutes."

#### **M2 — AI Validation Layer**

Before confirming any order, the AI performs the following checks using data from the partner API (or mock data in demo):

| Check | AI Response |
| ----- | ----- |
| Menu item availability | Reads available alternatives if item is sold out |
| Restaurant open/closed status | Notifies user; offers nearest alternative |
| Estimated wait time | Reads out time and confirms with user |
| Address confirmation | Reads back delivery address, asks user to confirm verbally |
| Order summary | Full read-back before final confirmation |

#### **M3 — Disability Toggle & Partner Notification**

* User profile includes an optional "I have a disability" toggle with sub-options (visual impairment, mobility impairment, other)  
* When enabled: partner platform (via API) receives a flag on the order  
* Driver app receives a push notification: *"This customer has a visual/mobility impairment. Please deliver to the door and verbally confirm handoff."*  
* Restaurant receives a notification: *"Customer has a disability. Please double-check order completeness and packaging."*

#### **M4 — Platform Linking (OAuth / Partner API)**

* User links their existing Grab / ShopeeFood / Be account via OAuth or credential-sharing flow  
* AccessAI retrieves: saved addresses, payment methods, order history, and live menu/driver data  
* All actual payments are processed through the linked platform (AccessAI does not handle payments in MVP)

#### **M5 — Real-Time Order Tracking via Voice**

* Order status updates are pushed to the user as audio notifications: "Your driver has picked up your order." / "Your driver is 5 minutes away."  
* No need to open the app or look at a screen after placing the order

---

### **5.2 Nice-to-Have Features**

These are designed and specced but may appear in demo as planned features, not necessarily live code.

#### **N1 — Adaptive Alert Sounds**

* Distinct audio signatures for different events: order confirmed, driver approaching, driver cancelled, item unavailable  
* Tuned to be distinguishable without visual context (different tones, rhythms, spoken labels)

#### **N2 — Driver Cancellation Recovery Flow**

If the assigned driver cancels after pickup:

1. Immediate audio alert to user  
2. AI automatically initiates rebook flow: "Your driver cancelled. I'm finding a new driver — shall I continue?"  
3. User confirms or declines via voice  
4. If rebook fails: AI offers to cancel and get a refund, or switch to another platform (e.g., from Grab to Be)

#### **N3 — Restaurant Sold-Out Recovery Flow**

If a menu item becomes unavailable after order placement:

1. Restaurant notifies platform; platform pushes update to AccessAI  
2. AI alerts user: "The restaurant says \[item\] is no longer available. They suggest \[alternative\]. Shall I update your order?"  
3. User can accept, choose differently, or cancel — all by voice

#### **N4 — Ride-Hailing Integration**

Same voice-first flow for booking transport (GrabCar, XanhSM, BeBike):

* "Book me a ride from here to \[destination\]"  
* Driver notification that passenger has a disability  
* Driver instructed to verbally announce arrival and assist with entry/exit

#### **N5 — Voice-Driven Rating & Review**

After delivery:

1. App prompts: "How was your experience? You can say 'great', 'okay', or 'bad', or describe what happened."  
2. AI converts speech to structured rating \+ written review  
3. Submitted to the partner platform under the user's account

#### **N6 — Emergency Contact Fallback**

* If a ride booking is flagged as in-progress and the user doesn't confirm arrival within a set window, app pings an emergency contact  
* Designed for independent travel safety for visually impaired users

---

## **6\. System Architecture & Data Sources**

┌─────────────────────────────────────────────────────┐  
│                  AccessAI Mobile App                │  
│              (React Native — iOS & Android)         │  
│                                                     │  
│  ┌─────────────┐    ┌──────────────────────────┐   │  
│  │ Voice Input │───▶│   AI Conversation Layer  │   │  
│  │  (Mic/STT)  │    │  (Intent \+ Validation)   │   │  
│  └─────────────┘    └──────────┬───────────────┘   │  
│                                │                   │  
│  ┌─────────────────────────────▼───────────────┐   │  
│  │           AccessAI Backend (Node.js)        │   │  
│  │  Order logic · Notification dispatch ·      │   │  
│  │  User profiles · Partner API orchestration  │   │  
│  └─────────────┬───────────────────────────────┘   │  
│                │                                   │  
│  ┌─────────────▼──────────────┐                    │  
│  │   PostgreSQL Database      │                    │  
│  │  Users · Orders · Prefs ·  │                    │  
│  │  Linked accounts · Logs    │                    │  
│  └────────────────────────────┘                    │  
└────────────────────┬────────────────────────────────┘  
                     │ API calls (mock or live)  
        ┌────────────┼────────────────┐  
        │            │                │  
   ┌────▼───┐  ┌─────▼─────┐  ┌──────▼──────┐  
   │  Grab  │  │ ShopeeFood│  │  Be / XanhSM│  
   │  API   │  │   API     │  │    API      │  
   └────────┘  └───────────┘  └─────────────┘  
        (Menu data · Driver data · Order placement · Tracking)

### **Data AccessAI Consumes from Partners**

| Data Type | Used For |
| ----- | ----- |
| Restaurant list \+ menu \+ availability | AI reads menu options to user |
| Driver location \+ ETA | Real-time voice updates |
| Order status events | Push audio notifications |
| User's saved addresses | Address confirmation flow |
| User's linked payment method | Passed through to partner for payment |
| Driver profile (name, rating) | Read back to user before confirming ride |

---

## **7\. AI Layer**

### **7.1 Speech-to-Text (STT)**

* **Primary:** OpenAI Whisper API (strong Vietnamese support, handles accents)  
* **Fallback:** Google Cloud Speech-to-Text v2

### **7.2 Conversational AI (Intent Understanding & Dialogue)**

* **Model:** Claude claude-sonnet-4-6 (via Anthropic API) or GPT-4o  
* Prompt-engineered for:  
  * Intent classification: order food / book ride / track order / cancel / rate  
  * Entity extraction: restaurant name, dish name, quantity, address, time  
  * Validation dialogue: asking clarifying questions when intent is ambiguous  
  * Error recovery: gracefully handling misrecognition ("I didn't catch that — did you say Phở Hà Nội or Phở Sài Gòn?")  
  * Accessibility-first tone: patient, confirmation-heavy, non-visual descriptions only

### **7.3 Text-to-Speech (TTS)**

* **Primary:** ElevenLabs or Google Cloud TTS (natural Vietnamese voice)  
* All app states output audio: menus, confirmations, errors, notifications

### **7.4 AI Validation Checklist (runs on every order before confirmation)**

1\. Is the restaurant currently open?         → \[YES / NO \+ alternative\]  
2\. Is the requested item available?          → \[YES / NO \+ alternative\]  
3\. Is there an available driver nearby?      → \[YES / ETA alert\]  
4\. Is the delivery address parseable?        → \[YES / ask user to clarify\]  
5\. Is the order total confirmed by user?     → \[AWAITING VOICE CONFIRMATION\]

---

## **8\. Partner Integration Model**

### **Integration Approach (For Demo: Simulated via Mock Data)**

In the MVP demo, AccessAI simulates the partner API layer with realistic mock data:

* Static JSON files representing Grab restaurant listings, menu items, and driver objects  
* A mock order state machine that progresses through: `placed → accepted → in-transit → delivered`  
* Timed mock events: driver cancellation, item sold-out, ETA update

**Pitch framing for judges:** "This is what the integration looks like with Grab's API. We've built the full flow — the only missing piece is a live API key, which would come from the partnership."

### **What AccessAI Needs from Partners (Partnership Ask)**

| Data / Capability | Why AccessAI Needs It |
| ----- | ----- |
| Read access: restaurant catalog \+ menus | To let AI describe food options to blind users |
| Read access: real-time item availability | To validate orders before confirming |
| Write access: place order on behalf of user | Core order flow |
| Read access: live driver location \+ ETA | Voice updates ("5 minutes away") |
| Push: order status webhooks | Trigger audio alerts |
| Write access: attach metadata to order | Disability flag, door-delivery instruction |
| Driver app: receive custom push notifications | Notify driver of accessibility need |

---

## **9\. Driver & Restaurant Notification System**

### **When the Disability Toggle is ON**

**Driver receives (via push notification to the Grab/Be driver app):**

📢 Accessibility Notice  
Your next customer has indicated a visual or mobility impairment.  
Please:  
✓ Call or message when you arrive  
✓ Deliver directly to their door (do not leave at lobby)  
✓ Wait for verbal confirmation of receipt  
✓ Extra care earns bonus AccessPoints (+50 pts this trip)

**Restaurant receives (via partner API order metadata or direct notification):**

📢 Order Note — Accessibility Customer  
This order is for a customer with a disability.  
Please:  
✓ Double-check order accuracy before dispatch  
✓ Ensure secure packaging (items won't be opened until customer can verify by touch/voice)  
✓ Notify delivery platform immediately if any item is unavailable

### **When the Disability Toggle is OFF**

* No special notifications are sent to driver or restaurant  
* App still functions fully voice-first for mainstream users  
* User experience is identical; accessibility accommodations are simply not triggered

---

## **10\. Reward & Incentive System**

### **Driver Incentive: AccessPoints**

When a driver fulfills an order flagged as an accessibility order **and** the user gives a positive voice rating:

| Action | Points Awarded |
| ----- | ----- |
| Delivering to the door (not lobby) | \+30 AccessPoints |
| Calling/messaging customer on arrival | \+20 AccessPoints |
| User rates the delivery 5 stars | \+50 AccessPoints |
| Completing 10 accessibility orders in a month | Bronze Accessibility Badge |
| Completing 50 accessibility orders | Silver Accessibility Badge \+ platform bonus (partner-negotiated) |

AccessPoints are tracked in the AccessAI backend and reported to the partner platform for reward redemption (pending partnership agreement). In the demo, this is shown as a driver-facing leaderboard UI.

### **Why This Works**

* Drivers are financially incentivized to go the extra step — this is not charity, it's a structured reward  
* The badge system creates visible social recognition within the driver community  
* Aligns with Grab's existing GrabRewards ecosystem

---

## **11\. Post-Delivery Experience**

Once the driver confirms handoff (or the user verbally confirms receipt):

### **Step 1 — Delivery Confirmation**

* App announces: *"Your order has arrived. Your driver, \[Name\], has confirmed delivery."*  
* If user doesn't respond within 3 minutes: AI prompts *"Did you receive your order? Please say yes or no."*

### **Step 2 — Voice Rating**

* AI immediately prompts: *"How was your experience today? You can say: great, okay, or bad — or tell me what happened."*  
* User speaks freely; AI extracts sentiment and structures it into a 1–5 star rating \+ short text review  
* Review is submitted to the partner platform under the user's account

### **Step 3 — Proactive Follow-Up Suggestions**

After a completed food delivery:

* *"Would you like to order again from \[restaurant\] next time, or try something new?"*  
* AI can add restaurant to a "Favourites" list for faster future ordering (single-phrase reorder: "Order my usual from Phở Hà Nội")

After a completed ride:

* *"You've arrived at \[destination\]. Is there anything else I can help you with?"*  
* If user doesn't respond: emergency contact ping flow (see N6 above)

### **Step 4 — Loyalty & History**

* Every completed order is logged in the user's AccessAI profile  
* User can ask: *"What did I order last week?"* or *"Reorder what I had on Monday"*  
* Builds a personalized model of the user's preferences over time (preferred restaurants, dietary restrictions, common destinations)

### **Step 5 — Feedback Loop for Platform Partners**

* Aggregated (anonymized) data on accessibility order fulfillment rates, cancellation rates, and ratings are shared with partner platforms  
* This gives Grab/Be/ShopeeFood visibility into how well their drivers serve the accessibility segment — creating business incentive to improve

---

## **12\. Tech Stack & AI Tools**

### **Core Stack**

| Layer | Technology | Role |
| ----- | ----- | ----- |
| Mobile | React Native (Expo) | Cross-platform iOS & Android app |
| Backend | Node.js (Express or Fastify) | API server, order orchestration, notification dispatch |
| Database | PostgreSQL | User profiles, order history, linked accounts, driver points |
| Auth | OAuth 2.0 | Partner platform account linking |
| Realtime | Socket.io or Supabase Realtime | Push order status updates to app |

### **AI & Voice Stack**

| Capability | Tool | Notes |
| ----- | ----- | ----- |
| Speech-to-Text | OpenAI Whisper API | Best Vietnamese support |
| Conversational AI | Anthropic Claude API (claude-sonnet-4-6) | Intent parsing, validation dialogue |
| Text-to-Speech | Google Cloud TTS (Vietnamese voice) | Natural, low-latency audio output |
| Fallback STT | Google Cloud Speech-to-Text v2 | If Whisper latency is high |

### **Infrastructure (Demo Scale)**

| Service | Tool |
| ----- | ----- |
| Hosting | Railway or Render (Node.js backend) |
| Database | Supabase (managed PostgreSQL) |
| Mock API | JSON Server or static Express routes |
| Push Notifications | Expo Push Notifications |
| Demo environment | Ngrok for local tunneling if needed |

### **AI Tools Used During Development (to disclose in repo)**

* **Claude / ChatGPT** — code generation, prompt engineering, documentation  
* **GitHub Copilot** — autocomplete during development  
* **v0 / Cursor** — UI scaffolding

All AI tools will be disclosed in `DISCLOSURE.md` in the GitHub repository per hackathon requirements.

---

## **13\. End-to-End User Flow**

### **Phase 0 — Partnership & Setup (Pre-conditions)**

AccessAI ←──────────── API Agreement ────────────→ Grab / Be / ShopeeFood / XanhSM  
                ↓  
    App receives: OAuth credentials · Menu API · Order placement API  
                  Driver notification API · Webhook subscriptions for order events

**In the demo:** All partner API calls are replaced with realistic mock data. The integration points are clearly labeled in the code and demo as "pending partnership."

---

### **Phase 1 — Onboarding**

User opens AccessAI  
        │  
        ▼  
Voice welcome: "Welcome to AccessAI. Let's get you set up."  
        │  
        ▼  
Link existing account: "Which platform do you use? Say: Grab, ShopeeFood, Be, or XanhSM."  
        │  
        ▼  
OAuth flow (or mock credential input in demo)  
        │  
        ▼  
AccessAI retrieves: saved addresses · payment method · order history  
        │  
        ▼  
Disability toggle prompt: "Do you want drivers and restaurants to know you have a disability,  
                           so they can give you extra help? Say yes or no."  
        │  
   ┌────┴────┐  
  YES       NO  
   │         │  
Toggle ON  Toggle OFF  
(flag set  (no change,  
 in profile) app works  
            same way)

---

### **Phase 2 — Ordering Food (Primary Flow)**

User says: "I want to order food"  
        │  
        ▼  
AI: "What are you in the mood for, or do you have a restaurant in mind?"  
        │  
        ▼  
User says: "Phở from Phở Hà Nội"  
        │  
        ▼  
AI calls partner API (mock):  
  ├── Is restaurant open?           → YES  
  ├── Is phở available?             → YES  
  └── Estimated delivery time?      → 28 minutes  
        │  
        ▼  
AI: "Phở Hà Nội is open. They have Phở Bò Tái for 65,000 VND and Phở Gà for 55,000 VND.  
     Which would you like?"  
        │  
        ▼  
User says: "Phở Bò Tái, one bowl"  
        │  
        ▼  
AI: "Got it. One Phở Bò Tái for 65,000 VND, delivered to \[saved address\].  
     Payment through your linked Grab account. Shall I confirm?"  
        │  
        ▼  
User says: "Yes"  
        │  
        ▼  
\[IF DISABILITY TOGGLE ON\]  
AccessAI places order via partner API with metadata:  
  \- accessibility\_flag: true  
  \- delivery\_instruction: "Customer has disability. Deliver to door. Verbal confirmation required."  
  \- restaurant\_note: "Accessibility order. Confirm item availability and packaging."  
        │  
        ▼  
Driver receives push notification (accessibility instructions \+ bonus points notice)  
Restaurant receives notification (double-check order \+ packaging)  
        │  
        ▼  
AI: "Your order is confirmed\! Your driver will be assigned shortly.  
     I'll let you know when they're on the way."

---

### **Phase 3 — Real-Time Tracking (Hands-Free)**

\[Order accepted by driver\]  
        │  
AI notifies: "Good news — a driver has accepted your order. They'll arrive in about 28 minutes."  
        │  
\[Driver picks up order\]  
        │  
AI notifies: "Your driver \[Name\] has picked up your food and is on the way."  
        │  
\[Driver 5 minutes away — geofence trigger\]  
        │  
AI notifies: "Your driver is about 5 minutes away. Head to your door when ready."  
        │  
\[EXCEPTION: Driver cancels\]  
        │  
AI: "Your driver just cancelled. I'm looking for a new driver — shall I continue?"  
   ├── User: "Yes" → Rebook automatically  
   └── User: "No, cancel" → Cancel and initiate refund  
        │  
\[EXCEPTION: Restaurant item sold out\]  
        │  
AI: "The restaurant says the Phở Bò Tái is sold out. They suggest Phở Gà instead.  
     Would you like to switch, choose something else, or cancel?"

---

### **Phase 4 — Delivery**

Driver arrives at door (not lobby — per accessibility instruction)  
        │  
Driver calls/messages user (as instructed by push notification)  
        │  
\[Optional: Driver scans QR or enters code to confirm door delivery in AccessAI\]  
        │  
AI notifies user: "Your driver \[Name\] is at your door."  
        │  
Driver hands over order, waits for verbal acknowledgment  
        │  
User says or driver confirms: order received  
        │  
\[If disability toggle ON: driver earns AccessPoints automatically\]  
  \+30 pts (door delivery)  
  \+20 pts (verbal confirmation)

### **Phase 5 — Post-Delivery**

AI: "Your order has arrived. How was your experience?  
     You can say: great, okay, or bad — or describe what happened."  
        │  
User speaks freely (e.g., "Everything was great, the driver was very helpful")  
        │  
AI extracts: 5-star rating · short review text  
        │  
Review submitted to partner platform under user's account  
        │  
Driver receives \+50 AccessPoints if rating ≥ 4 stars  
        │  
AI: "Thanks\! Would you like to save Phở Hà Nội as a favourite for next time?"  
        │  
User: "Yes"  
        │  
Saved to profile → next time, user can say "Reorder my usual from Phở Hà Nội"

---

### **Phase 6 — Ride Booking (Parallel Flow)**

User: "Book me a Grab to Bến Thành Market"  
        │  
AI: "From \[current/saved address\] to Bến Thành Market — is that right?"  
        │  
User: "Yes"  
        │  
AI calls ride API (mock): driver found, ETA 6 minutes, price estimate 45,000 VND  
        │  
AI: "A GrabCar is 6 minutes away. The estimated fare is 45,000 VND. Confirm?"  
        │  
\[IF DISABILITY TOGGLE ON\]  
Driver notification: "Passenger has a disability. Please announce your arrival verbally.  
                      Assist with entry and exit. Extra care earns AccessPoints."  
        │  
\[During ride: silent unless user asks\]  
User can say: "How long until we arrive?" → AI reads ETA  
        │  
\[On arrival\]  
AI: "You've arrived at Bến Thành Market. Stay safe\!"  
        │  
\[If no response within 3 min — N6 feature\]  
AI pings emergency contact: "\[User name\] has arrived at their destination."

---

## **14\. SDG & Sustainability Alignment**

| SDG Goal | How AccessAI Contributes |
| ----- | ----- |
| **SDG 10 — Reduced Inequalities** | Removes digital barriers for 6.2M+ disabled Vietnamese, enabling independent access to urban services |
| **SDG 11 — Sustainable Cities and Communities** | Makes urban digital infrastructure inclusive; supports equitable access to smart city services |
| **SDG 8 — Decent Work and Economic Growth** | Creates structured economic incentive for delivery workers to serve underserved communities |
| **SDG 17 — Partnerships for the Goals** | Requires and models multi-stakeholder partnerships (tech platform \+ NGO \+ government \+ private sector) |

### **Grab & UNDP Alignment**

* **Grab:** AccessAI extends Grab's platform reach to a previously inaccessible market segment. Each disabled user who can now independently use Grab's services is a new active customer.  
* **UNDP:** AccessAI directly addresses SDG 10 and SDG 11 at the city level, with a model replicable across Southeast Asian cities with similar disability demographics and super-app ecosystems.

---

## **15\. Demo Strategy (36-Hour Scope)**

### **What Will Be Live & Functional**

| Feature | Status |
| ----- | ----- |
| React Native app shell with voice input | ✅ Live |
| Whisper STT → intent parsing → Claude AI response | ✅ Live |
| TTS audio output (all app states narrated) | ✅ Live |
| Mock restaurant menu browse \+ order flow | ✅ Live (mock data) |
| Disability toggle in user profile | ✅ Live |
| Mock order tracking state machine | ✅ Live (mock data) |
| Voice-driven rating flow post-delivery | ✅ Live |
| Driver notification display (UI mockup) | ✅ Mockup |
| AccessPoints reward display | ✅ Mockup |
| Partner API integration (Grab/ShopeeFood) | 🟡 Simulated — pending partnership |

### **Demo Script Summary (5-minute pitch demo)**

1. **(0:00–0:45)** — Show problem: screenshot of standard Grab app; highlight complexity for a blind user  
2. **(0:45–2:00)** — Live demo: blind user flow — wake app, voice-order Phở, AI validates, order placed, voice confirmation  
3. **(2:00–2:45)** — Driver notification screen: show what the driver sees on their phone  
4. **(2:45–3:30)** — Delivery \+ voice rating flow  
5. **(3:30–4:00)** — AccessPoints dashboard \+ reward summary  
6. **(4:00–5:00)** — Scalability slide: "With Grab's API, this is what it looks like at city scale"

### **Repository Structure**

accessai/  
├── README.md           ← Problem, solution, setup, tech stack, user guide  
├── DISCLOSURE.md       ← AI tools used: Claude, Copilot, Whisper, etc.  
├── /app                ← React Native source  
│   ├── /screens  
│   ├── /components  
│   └── /services       ← API service layer (mock \+ real interface)  
├── /backend            ← Node.js \+ Express  
│   ├── /routes  
│   ├── /services       ← AI orchestration, notification dispatch  
│   └── /mock-data      ← Mock Grab/ShopeeFood API responses  
├── /db  
│   └── schema.sql      ← PostgreSQL schema  
├── package.json  
├── requirements.txt    ← (if any Python tooling used)  
└── .env.example        ← All environment variables documented

---

*Document version: 1.0 | Created: June 27, 2026 | For internal team use during Grab the Future Hackathon*

