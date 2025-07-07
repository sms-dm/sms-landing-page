#!/usr/bin/env python3
"""
SQLite to PostgreSQL Data Migration Script
SMS Maintenance Portal
Created: 2025-01-06
"""

import sqlite3
import psycopg2
import json
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

class MaintenancePortalMigrator:
    def __init__(self, sqlite_path: str, pg_config: Dict[str, str]):
        self.sqlite_path = sqlite_path
        self.pg_config = pg_config
        self.sqlite_conn = None
        self.pg_conn = None
        self.pg_cursor = None
        
    def connect(self):
        """Establish database connections"""
        try:
            # Connect to SQLite
            self.sqlite_conn = sqlite3.connect(self.sqlite_path)
            self.sqlite_conn.row_factory = sqlite3.Row
            
            # Connect to PostgreSQL
            self.pg_conn = psycopg2.connect(**self.pg_config)
            self.pg_cursor = self.pg_conn.cursor()
            
            # Disable foreign key checks during migration
            self.pg_cursor.execute("SET session_replication_role = 'replica'")
            
            print("✅ Connected to both databases")
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            sys.exit(1)
    
    def disconnect(self):
        """Close database connections"""
        if self.sqlite_conn:
            self.sqlite_conn.close()
        if self.pg_conn:
            self.pg_cursor.execute("SET session_replication_role = 'origin'")
            self.pg_conn.commit()
            self.pg_conn.close()
        print("✅ Connections closed")
    
    def convert_boolean(self, value: Any) -> Optional[bool]:
        """Convert SQLite boolean (0/1) to PostgreSQL boolean"""
        if value is None:
            return None
        return bool(value)
    
    def convert_datetime(self, value: Any) -> Optional[str]:
        """Convert SQLite datetime to PostgreSQL timestamp"""
        if value is None:
            return None
        # SQLite datetime is already in ISO format
        return value
    
    def convert_json(self, value: Any) -> Optional[str]:
        """Convert SQLite JSON to PostgreSQL JSONB"""
        if value is None:
            return None
        # Ensure it's valid JSON
        try:
            if isinstance(value, str):
                json.loads(value)
                return value
            else:
                return json.dumps(value)
        except:
            return json.dumps({})
    
    def migrate_companies(self):
        """Migrate companies table"""
        print("\n📦 Migrating companies...")
        
        cursor = self.sqlite_conn.cursor()
        companies = cursor.execute("SELECT * FROM companies").fetchall()
        
        for company in companies:
            self.pg_cursor.execute("""
                INSERT INTO companies (id, name, slug, logo_url, primary_color, secondary_color, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                company['id'],
                company['name'],
                company['slug'],
                company['logo_url'],
                company['primary_color'],
                company['secondary_color'],
                self.convert_datetime(company['created_at']),
                self.convert_datetime(company['updated_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(companies)} companies")
    
    def migrate_vessels(self):
        """Migrate vessels table"""
        print("\n📦 Migrating vessels...")
        
        cursor = self.sqlite_conn.cursor()
        vessels = cursor.execute("SELECT * FROM vessels").fetchall()
        
        for vessel in vessels:
            self.pg_cursor.execute("""
                INSERT INTO vessels (id, company_id, name, imo_number, vessel_type, image_url, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                vessel['id'],
                vessel['company_id'],
                vessel['name'],
                vessel['imo_number'],
                vessel['vessel_type'],
                vessel['image_url'],
                vessel['status'],
                self.convert_datetime(vessel['created_at']),
                self.convert_datetime(vessel['updated_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(vessels)} vessels")
    
    def migrate_users(self):
        """Migrate users table with preference columns"""
        print("\n📦 Migrating users...")
        
        cursor = self.sqlite_conn.cursor()
        users = cursor.execute("SELECT * FROM users").fetchall()
        
        for user in users:
            self.pg_cursor.execute("""
                INSERT INTO users (
                    id, company_id, email, password_hash, first_name, last_name, role,
                    manager_id, avatar_url, is_active, last_login,
                    notify_critical_faults, notify_maintenance_reminders, notify_fault_resolutions,
                    theme, date_format, time_format, default_vessel_id,
                    equipment_view, equipment_sort, show_decommissioned,
                    notification_sound, desktop_notifications, sms_notifications,
                    phone_number, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (id) DO NOTHING
            """, (
                user['id'],
                user['company_id'],
                user['email'],
                user['password_hash'],
                user['first_name'],
                user['last_name'],
                user['role'],
                user['manager_id'],
                user['avatar_url'],
                self.convert_boolean(user['is_active']),
                self.convert_datetime(user['last_login']),
                self.convert_boolean(user.get('notify_critical_faults', 1)),
                self.convert_boolean(user.get('notify_maintenance_reminders', 1)),
                self.convert_boolean(user.get('notify_fault_resolutions', 1)),
                user.get('theme', 'dark'),
                user.get('date_format', 'MM/DD/YYYY'),
                user.get('time_format', '12h'),
                user.get('default_vessel_id'),
                user.get('equipment_view', 'grid'),
                user.get('equipment_sort', 'name'),
                self.convert_boolean(user.get('show_decommissioned', 0)),
                self.convert_boolean(user.get('notification_sound', 1)),
                self.convert_boolean(user.get('desktop_notifications', 1)),
                self.convert_boolean(user.get('sms_notifications', 0)),
                user.get('phone_number'),
                self.convert_datetime(user['created_at']),
                self.convert_datetime(user['updated_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(users)} users")
    
    def migrate_equipment(self):
        """Migrate equipment table"""
        print("\n📦 Migrating equipment...")
        
        cursor = self.sqlite_conn.cursor()
        equipment = cursor.execute("SELECT * FROM equipment").fetchall()
        
        for item in equipment:
            self.pg_cursor.execute("""
                INSERT INTO equipment (
                    id, vessel_id, qr_code, name, manufacturer, model, serial_number,
                    location, equipment_type, status, criticality, classification,
                    installation_date, last_maintenance_date, next_maintenance_date,
                    specifications, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (id) DO NOTHING
            """, (
                item['id'],
                item['vessel_id'],
                item['qr_code'],
                item['name'],
                item['manufacturer'],
                item['model'],
                item['serial_number'],
                item['location'],
                item['equipment_type'],
                item['status'],
                item['criticality'],
                item['classification'],
                item['installation_date'],
                item['last_maintenance_date'],
                item['next_maintenance_date'],
                self.convert_json(item['specifications']),
                self.convert_datetime(item['created_at']),
                self.convert_datetime(item['updated_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(equipment)} equipment items")
    
    def migrate_equipment_documents(self):
        """Migrate equipment documents table"""
        print("\n📦 Migrating equipment documents...")
        
        cursor = self.sqlite_conn.cursor()
        documents = cursor.execute("SELECT * FROM equipment_documents").fetchall()
        
        for doc in documents:
            self.pg_cursor.execute("""
                INSERT INTO equipment_documents (
                    id, equipment_id, document_type, file_name, file_path,
                    file_size, uploaded_by, description, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                doc['id'],
                doc['equipment_id'],
                doc['document_type'],
                doc['file_name'],
                doc['file_path'],
                doc['file_size'],
                doc['uploaded_by'],
                doc['description'],
                self.convert_datetime(doc['created_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(documents)} equipment documents")
    
    def migrate_faults(self):
        """Migrate faults table"""
        print("\n📦 Migrating faults...")
        
        cursor = self.sqlite_conn.cursor()
        faults = cursor.execute("SELECT * FROM faults").fetchall()
        
        for fault in faults:
            self.pg_cursor.execute("""
                INSERT INTO faults (
                    id, equipment_id, reported_by, fault_type, status,
                    description, root_cause, resolution, started_at, resolved_at,
                    downtime_minutes, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (id) DO NOTHING
            """, (
                fault['id'],
                fault['equipment_id'],
                fault['reported_by'],
                fault['fault_type'],
                fault['status'],
                fault['description'],
                fault['root_cause'],
                fault['resolution'],
                self.convert_datetime(fault['started_at']),
                self.convert_datetime(fault['resolved_at']),
                fault['downtime_minutes'],
                self.convert_datetime(fault['created_at']),
                self.convert_datetime(fault['updated_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(faults)} faults")
    
    def migrate_parts_used(self):
        """Migrate parts used table (with hidden markup)"""
        print("\n📦 Migrating parts used...")
        
        cursor = self.sqlite_conn.cursor()
        parts = cursor.execute("SELECT * FROM parts_used").fetchall()
        
        for part in parts:
            self.pg_cursor.execute("""
                INSERT INTO parts_used (
                    id, fault_id, part_number, description, quantity,
                    unit_cost, markup_percentage, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                part['id'],
                part['fault_id'],
                part['part_number'],
                part['description'],
                part['quantity'],
                part['unit_cost'],
                part['markup_percentage'],
                self.convert_datetime(part['created_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(parts)} parts used records")
    
    def migrate_maintenance_logs(self):
        """Migrate maintenance logs table"""
        print("\n📦 Migrating maintenance logs...")
        
        cursor = self.sqlite_conn.cursor()
        logs = cursor.execute("SELECT * FROM maintenance_logs").fetchall()
        
        for log in logs:
            self.pg_cursor.execute("""
                INSERT INTO maintenance_logs (
                    id, equipment_id, performed_by, maintenance_type,
                    description, parts_replaced, completed_at, next_due_date, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                log['id'],
                log['equipment_id'],
                log['performed_by'],
                log['maintenance_type'],
                log['description'],
                self.convert_json(log['parts_replaced']),
                self.convert_datetime(log['completed_at']),
                log['next_due_date'],
                self.convert_datetime(log['created_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(logs)} maintenance logs")
    
    def migrate_search_index(self):
        """Migrate search index table"""
        print("\n📦 Migrating search index...")
        
        cursor = self.sqlite_conn.cursor()
        indexes = cursor.execute("SELECT * FROM search_index").fetchall()
        
        for index in indexes:
            self.pg_cursor.execute("""
                INSERT INTO search_index (
                    id, document_id, page_number, content, highlights, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                index['id'],
                index['document_id'],
                index['page_number'],
                index['content'],
                self.convert_json(index['highlights']),
                self.convert_datetime(index['created_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(indexes)} search index entries")
    
    def migrate_equipment_transfers(self):
        """Migrate equipment transfers table"""
        print("\n📦 Migrating equipment transfers...")
        
        cursor = self.sqlite_conn.cursor()
        
        # Check if table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='equipment_transfers'
        """)
        
        if not cursor.fetchone():
            print("⚠️  Equipment transfers table not found in SQLite, skipping...")
            return
        
        transfers = cursor.execute("SELECT * FROM equipment_transfers").fetchall()
        
        for transfer in transfers:
            self.pg_cursor.execute("""
                INSERT INTO equipment_transfers (
                    id, equipment_id, from_vessel_id, to_vessel_id,
                    from_location, to_location, transfer_reason, transfer_notes,
                    transferred_by, transfer_date, status, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (id) DO NOTHING
            """, (
                transfer['id'],
                transfer['equipment_id'],
                transfer['from_vessel_id'],
                transfer['to_vessel_id'],
                transfer['from_location'],
                transfer['to_location'],
                transfer['transfer_reason'],
                transfer['transfer_notes'],
                transfer['transferred_by'],
                self.convert_datetime(transfer['transfer_date']),
                transfer['status'],
                self.convert_datetime(transfer['created_at']),
                self.convert_datetime(transfer['updated_at'])
            ))
        
        self.pg_conn.commit()
        print(f"✅ Migrated {len(transfers)} equipment transfers")
    
    def update_sequences(self):
        """Update PostgreSQL sequences to continue from highest IDs"""
        print("\n🔧 Updating sequences...")
        
        tables = [
            'companies', 'vessels', 'users', 'equipment', 'equipment_documents',
            'faults', 'parts_used', 'maintenance_logs', 'search_index', 'equipment_transfers'
        ]
        
        for table in tables:
            try:
                self.pg_cursor.execute(f"""
                    SELECT setval('{table}_id_seq', COALESCE((SELECT MAX(id) FROM {table}), 1))
                """)
            except Exception as e:
                print(f"⚠️  Could not update sequence for {table}: {e}")
        
        self.pg_conn.commit()
        print("✅ Sequences updated")
    
    def verify_migration(self):
        """Verify data was migrated successfully"""
        print("\n🔍 Verifying migration...")
        
        tables = [
            'companies', 'vessels', 'users', 'equipment', 'equipment_documents',
            'faults', 'parts_used', 'maintenance_logs', 'search_index'
        ]
        
        print("\n📊 Migration Summary:")
        print("-" * 40)
        
        for table in tables:
            # SQLite count
            cursor = self.sqlite_conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            sqlite_count = cursor.fetchone()[0]
            
            # PostgreSQL count
            self.pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            pg_count = self.pg_cursor.fetchone()[0]
            
            status = "✅" if sqlite_count == pg_count else "❌"
            print(f"{status} {table:20} SQLite: {sqlite_count:6} PostgreSQL: {pg_count:6}")
        
        print("-" * 40)
    
    def migrate_all(self):
        """Run all migrations in order"""
        try:
            self.connect()
            
            # Migrate tables in dependency order
            self.migrate_companies()
            self.migrate_vessels()
            self.migrate_users()
            self.migrate_equipment()
            self.migrate_equipment_documents()
            self.migrate_faults()
            self.migrate_parts_used()
            self.migrate_maintenance_logs()
            self.migrate_search_index()
            self.migrate_equipment_transfers()
            
            # Update sequences
            self.update_sequences()
            
            # Verify migration
            self.verify_migration()
            
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            if self.pg_conn:
                self.pg_conn.rollback()
            raise
        finally:
            self.disconnect()


if __name__ == "__main__":
    # Configuration
    SQLITE_DB_PATH = "data/sms.db"  # Adjust path as needed
    
    POSTGRESQL_CONFIG = {
        "host": "localhost",
        "port": 5432,
        "database": "sms_maintenance",
        "user": "sms_user",
        "password": "your_password"
    }
    
    # Run migration
    migrator = MaintenancePortalMigrator(SQLITE_DB_PATH, POSTGRESQL_CONFIG)
    migrator.migrate_all()