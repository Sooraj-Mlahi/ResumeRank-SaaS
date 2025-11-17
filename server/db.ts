// Database setup using Neon PostgreSQL with optimizations
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Optimize Neon configuration for better performance
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Use HTTP for better connection pooling
neonConfig.fetchConnectionCache = true; // Enable connection caching

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections in pool
  min: 2, // Minimum connections to maintain
  idleTimeoutMillis: 10000, // Close idle connections after 10s
  connectionTimeoutMillis: 3000, // Connection timeout 3s
  acquireTimeoutMillis: 2000, // Acquire connection timeout 2s
});

export const db = drizzle(pool, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query) => console.log('[DB Query]:', query)
  } : false
});
