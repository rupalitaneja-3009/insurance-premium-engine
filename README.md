# Insurance Premium Engine

Dynamic health insurance premium calculator with a rule-based microservices architecture.

## Architecture

```
Client (Postman / Web)
        ↓
API Gateway          :3000
        ↓
├── Plan Service     :3001  → PostgreSQL (plans, addons)
├── Rule Engine      :3002  → Premium calculation rules
└── Quote Service    :3003  → PostgreSQL (quotes) + Redis (24hr cache)
```

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL + Redis)

## Quick Start

### 1. Start databases

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5433`
- Redis on `localhost:6381`

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment

Copy `.env.example` to `.env` in each service:

```bash
cp plan-service/.env.example plan-service/.env
cp rule-engine/.env.example rule-engine/.env
cp quote-service/.env.example quote-service/.env
cp api-gateway/.env.example api-gateway/.env
```

### 4. Start all services

```bash
npm run start:all
```

Or start individually:

```bash
npm run start:plans    # port 3001
npm run start:rules    # port 3002
npm run start:quotes   # port 3003
npm run start:gateway  # port 3000
```

### 5. Verify health

```bash
curl http://localhost:3000/health
```

## Swagger Docs

| Service       | URL                              |
|---------------|----------------------------------|
| API Gateway   | http://localhost:3000/api/docs   |
| Plan Service  | http://localhost:3001/api/docs   |
| Rule Engine   | http://localhost:3002/api/docs   |
| Quote Service | http://localhost:3003/api/docs   |

## Sample API Call

Calculate a premium quote via the gateway:

```bash
curl -X POST http://localhost:3000/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "HEALTH_PLUS",
    "sumInsured": 500000,
    "tenure": 1,
    "city": "Delhi",
    "members": [
      {
        "relationship": "SELF",
        "age": 32,
        "gender": "FEMALE",
        "bmi": 24.5,
        "isSmoker": false,
        "preExistingDiseases": ["HYPERTENSION"]
      },
      {
        "relationship": "SPOUSE",
        "age": 30,
        "gender": "MALE",
        "bmi": 27.0,
        "isSmoker": false,
        "preExistingDiseases": []
      }
    ],
    "addonCodes": ["CRITICAL_ILLNESS", "OPD_COVER"]
  }'
```

Other useful endpoints:

```bash
# List all plans
curl http://localhost:3000/plans

# List addons
curl http://localhost:3000/plans/addons

# View active pricing rules
curl http://localhost:3000/engine/rules

# Compare plans
curl -X POST http://localhost:3000/quotes/compare \
  -H "Content-Type: application/json" \
  -d '{
    "planCodes": ["HEALTH_BASIC", "HEALTH_PLUS", "HEALTH_PREMIUM"],
    "quoteDetails": {
      "planCode": "HEALTH_PLUS",
      "sumInsured": 500000,
      "tenure": 1,
      "city": "Delhi",
      "members": [
        { "relationship": "SELF", "age": 32, "gender": "FEMALE", "bmi": 24.5 }
      ]
    }
  }'
```

## Services

| Service       | Port | Responsibility                                      |
|---------------|------|-----------------------------------------------------|
| API Gateway   | 3000 | Routing, rate limiting, request logging             |
| Plan Service  | 3001 | Insurance plans & add-ons (seeded on first startup) |
| Rule Engine   | 3002 | Age, BMI, disease, city, discount & GST calculation |
| Quote Service | 3003 | Quote generation, Redis caching, comparison       |

## Premium Calculation Flow

1. Quote Service checks Redis cache
2. On cache miss → fetches plan from Plan Service
3. Calls Rule Engine with member details
4. Applies family, NCB, and tenure discounts + GST
5. Saves quote to PostgreSQL
6. Caches result in Redis (24 hours)

## Tech Stack

- NestJS + TypeScript
- PostgreSQL + TypeORM
- Redis
- Docker Compose
- Swagger

## Project Structure

```
insurance-premium-engine/
├── api-gateway/       # Entry point (port 3000)
├── plan-service/      # Plans & addons CRUD (port 3001)
├── rule-engine/       # Premium calculation rules (port 3002)
├── quote-service/     # Quotes + Redis cache (port 3003)
├── docker-compose.yml # Postgres + Redis
└── package.json       # Run all services together
```

## Available Plans (seed data)

| Code            | Name                        | Type           |
|-----------------|-----------------------------|----------------|
| HEALTH_BASIC    | HealthShield Basic          | INDIVIDUAL     |
| HEALTH_PLUS     | HealthShield Plus           | INDIVIDUAL     |
| HEALTH_FAMILY   | HealthShield Family Floater | FAMILY_FLOATER |
| HEALTH_PREMIUM  | HealthShield Premium        | INDIVIDUAL     |
| HEALTH_SENIOR   | HealthShield Senior         | SENIOR_CITIZEN |
