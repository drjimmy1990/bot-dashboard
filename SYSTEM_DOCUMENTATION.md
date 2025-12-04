# System Documentation & Data Guide

This document provides a comprehensive overview of the data recorded in the CRM system and the analytics charts available. Use this guide when building workflows or writing system messages for AI agents to understand what data is available and how to interpret it.

---

## 1. Core Data Entities (What We Record)

### 👤 CRM Clients (`crm_clients`)
The central profile for every person or company you interact with.
*   **Identity**: Name, Company Name, Email, Phone, Secondary Phone.
*   **Location**: Street, City, State, Postal Code, Country.
*   **Status**:
    *   `Lifecycle Stage`: Lead, MQL (Marketing Qualified), SQL (Sales Qualified), Opportunity, Customer, Evangelist, Churned.
    *   `Client Type`: Lead, Prospect, Customer, Partner, Inactive.
    *   `Lead Quality`: Hot, Warm, Cold.
*   **Team**: `Assigned Team` (Group handling the client) and `Assigned To` (Specific agent).
*   **Metrics**: Total Orders, Total Revenue, Average Order Value (Auto-calculated from Orders).
*   **Marketing**: Source (e.g., "Facebook Ads"), UTM Data, Tags.
*   **Timestamps**: First Contact, Last Contact, Next Follow-up.

### 💼 Deals (`crm_deals`)
Sales opportunities in the pipeline.
*   **Basics**: Name, Description, Value, Currency.
*   **Progress**:
    *   `Stage`: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost.
    *   `Probability`: 0-100% chance of closing.
*   **Dates**: Expected Close Date, Actual Close Date.
*   **Ownership**: Assigned Team, Owner (Agent).
*   **Outcome**: Won Reason, Lost Reason, Competitor info.

### 🛒 Orders (`crm_orders`)
Transactional data (useful for E-commerce integrations).
*   **Details**: Order Number, Subtotal, Tax, Shipping, Total, Currency.
*   **Status**: Pending, Processing, Shipped, Delivered, Cancelled, Refunded.
*   **Items**: JSON list of products purchased.

### 📅 Activities (`crm_activities`)
Log of all interactions with a client.
*   **Types**: Call, Email, Meeting, Task, Note, Chatbot Interaction, Website Visit.
*   **Details**: Subject, Description, Status (Pending/Completed), Priority.
*   **Dates**: Due Date, Completed At.

### 💬 Contacts & Messages (`contacts`, `messages`)
Raw chat data from connected channels.
*   **Channels**: WhatsApp, Facebook, Instagram.
*   **Messages**: Text content, Attachments, Sender (User/Agent/AI), Read Status.
*   **AI**: Whether the contact has `AI Enabled` (Bot replies automatically).

---

## 2. Analytics & Charts (What We Visualize)

### 📊 Dashboard Summary
**Purpose**: High-level snapshot of business health.
*   **Total Clients**: Size of your database.
*   **Total Revenue**: All-time earnings from valid orders.
*   **Open Deals Value**: Potential revenue currently in the pipeline.
*   **Win Rate**: Percentage of deals marked as "Closed Won".

### 📉 Conversion Funnel
**Purpose**: Track how well you move people from "Lead" to "Customer".
*   **Visual**: Bar or Funnel chart showing counts at each `Lifecycle Stage`.
*   **Usage**: Identify bottlenecks. If you have many "Leads" but few "MQLs", your initial engagement needs work.

### 📈 Revenue Trends
**Purpose**: Analyze financial growth over time.
*   **Visual**: Line chart showing Revenue vs. Time (Daily/Weekly/Monthly).
*   **Data Points**: Total Revenue, Order Count, Average Order Value.
*   **Usage**: Spot seasonal trends or the impact of marketing campaigns.

### 📊 Deal Pipeline Snapshot
**Purpose**: View the current state of your sales team.
*   **Visual**: Bar chart showing Total Value per Deal Stage.
*   **Usage**: "We have $50k in Negotiation—let's focus on closing those this week."

### 📈 Deal Trends (Velocity)
**Purpose**: Measure sales activity.
*   **Visual**: Line chart showing New Deals Created vs. Time.
*   **Usage**: Are we generating enough new opportunities to meet future targets?

### 💬 Message Volume Trends
**Purpose**: Monitor support/chat load and AI efficiency.
*   **Visual**: Multi-line chart showing Total Messages, AI Responses, and Agent Responses.
*   **Usage**:
    *   High AI Responses + Low Agent Responses = Bot is handling the load well.
    *   Spike in Total Messages = Potential viral event or issue.

### 📢 Channel Performance
**Purpose**: Compare effectiveness of different platforms.
*   **Visual**: Table or Bar chart comparing WhatsApp vs. Facebook vs. Instagram.
*   **Metrics**: Total Contacts, Total Messages, Engagement Rate.
*   **Usage**: "Most of our leads come from WhatsApp; let's increase ad spend there."

---

## 3. Usage Guide for Agents & Workflows

### System Prompts
When designing an AI agent, you can give it context based on this data:

*   **Role**: "You are a sales assistant for [Organization Name]."
*   **Context**: "You are talking to [Client Name], who is currently a [Lifecycle Stage]. They have spent $[Total Revenue] with us."
*   **Goal**:
    *   If `Lifecycle Stage` is 'Lead' -> "Qualify them and move to MQL."
    *   If `Lifecycle Stage` is 'Customer' -> "Upsell new products or ask for a referral."
    *   If `Lead Quality` is 'Hot' -> "Prioritize immediate response and schedule a meeting."

### Workflow Triggers
Use these data points to trigger automations (e.g., in n8n):

1.  **New Lead**: When a new `contact` is created -> Create a `crm_client` -> Send welcome message.
2.  **High Value Deal**: When a `deal` value > $10,000 -> Notify the "VIP Sales Team" (using `assigned_team`).
3.  **Stalled Deal**: When a deal stays in 'Proposal' stage for > 7 days -> Create a `crm_activity` (Task) for the agent to follow up.
4.  **Churn Risk**: When a 'Customer' hasn't had an `activity` or `message` in > 90 days -> Tag as 'At Risk' and alert success team.

### Team Assignment
*   **Routing**: You can route clients to specific teams based on `city`, `country`, or `source`.
    *   *Example*: "If Country is 'USA', assign to 'US Sales Team'."

---

## 4. Client Lifecycle & Management Logic

This section details the logic flow of a client from initial creation to becoming a loyal customer. Use this to understand *how* and *why* data changes.

### A. Creation (Entry Points)
1.  **Automatic (Inbound)**:
    *   **Trigger**: A new user sends a message via WhatsApp, Facebook, or Instagram.
    *   **System Action**:
        *   Creates a `Contact` record.
        *   Database Trigger (`create_client_on_new_contact`) automatically creates a linked `CRM Client` profile.
    *   **Initial State**: `Lifecycle Stage` = 'Lead', `Client Type` = 'Lead'.
2.  **Manual (Outbound)**:
    *   **Trigger**: Agent manually adds a person.
    *   **Usage**: For cold calling or importing lists.

### B. Modification & Enrichment
Agents and Systems continuously enrich the client profile:
*   **Profile Updates**: Agents use the "Edit Client" modal to add:
    *   **Address**: Street, City, Country (Crucial for logistics and geo-segmentation).
    *   **Tags**: Flexible labels (e.g., "VIP", "Wholesale", "Urgent") for filtering.
    *   **Team Assignment**: Handing off the client to a specialized team (e.g., moving from "Support" to "Sales Team").
*   **Automatic Updates**:
    *   **Last Contact**: Automatically updated whenever a new Message or Activity is logged.
    *   **Revenue Metrics**: Automatically recalculated (`Total Revenue`, `Total Orders`, `AOV`) whenever a `CRM Order` is added or updated.

### C. Lifecycle Stages (The Recommended Flow)
Follow this logic to move clients through the funnel:

1.  **Lead** (Default)
    *   *Definition*: New contact, unverified interest.
    *   *Goal*: Engage and qualify.
2.  **MQL (Marketing Qualified Lead)**
    *   *Definition*: User has shown specific interest (e.g., asked about pricing, clicked ad).
    *   *Action*: Tag as 'MQL', notify Sales Team.
3.  **SQL (Sales Qualified Lead)**
    *   *Definition*: Sales team has verified budget and intent.
    *   *Action*: **Create a Deal**.
4.  **Opportunity**
    *   *Definition*: Active negotiation in progress.
    *   *Logic*: The client has an open Deal.
5.  **Customer**
    *   *Definition*: Deal won or Purchase made.
    *   *Logic*: System auto-updates revenue. Agent moves stage to 'Customer'.
6.  **Evangelist**
    *   *Definition*: Loyal customer who refers others.
    *   *Action*: Add to "VIP" tag, invite to referral program.
7.  **Churned**
    *   *Definition*: Customer who stopped buying or cancelled.
    *   *Action*: Trigger re-engagement campaign.

### D. Deal & Order Logic
*   **Deals**: Represents the *process* of selling.
    *   *Note*: Changing a Deal Stage (e.g., to 'Closed Won') does *not* automatically change the Client Stage to 'Customer'. This is intentional to allow flexibility (e.g., a client might have one won deal but still be an 'Opportunity' for a larger deal).
    *   *Best Practice*: Manually update Client Stage to match the Deal status.
*   **Orders**: Represents the *result* of selling.
    *   *Automation*: The database automatically sums up all valid orders to keep the Client's `LTV` (Lifetime Value) up to date.

