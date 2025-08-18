# Character Tap Game

## Overview

This is a modular tap-based character interaction game featuring AI-powered chat, character customization, and a comprehensive progression system. Players tap characters to earn Lust Points (LP), unlock upgrades, spin reward wheels, and engage in dynamic conversations with AI characters. The game includes VIP/NSFW gated content, character bond systems, and various gameplay mechanics like boosters, achievements, and offline progression.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom game-themed color variables and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular component architecture with separate UI components, game logic components, and utility functions

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with structured route handlers
- **Development Server**: Custom Vite integration for hot module replacement in development

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Comprehensive game schema including users, characters, upgrades, chat messages, media files, boosters, and game statistics
- **Connection**: Connection pooling with Neon serverless adapter
- **Migrations**: Drizzle Kit for database schema migrations

### Game Systems Architecture
- **Character System**: Character creation, customization with moods/personality, bond levels, and affection tracking
- **Progression System**: Level-based progression with LP (Lust Points) as primary currency, offline/online tick calculations
- **Upgrade System**: Tiered upgrade system with cost multipliers and effect scaling
- **Chat System**: AI-powered character interactions using OpenAI GPT-4o
- **Reward System**: Wheel-based reward mechanics and random media gifting
- **Admin Tools**: Debug panel for development and testing

### External Dependencies

**Core Framework Dependencies**:
- React 18+ with TypeScript support
- Express.js for backend API server
- Vite for frontend build tooling and development server

**Database & ORM**:
- PostgreSQL database (Neon serverless provider)
- Drizzle ORM for database operations and schema management
- Connection pooling via @neondatabase/serverless

**UI & Styling**:
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible component foundation
- shadcn/ui component library for pre-built UI components
- Custom CSS variables for game theming

**State Management & API**:
- TanStack React Query for server state management and caching
- Custom API client with fetch-based HTTP requests
- Query invalidation strategies for real-time updates

**AI Integration**:
- OpenAI API integration for character chat responses
- GPT-4o model for dynamic character interactions
- Character personality and mood-based response generation

**Development Tools**:
- TypeScript for type safety across frontend and backend
- ESBuild for production bundling
- Replit-specific plugins for development environment integration
- Custom error overlay and development tooling