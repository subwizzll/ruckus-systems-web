import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required for @workspace/database");
    _sql = neon(url);
  }
  return _sql;
}

// Proxy keeps the named `sql` export but defers initialization until first use
export const sql = new Proxy(function () {} as unknown as NeonQueryFunction<false, false>, {
  apply(_t, _this, args) {
    return (getSql() as any)(...args);
  },
  get(_t, prop) {
    return (getSql() as any)[prop];
  },
});
