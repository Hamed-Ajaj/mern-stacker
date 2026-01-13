# MERN Stacker App

## Development

### Database Setup

If using Drizzle ORM, push schema to your database:

```bash
cd server
cp .env.example .env
npm run db:push
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npm run dev
```

## Database Commands

- `npm run db:push` - Push schema changes directly to database
- `npm run db:generate` - Generate migration files
- `npm run db:studio` - Open Drizzle Studio UI
