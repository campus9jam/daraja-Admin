# Daraja Command Center

You are building the complete operational Admin OS for the House of Daraja (HD) ecosystem.

This is NOT a simple dashboard.
This is the central command center for:

marketplace management

bespoke tailoring operations

logistics coordination

AI workflow supervision

token/reward management

moderation

analytics

automation orchestration

customer support

vendor management

system configuration

The system must be production-grade, scalable, modular, secure, and tightly integrated with Supabase.

========================================
CORE OBJECTIVE

Connect directly to my LIVE Supabase project and generate the FULL backend architecture, database schema, authentication system, row-level security structure, admin UI, and operational tools required to run House of Daraja at scale.

DO NOT use mock data.
DO NOT use temporary local state.
DO NOT create fake APIs.

Everything must connect directly to Supabase.

Use:

Supabase Database

Supabase Auth

Supabase Storage

Supabase Realtime

Supabase Edge Functions support

Secure Row-Level Security (RLS)

Migration-safe SQL

========================================
PLATFORM CONTEXT

House of Daraja is a multi-service African fashion and commerce ecosystem that includes:

fashion marketplace

bespoke tailoring

auctions

AI stylist assistant

digital asset marketplace

rewards/token system

logistics coordination

multilingual support

creator/vendor ecosystem

analytics

moderation systems

The platform must support:

customers

tailors

designers

vendors

logistics providers

moderators

support staff

admins

super admins

========================================
TECH STACK

Frontend:

Lovable Admin Dashboard

Backend:

Supabase

Main User App:

External GitHub/Vercel app connected to same Supabase

Automation Layer:

Base44

AI workflows

Edge Functions

========================================
STEP 1 — INITIALIZE SUPABASE ARCHITECTURE

Generate all production-grade database schemas with:

UUID primary keys

created_at timestamps

updated_at timestamps

proper foreign key relationships

indexes for performance

enum-based statuses

scalable naming conventions

soft delete support where necessary

audit logging support

multilingual-ready fields

secure RLS-ready structure

========================================
DOMAIN 1 — AUTH & IDENTITY

Use Supabase Auth as the authentication provider.

Create:

profiles

id (linked to auth.users.id)

username

display_name

email

phone

avatar_url

bio

role

account_status

language

country

city

wallet_balance

lee_tokens

created_at

updated_at

roles

permissions

user_roles

role_permissions

Requirements:

RBAC (role-based access control)

support multiple roles per user

admin privilege hierarchy

permission-based UI rendering

========================================
DOMAIN 2 — PRODUCT & MARKETPLACE SYSTEM

Create:

categories

products

product_media

product_variants

product_inventory

product_reviews

wishlist_items

saved_collections

Requirements:

support physical and digital products

support customizable products

support auction-enabled products

support multilingual product descriptions

support inventory tracking

support vendor ownership

========================================
DOMAIN 3 — BESPOKE TAILORING SYSTEM

Create:

measurements

tailoring_orders

tailoring_revisions

tailoring_progress_updates

fabric_catalog

tailoring_appointments

Requirements:

detailed body measurement support

measurement history

revision tracking

tailor/customer relationship

style notes

delivery scheduling

upload reference images

========================================
DOMAIN 4 — ORDER & PAYMENT SYSTEM

Create:

orders

order_items

payments

invoices

refunds

delivery_addresses

shipping_tracking

Requirements:

multiple payment providers

payment status tracking

delivery status tracking

order lifecycle management

invoice generation

refund handling

support partial payments

========================================
DOMAIN 5 — AUCTION SYSTEM

Create:

auctions

bids

auction_watchers

auction_winners

Requirements:

real-time bidding

anti-sniping logic preparation

reserve price support

auto-close workflows

bid history

vendor auction management

========================================
DOMAIN 6 — REWARDS & LEE TOKEN SYSTEM

Create:

wallets

wallet_transactions

reward_events

referral_rewards

loyalty_levels

Requirements:

ledger-based accounting

anti-fraud structure

reward tracking

cashback support

token subsidy system

transaction auditability

========================================
DOMAIN 7 — AI & AUTOMATION DOMAIN

Create:

ai_conversations

ai_messages

ai_workflows

ai_recommendations

ai_logs

ai_feedback

Requirements:

Leema AI assistant support

recommendation history

workflow execution logging

conversation memory

AI analytics support

========================================
DOMAIN 8 — LOGISTICS & DELIVERY

Create:

delivery_partners

delivery_agents

delivery_tasks

live_delivery_tracking

delivery_pricing_rules

Requirements:

delivery dispatching

rider assignment

live tracking preparation

logistics analytics

multi-region support

========================================
DOMAIN 9 — ADMIN & OPERATIONS

Create:

admin_logs

moderation_reports

feature_flags

support_tickets

support_messages

system_announcements

audit_logs

emergency_controls

Requirements:

full audit logging

admin activity tracking

moderation queue

support ticket lifecycle

feature toggles

emergency system disable controls

========================================
DOMAIN 10 — ANALYTICS & REPORTING

Create:

analytics_events

business_metrics

vendor_performance

user_activity_logs

conversion_tracking

Requirements:

real-time dashboards

export support

chart-ready structures

operational KPIs

AI recommendation analytics

========================================
STEP 2 — GENERATE FULL RLS POLICIES

Generate secure Row-Level Security policies for ALL tables.

Requirements:

users can only access their own private data

vendors only manage their own products/orders

admins have scoped elevated permissions

super admins have full access

moderation tables inaccessible to normal users

wallet system fully secured

AI logs protected

delivery agents scoped to assignments

NEVER disable RLS globally.

========================================
STEP 3 — GENERATE SUPABASE STORAGE STRUCTURE

Create storage buckets for:

avatars

products

tailoring_reference_images

invoices

delivery_proofs

AI_assets

marketing_assets

support_attachments

Generate secure upload policies.

========================================
STEP 4 — GENERATE ADMIN DASHBOARD UI

Build a professional operational dashboard with:

Executive Overview

revenue

active users

pending orders

delivery metrics

AI activity

token usage

User Management

search/filter users

ban/unban

role assignment

account verification

Marketplace Management

product approval

vendor management

category management

Tailoring Operations

tailoring queue

measurements review

revision tracking

Auction Management

active auctions

suspicious bid monitoring

auction analytics

Logistics Dashboard

rider tracking

dispatch management

delivery analytics

Reward System Dashboard

wallet monitoring

token analytics

fraud detection

AI Operations Center

Leema conversations

workflow monitoring

AI feedback analytics

Moderation Center

reports queue

flagged content

enforcement actions

Feature Flag Console

enable/disable features globally

maintenance mode

beta rollout controls

Analytics Dashboard

charts

KPIs

exportable reports

========================================
STEP 5 — AUTHENTICATION & SECURITY

Requirements:

Supabase Auth integration

email/password auth

magic links

admin-only route protection

session persistence

secure JWT handling

role-aware navigation

multi-level admin authentication

Restrict admin access to:

approved admin roles only

========================================
STEP 6 — EDGE FUNCTION PREPARATION

Prepare the architecture for future Supabase Edge Functions.

Generate placeholders and integration-ready structures for:

notifications

AI workflows

payment verification

delivery dispatching

moderation automation

recommendation systems

========================================
STEP 7 — UI/UX REQUIREMENTS

Design language:

luxury African-modern aesthetic

premium enterprise dashboard

responsive layout

dark/light mode support

modular navigation

scalable component system

mobile-friendly admin controls

The interface should feel like:

Shopify Admin

Stripe Dashboard

Notion

Linear

modern enterprise SaaS

combined with African luxury branding.

========================================
FINAL REQUIREMENTS

Generate:

complete SQL schema

migrations

Supabase integrations

CRUD operations

admin UI

reusable components

secure policies

scalable architecture

production-ready operational tooling

The result must be:

scalable

maintainable

enterprise-grade

AI-ready

automation-ready

multi-tenant-ready

secure

production deployable

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/70a69392-50bd-4dbc-a695-874b3eb30aa1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
