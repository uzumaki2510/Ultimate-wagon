# Wagon Whisper — Backend API

Production-ready Node.js/Express/MongoDB backend for the Wagon Whisper railway wagon maintenance management system.

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
```

### 3. Seed default users

```bash
npm run seed
```

This creates:
| Email | Password | Role |
|---|---|---|
| admin@wagonwhisper.com | Admin@123 | Admin |
| sse@wagonwhisper.com | Sse@123 | SSE |
| je@wagonwhisper.com | Je@1234 | JE |
| supervisor@wagonwhisper.com | Sup@123 | Supervisor |
| tech@wagonwhisper.com | Tech@123 | Technician |
| viewer@wagonwhisper.com | View@123 | Viewer |

### 4. Start development server

```bash
npm run dev
```

Server runs at `http://localhost:5000`.

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user (Admin only) |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/change-password` | Change password |
| POST | `/auth/refresh-token` | Refresh JWT |

### Wagons
| Method | Endpoint | Description |
|---|---|---|
| POST | `/wagons` | Create wagon |
| GET | `/wagons` | List wagons (paginated) |
| GET | `/wagons/search?q=...` | Search wagons |
| GET | `/wagons/:id` | Get wagon |
| GET | `/wagons/:id/history` | Full wagon history |
| PUT | `/wagons/:id` | Update wagon |
| DELETE | `/wagons/:id` | Delete wagon |

### Sick Line
| Method | Endpoint | Description |
|---|---|---|
| POST | `/sick-line` | Create entry |
| GET | `/sick-line` | List entries |
| GET | `/sick-line/:id` | Get entry |
| PUT | `/sick-line/:id` | Update entry |
| PUT | `/sick-line/:id/assign` | Assign staff |
| PUT | `/sick-line/:id/close` | Close case |
| DELETE | `/sick-line/:id` | Delete entry |

### ROH
| Method | Endpoint | Description |
|---|---|---|
| POST | `/roh` | Create ROH |
| GET | `/roh` | List ROH records |
| GET | `/roh/:id` | Get ROH |
| PUT | `/roh/:id` | Update ROH |
| PUT | `/roh/:id/start` | Start ROH |
| PUT | `/roh/:id/complete` | Complete ROH |
| DELETE | `/roh/:id` | Delete ROH |

### Inspections
| Method | Endpoint | Description |
|---|---|---|
| POST | `/inspections` | Create inspection |
| GET | `/inspections` | List inspections |
| GET | `/inspections/:id` | Get inspection |
| PUT | `/inspections/:id` | Update inspection |
| DELETE | `/inspections/:id` | Delete inspection |

### Brake Tests
| Method | Endpoint | Description |
|---|---|---|
| POST | `/brake-tests` | Create test |
| GET | `/brake-tests` | List tests |
| GET | `/brake-tests/:id` | Get test |
| PUT | `/brake-tests/:id` | Update test |
| DELETE | `/brake-tests/:id` | Delete test |

### Repairs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/repairs` | Create repair |
| GET | `/repairs` | List repairs |
| GET | `/repairs/:id` | Get repair |
| PUT | `/repairs/:id` | Update repair |
| PUT | `/repairs/:id/complete` | Complete repair |
| PUT | `/repairs/:id/verify` | Verify repair |
| DELETE | `/repairs/:id` | Delete repair |

### Certifications
| Method | Endpoint | Description |
|---|---|---|
| POST | `/certifications` | Issue cert |
| GET | `/certifications` | List certs |
| GET | `/certifications/expiring?days=30` | Expiring certs |
| GET | `/certifications/:id` | Get cert |
| PUT | `/certifications/:id` | Update cert |
| PUT | `/certifications/:id/revoke` | Revoke cert |
| DELETE | `/certifications/:id` | Delete cert |

### Movements
| Method | Endpoint | Description |
|---|---|---|
| POST | `/movements` | Log movement |
| GET | `/movements` | List movements |
| GET | `/movements/:id` | Get movement |
| GET | `/movements/wagon/:wagonId` | Wagon history |
| PUT | `/movements/:id` | Update movement |
| DELETE | `/movements/:id` | Delete movement |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/daily?date=2026-06-23` | Daily report |
| GET | `/reports/monthly?year=2026&month=6` | Monthly report |
| GET | `/reports/wagon/:wagonId` | Wagon report |
| GET | `/reports/roh` | ROH report |
| GET | `/reports/sick-line` | Sick line report |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/stats` | Aggregated stats |
| GET | `/dashboard/recent-activity` | Recent activity |

---

## Pagination

All list endpoints support:
- `?page=1&limit=20` — pagination
- `?sort=-createdAt,name` — sorting (prefix `-` for desc)

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Example: Login & Create Wagon

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wagonwhisper.com","password":"Admin@123"}'

# Use the accessToken from response
TOKEN="your-token-here"

# Create wagon
curl -X POST http://localhost:5000/api/v1/wagons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "wagonNo": "42081234567",
    "type": "BTPGLN",
    "owner": "Western Railway",
    "category": "Tank Wagon",
    "builtYear": 2015,
    "status": "In Service"
  }'
```

---

## Deployment on Render

1. Create a new **Web Service** on Render
2. Connect your Git repository
3. Set:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
4. Add environment variables:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — strong random string
   - `JWT_REFRESH_SECRET` — different strong random string
   - `NODE_ENV` — `production`
   - `CLIENT_URL` — your frontend URL
5. Deploy

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston + Morgan
