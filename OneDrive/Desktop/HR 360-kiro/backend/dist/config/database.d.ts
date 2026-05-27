import { Pool, PoolClient } from 'pg';
declare const pool: Pool;
export declare function query(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
export declare function getClient(): Promise<PoolClient>;
export declare function initializeDatabase(): Promise<void>;
export default pool;
//# sourceMappingURL=database.d.ts.map