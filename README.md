# CollabAI - Multi-Model AI Collaboration Platform

A sophisticated AI collaboration platform that enables multiple AI models to work together on complex tasks. Originally built for Base44's platform, this demo version runs entirely in the browser using localStorage for data persistence.

## Features

- **Multi-Model Collaboration**: Chat with multiple AI models simultaneously (GPT-4, Claude, Gemini)
- **Autonomous Agent Mode**: AI agents can have continuous conversations with role assignments
- **Code Canvas**: Collaborative code editing with AI assistance
- **File Repository**: Organize and share files across conversations
- **Memory System**: AI models remember context across conversations
- **Project Templates**: Quick-start templates for common development tasks
- **Analytics Dashboard**: Track usage patterns and model performance

## Demo Mode

This version runs as a demo with:
- Mock AI responses (simulated delays and realistic responses)
- localStorage for data persistence
- All Pro features enabled
- No actual API calls to external AI services

## Getting Started

```bash
npm install
npm run dev
```

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks + localStorage
- **Animations**: Framer Motion
- **Charts**: Recharts

## Key Components

- `Chat.jsx` - Multi-model collaborative chat interface
- `AvatarChat.jsx` - Autonomous agent conversation mode
- `CodeCanvas.jsx` - Collaborative code editing
- `FileRepository.jsx` - File management system
- `Analytics.jsx` - Usage analytics dashboard

## Original Platform

This project was originally built for Base44's AI platform with full backend integration. This demo version showcases the UI and interaction patterns without requiring external services.