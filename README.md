**Coming Soon**
```text
├── .gitignore
├── README.md
├── ai-service
    ├── Dockerfile
    ├── __pycache__
    │   └── main.cpython-311.pyc
    ├── main.py
    ├── requirements.txt
    └── src
    │   ├── chat
    │       └── f1_expert.py
    │   ├── llm
    │       └── groq_client.py
    │   ├── main.py
    │   └── rag
    │       └── vector_store.py
├── backend
    ├── Dockerfile
    ├── package-lock.json
    ├── package.json
    ├── server.ts
    ├── src
    │   ├── middleware
    │   │   ├── auth.ts
    │   │   └── validation.ts
    │   ├── routes
    │   │   ├── auth.ts
    │   │   ├── chat.ts
    │   │   └── f1.ts
    │   ├── server.ts
    │   ├── services
    │   │   ├── AuthService.ts
    │   │   ├── ChatService.ts
    │   │   └── F1Service.ts
    │   └── types
    │   │   └── User.ts
    └── tsconfig.json
├── database
    └── init.sql
├── docker-compose.yml
├── f1-processor
    ├── Dockerfile
    ├── cache
    │   ├── 2023
    │   │   └── 2023-03-05_Bahrain_Grand_Prix
    │   │   │   └── 2023-03-03_Practice_1
    │   │   │       ├── _extended_timing_data.ff1pkl
    │   │   │       ├── car_data.ff1pkl
    │   │   │       ├── driver_info.ff1pkl
    │   │   │       ├── position_data.ff1pkl
    │   │   │       ├── race_control_messages.ff1pkl
    │   │   │       ├── session_info.ff1pkl
    │   │   │       ├── session_status_data.ff1pkl
    │   │   │       ├── timing_app_data.ff1pkl
    │   │   │       ├── track_status_data.ff1pkl
    │   │   │       └── weather_data.ff1pkl
    │   └── fastf1_http_cache.sqlite
    ├── debug.py
    ├── debug_env.py
    ├── main.py
    ├── requirements.txt
    └── src
    │   └── collectors
    │       └── session_collector.py
├── f1_dashboard_plan (1).md
├── frontend
    ├── .gitignore
    ├── Dockerfile
    ├── README.md
    ├── components.json
    ├── eslint.config.mjs
    ├── next.config.js
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── postcss.config.mjs
    ├── src
    │   ├── app
    │   │   ├── auth
    │   │   │   ├── login
    │   │   │   │   └── page.tsx
    │   │   │   └── register
    │   │   │   │   └── page.tsx
    │   │   ├── dashboard
    │   │   │   └── page.tsx
    │   │   ├── favicon.ico
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── test
    │   │   │   └── page.tsx
    │   ├── components
    │   │   ├── F1Dashboard.tsx
    │   │   ├── analysis
    │   │   │   └── DriverComparison.tsx
    │   │   ├── chat
    │   │   │   └── F1Chatbot.tsx
    │   │   ├── common
    │   │   │   ├── ErrorBoundary.tsx
    │   │   │   └── LoadingSpinner.tsx
    │   │   ├── dashboard
    │   │   │   └── LiveTiming.tsx
    │   │   ├── layout
    │   │   │   └── Header.tsx
    │   │   ├── strategy
    │   │   │   └── RaceStrategy.tsx
    │   │   ├── telemetry
    │   │   │   └── TelemetryChart.tsx
    │   │   ├── track
    │   │   │   └── TrackMap.tsx
    │   │   └── ui
    │   │   │   ├── badge.tsx
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── dropdown-menu.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── scroll-area.tsx
    │   │   │   ├── select.tsx
    │   │   │   └── tabs.tsx
    │   ├── hooks
    │   │   ├── useAuth.ts
    │   │   ├── useF1Data.ts
    │   │   └── useSocket.ts
    │   ├── lib
    │   │   └── utils.ts
    │   ├── store
    │   │   ├── authStore.ts
    │   │   └── dashboardStore.ts
    │   └── types
    │   │   ├── api.ts
    │   │   ├── auth.ts
    │   │   └── f1.ts
    ├── tailwind.config.ts
    └── tsconfig.json
└── requirement.txt
```
