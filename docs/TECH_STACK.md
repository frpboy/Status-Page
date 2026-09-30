# Technology Stack & Infrastructure Architecture
## Zerpai Independent Status Monitor

---

## 1. Core Technology Stack

| Layer | Component | Version / Specification | Rationale |
| --- | --- | --- | --- |
| **Framework** | Next.js | `14.2.35` (App Router) | Serverless edge rendering, fast page loads, API route support |
| **Language** | TypeScript | `^5.0.0` | Strict type safety across API routes and UI components |
| **UI Library** | React | `^18.2.0` | Client-side hydration, hooks (`useCallback`, `useEffect`) |
| **Icons** | Lucide React | `^0.359.0` | Sleek modern icons (`Activity`, `Database`, `Server`, `CheckCircle2`) |
| **Styling** | Tailwind CSS | `^3.4.1` | Utility-first CSS with dark theme tokens & backdrop blur filters |
| **Database** | Neon PostgreSQL | Serverless Driver (`@neondatabase/serverless`) | High-concurrency serverless PostgreSQL over HTTP/WebSockets |
| **Hosting Edge** | Vercel Edge | Vercel Serverless Functions | Decoupled fail-safe hosting isolated from AWS infrastructure |

---

## 2. Infrastructure Dependency Isolation

```mermaid
graph LR
    subgraph Primary Production Infrastructure (AWS)
        ECS["AWS ECS Fargate API"]
        RDS["AWS RDS PostgreSQL"]
        CF["AWS CloudFront CDN"]
    end

    subgraph Independent Status Monitor (Vercel + Neon)
        VercelEdge["Vercel Edge Network<br/>(zerpai-status-page.vercel.app)"]
        NeonDB["Neon Serverless PostgreSQL<br/>(status_snapshots)"]
    end

    VercelEdge <-->|Read-Only HTTP| NeonDB
    ECS -.->|Periodic Telemetry Write| NeonDB
```

To guarantee that system outages on primary AWS infra do not bring down status visibility:
1. **Isolated Hosting**: Hosted on Vercel Edge Network, operating in separate data centers from AWS `ap-south-2`.
2. **Decoupled Database**: Uses Neon Serverless PostgreSQL over HTTP WebSocket driver (`@neondatabase/serverless`), requiring no direct AWS VPC access or bastion tunnel.
