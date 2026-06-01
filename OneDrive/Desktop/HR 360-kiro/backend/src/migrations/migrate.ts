/**
 * Database Migration Runner
 * Handles running SQL migration files in order
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationRecord {
  id: number;
  filename: string;
  executed_at: Date;
}

class MigrationRunner {
  private pool: Pool;

  constructor() {
    const poolConfig: any = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      database: process.env.DB_NAME || 'hr360_dev',
    };

    // Add password - use empty string if not provided
    poolConfig.password = process.env.DB_PASSWORD || '';

    this.pool = new Pool(poolConfig);
  }

  /**
   * Initialize migrations table
   */
  async initializeMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.pool.query(query);
    console.log('✅ Migrations table initialized');
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.pool.query(
      'SELECT * FROM migrations ORDER BY id ASC'
    );
    return result.rows;
  }

  /**
   * Get pending migration files
   */
  getPendingMigrations(executedMigrations: MigrationRecord[]): string[] {
    const migrationsDir = __dirname;
    const allFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const executedFilenames = new Set(
      executedMigrations.map(m => m.filename)
    );

    return allFiles.filter(file => !executedFilenames.has(file));
  }

  /**
   * Execute a single migration file
   */
  async executeMigration(filename: string): Promise<void> {
    const filePath = join(__dirname, filename);
    const sql = readFileSync(filePath, 'utf8');

    console.log(`🔄 Executing migration: ${filename}`);

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute the migration SQL
      await client.query(sql);
      
      // Record the migration
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Migration completed: ${filename}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration failed: ${filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('🚀 Starting database migrations...');
      
      await this.initializeMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const pendingMigrations = this.getPendingMigrations(executedMigrations);
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }
      
      console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach(file => console.log(`   - ${file}`));
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('🎉 All migrations completed successfully');
      
    } catch (error) {
      console.error('💥 Migration process failed:', error);
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  createMigration(name: string): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filePath = join(__dirname, filename);
    
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add your migration description here

-- Add your SQL statements here
-- Example:
-- CREATE TABLE example (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
`;
    
    require('fs').writeFileSync(filePath, template);
    console.log(`📝 Created migration file: ${filename}`);
    return filename;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const runner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'run':
        await runner.runMigrations();
        break;
        
      case 'create':
        const migrationName = args[1];
        if (!migrationName) {
          console.error('❌ Please provide a migration name');
          console.log('Usage: npm run migrate create "migration name"');
          process.exit(1);
        }
        runner.createMigration(migrationName);
        break;
        
      case 'status':
        await runner.initializeMigrationsTable();
        const executed = await runner.getExecutedMigrations();
        const pending = runner.getPendingMigrations(executed);
        
        console.log('📊 Migration Status:');
        console.log(`   Executed: ${executed.length}`);
        console.log(`   Pending: ${pending.length}`);
        
        if (executed.length > 0) {
          console.log('\n✅ Executed migrations:');
          executed.forEach(m => {
            console.log(`   - ${m.filename} (${m.executed_at.toISOString()})`);
          });
        }
        
        if (pending.length > 0) {
          console.log('\n⏳ Pending migrations:');
          pending.forEach(file => console.log(`   - ${file}`));
        }
        break;
        
      default:
        console.log('HR 360 Database Migration Tool');
        console.log('');
        console.log('Commands:');
        console.log('  run                    - Run all pending migrations');
        console.log('  create <name>          - Create a new migration file');
        console.log('  status                 - Show migration status');
        console.log('');
        console.log('Examples:');
        console.log('  npm run migrate run');
        console.log('  npm run migrate create "add user preferences"');
        console.log('  npm run migrate status');
        break;
    }
  } catch (error) {
    console.error('💥 Migration command failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { MigrationRunner };