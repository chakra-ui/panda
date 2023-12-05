## Database Migration

```bash
# Conntect to db
pscale connect playground <Branch> --port 3309

# Push schema changes
pnpm prisma db push

# Create deploy request
pscale deploy-request create playground <Branch>
```

### Resources

https://planetscale.com/docs/prisma/automatic-prisma-migrations
