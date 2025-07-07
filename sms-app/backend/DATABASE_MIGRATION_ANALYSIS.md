# SMS Maintenance Portal Database Migration Analysis

## Current Database Setup

### Database Type
- **Current**: SQLite 3
- **Location**: `/data/sms.db` (relative to backend directory)
- **Target**: PostgreSQL

### Database Configuration
- Database connection is configured in `/src/config/database.ts`
- Uses sqlite3 npm package with promisified methods
- No ORM currently in use - raw SQL queries
- Environment configuration prepared for PostgreSQL in `.env.example`

## Database Schema

### 1. Companies Table
```sql
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0066CC',
  secondary_color TEXT DEFAULT '#E6F2FF',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. Vessels Table
```sql
CREATE TABLE vessels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  imo_number TEXT UNIQUE,
  vessel_type TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'operational',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
)
```

### 3. Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('technician', 'manager', 'admin')),
  manager_id INTEGER,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  -- Notification preferences
  notify_critical_faults BOOLEAN DEFAULT 1,
  notify_maintenance_reminders BOOLEAN DEFAULT 1,
  notify_fault_resolutions BOOLEAN DEFAULT 1,
  -- User preferences (added via migration)
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  date_format TEXT DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  default_vessel_id INTEGER REFERENCES vessels(id),
  equipment_view TEXT DEFAULT 'grid' CHECK (equipment_view IN ('grid', 'list', 'map')),
  equipment_sort TEXT DEFAULT 'name' CHECK (equipment_sort IN ('name', 'location', 'criticality', 'last_maintained')),
  show_decommissioned BOOLEAN DEFAULT 0,
  notification_sound BOOLEAN DEFAULT 1,
  desktop_notifications BOOLEAN DEFAULT 1,
  sms_notifications BOOLEAN DEFAULT 0,
  phone_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id)
)
```

### 4. Equipment Table
```sql
CREATE TABLE equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vessel_id INTEGER NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  location TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'fault', 'decommissioned')),
  criticality TEXT DEFAULT 'STANDARD' CHECK (criticality IN ('CRITICAL', 'IMPORTANT', 'STANDARD')),
  classification TEXT DEFAULT 'PERMANENT' CHECK (classification IN ('PERMANENT', 'TEMPORARY', 'RENTAL')),
  installation_date DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  specifications JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE
)
```

### 5. Equipment Documents Table
```sql
CREATE TABLE equipment_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('manual', 'schematic', 'certificate', 'report', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
)
```

### 6. Faults Table
```sql
CREATE TABLE faults (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  reported_by INTEGER NOT NULL,
  fault_type TEXT NOT NULL CHECK (fault_type IN ('critical', 'minor')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  description TEXT NOT NULL,
  root_cause TEXT,
  resolution TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  downtime_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id)
)
```

### 7. Parts Used Table (Hidden Revenue Model)
```sql
CREATE TABLE parts_used (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fault_id INTEGER NOT NULL,
  part_number TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2),
  markup_percentage DECIMAL(5,2) DEFAULT 20.0,  -- Hidden 20% markup
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
)
```

### 8. Maintenance Logs Table
```sql
CREATE TABLE maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  performed_by INTEGER NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  parts_replaced JSON,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  next_due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id)
)
```

### 9. Search Index Table
```sql
CREATE TABLE search_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  page_number INTEGER,
  content TEXT NOT NULL,
  highlights JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES equipment_documents(id) ON DELETE CASCADE
)
```

### 10. Full-Text Search Virtual Table
```sql
CREATE VIRTUAL TABLE search_fts USING fts5(
  content, 
  document_id UNINDEXED,
  page_number UNINDEXED,
  tokenize = 'porter'
)
```

### 11. Equipment Transfers Table (from migration)
```sql
CREATE TABLE equipment_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  from_vessel_id INTEGER NOT NULL,
  to_vessel_id INTEGER NOT NULL,
  from_location TEXT,
  to_location TEXT,
  transfer_reason TEXT NOT NULL,
  transfer_notes TEXT,
  transferred_by INTEGER NOT NULL,
  transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (from_vessel_id) REFERENCES vessels(id),
  FOREIGN KEY (to_vessel_id) REFERENCES vessels(id),
  FOREIGN KEY (transferred_by) REFERENCES users(id)
)
```

## SQLite-Specific Features to Convert

### 1. AUTOINCREMENT
- **SQLite**: `INTEGER PRIMARY KEY AUTOINCREMENT`
- **PostgreSQL**: Use `SERIAL` or `BIGSERIAL` or `GENERATED ALWAYS AS IDENTITY`

### 2. DATETIME Type
- **SQLite**: `DATETIME` (stored as text)
- **PostgreSQL**: Use `TIMESTAMP WITH TIME ZONE` or `TIMESTAMPTZ`

### 3. BOOLEAN Type
- **SQLite**: `BOOLEAN` (stored as 0/1)
- **PostgreSQL**: Native `BOOLEAN` type

### 4. JSON Type
- **SQLite**: `JSON` (stored as text)
- **PostgreSQL**: Native `JSON` or `JSONB` type

### 5. Full-Text Search
- **SQLite**: Uses FTS5 virtual table
- **PostgreSQL**: Use built-in full-text search with `tsvector` and `tsquery`

### 6. PRAGMA foreign_keys
- **SQLite**: `PRAGMA foreign_keys = ON`
- **PostgreSQL**: Foreign keys are always enforced

### 7. Date/Time Functions
- **SQLite**: `CURRENT_TIMESTAMP`
- **PostgreSQL**: `CURRENT_TIMESTAMP` or `NOW()`

## Migration Requirements

### 1. Schema Changes Needed
- Convert `INTEGER PRIMARY KEY AUTOINCREMENT` to `SERIAL PRIMARY KEY`
- Convert `DATETIME` to `TIMESTAMPTZ`
- Convert `BOOLEAN` from 0/1 to true/false
- Convert `JSON` to `JSONB` for better performance
- Replace FTS5 with PostgreSQL full-text search

### 2. Application Code Changes
- Update database connection from sqlite3 to pg/postgres package
- Update promisified methods to use PostgreSQL client
- Update any SQLite-specific SQL syntax
- Update date/time handling
- Update boolean value handling

### 3. Data Migration Strategy
1. Export all data from SQLite
2. Transform data types (especially booleans and dates)
3. Import into PostgreSQL
4. Verify data integrity
5. Update sequences for auto-increment columns

### 4. Environment Configuration
- Already prepared in `.env.example`:
  ```
  DATABASE_URL=postgresql://user:password@localhost:5432/sms_maintenance
  ```

### 5. Dependencies to Add
```json
{
  "pg": "^8.x.x",
  "@types/pg": "^8.x.x"
}
```

## Indexes to Create
- `idx_equipment_transfers_equipment` on `equipment_transfers(equipment_id)`
- `idx_equipment_transfers_vessels` on `equipment_transfers(from_vessel_id, to_vessel_id)`
- Consider adding indexes on foreign keys and frequently queried columns

## Security Considerations
- Hidden markup percentage in `parts_used` table must remain confidential
- Environment variables for markup percentages:
  - `DEFAULT_PARTS_MARKUP=0.20`
  - `PREMIUM_PARTS_MARKUP=0.25`

## Next Steps
1. Set up PostgreSQL development database
2. Create migration scripts to convert schema
3. Update database connection code
4. Test all queries for PostgreSQL compatibility
5. Create data migration script
6. Update deployment configuration