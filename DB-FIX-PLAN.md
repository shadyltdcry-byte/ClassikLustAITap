# Fix plan
- Create userUpgrades.level column missing error by adjusting schema to proper types and not dropping tables if exist. Use integer level column.
- Stop UUID casting errors by not using uuid type; use TEXT for ids.
- Ensure sync upsert uses correct table/columns.
