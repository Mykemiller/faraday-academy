# Pending migrations

SQL written by a run that could not reach the database. Each file states its own
apply instructions and why it is still pending. Nothing here has been applied.

| File | Target | Status |
| --- | --- | --- |
| `academy_revalidate_fanout_lobby.sql` | Supabase `ycadmmngkdhvpcsrcuaq` | **Not applied** — Supabase MCP unauthorised and the local CLI token returns 401 (FDY-38, 2026-10-05) |
