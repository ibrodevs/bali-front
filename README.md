<div align="center">

# Bali Bike Rental

### Multilingual scooter discovery and booking platform for Bali

[![Live](https://img.shields.io/badge/Live-bali.bike-FACC15?style=for-the-badge)](https://www.bali.bike)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/status-production-22C55E?style=flat-square)

</div>

## Overview

Bali Bike Rental is a conversion-focused rental experience for international travelers. It combines a dynamic scooter catalog, localized content, pricing, delivery information, customer accounts, and a guided booking flow in a fast responsive interface.

The frontend consumes a separate REST API and is designed to remain usable when selected content is temporarily unavailable by providing carefully controlled fallback data.

## Product capabilities

- API-powered scooter catalog with availability and featured vehicles
- Guided rental and booking flow
- Customer authentication, profile, and booking history
- Multiple interface languages: English, Russian, Chinese, Indonesian, German, and French
- Multi-currency price presentation
- Delivery zones and location-specific information
- Dynamic FAQs and site content from the backend
- WhatsApp, Telegram, WeChat, and support-chat entry points
- Responsive layouts for mobile, tablet, and desktop
- Motion and interaction design with Framer Motion
- SEO and page-specific metadata support

## Technology

| Area | Technology |
|---|---|
| Framework | Next.js 14, React 18 |
| Language | TypeScript |
| Motion | Framer Motion |
| Data | REST API with authenticated token refresh |
| Localization | Custom locale and currency providers |
| Deployment | Production web deployment with remote media support |

## Project structure

~~~text
app/            # routes, layouts, catalog, booking, profile
components/     # reusable product and interface components
lib/            # API client, endpoints, localization, SEO, domain helpers
public/         # static assets
~~~

## Running locally

### Requirements

- Node.js 20 or newer
- npm

### Installation

~~~bash
npm install
npm run dev
~~~

Open http://localhost:3000.

### Environment

Create a local environment file when connecting to a different API:

~~~env
NEXT_PUBLIC_API_URL=https://your-api.example.com
NEXT_PUBLIC_MEDIA_URL=https://your-media.example.com
~~~

Production defaults point to the public Bali Bike API.

## Production build

~~~bash
npm run build
npm run start
~~~

## Engineering notes

- API requests are centralized in the lib layer.
- Access and refresh tokens are handled by the frontend API client.
- Locale, currency, page settings, and site settings are isolated in dedicated providers.
- Catalog fallbacks prevent empty product states during temporary API failures.
- Remote media is normalized through a single media URL helper.

## Project note

This is the customer-facing frontend of a larger rental platform. Backend services, production infrastructure, and operational configuration are maintained separately.

