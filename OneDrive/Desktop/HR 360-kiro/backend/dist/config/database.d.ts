import { Pool, PoolClient } from 'pg';
declare function getPool(): Pool;
export declare function query(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
export declare function getClient(): Promise<PoolClient>;
export declare function initializeDatabase(): Promise<void>;
declare const _default: {
    getPool: typeof getPool;
    query: typeof query;
    getClient: typeof getClient;
    initializeDatabase: typeof initializeDatabase;
};
export default _default;
//# sourceMappingURL=database.d.ts.map