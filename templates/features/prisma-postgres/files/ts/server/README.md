# MERN Stacker App

## Development

### Database Setup

If using Prisma, push the schema to your database:

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
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio UI
