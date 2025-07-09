# Parts Intelligence System - Feature Documentation

## Overview
The SMS Onboarding Portal includes a sophisticated Parts Intelligence System that provides cross-referencing capabilities, stock level recommendations, and critical parts tracking across multiple equipment and vessels.

## Core Features Found in Codebase

### 1. Parts Cross-Reference System

#### Database Structure (from schema.sql)
- **parts_cross_reference table**: Links original parts with compatible alternatives
  - Tracks compatibility types: 'EXACT', 'COMPATIBLE', 'SUBSTITUTE'
  - Verified by users with timestamp tracking
  - Unique constraint on original_part_id and compatible_part_id pairs

#### Materialized View: mv_parts_intelligence
```sql
- Aggregates parts data across vessels
- Tracks which equipment uses which parts
- Counts equipment using each part
- Provides vessel-wide parts analysis
```

### 2. Critical Parts Management

#### CriticalPart Model Features (from schema.prisma)
- **Stock Tracking**:
  - `minimumStock`: Minimum stock level threshold
  - `currentStock`: Current inventory count
  - `quantity`: Required quantity per equipment
  
- **Criticality Levels**:
  - CRITICAL: Essential for operation
  - IMPORTANT: Significant impact if unavailable
  - STANDARD: Regular maintenance parts

### 3. Parts Intelligence Functions (from 001_performance_indexes.sql)

#### find_compatible_parts() Function
- Searches for compatible parts across all vessels in a company
- Returns exact matches and cross-referenced alternatives
- Shows current stock levels for each compatible part
- Includes vessel and equipment information for each part location

### 4. Cross-Equipment Parts Usage

#### Equipment-Parts Relationship
- Each equipment can have multiple critical parts
- Parts are tracked with:
  - Part number and manufacturer
  - Current vs minimum stock levels
  - Unit of measure and specifications
  - Criticality rating

### 5. API Endpoints for Parts Intelligence

#### From API Documentation:
- `POST /parts/cross-reference`: Find cross-reference parts
  - Input: partNumber, manufacturer, vesselId
  - Returns: Alternative parts and usage across vessels

### 6. Stock Level Intelligence

#### Built-in Features:
- **Minimum Stock Tracking**: Each part has a defined minimum stock level
- **Current Stock Monitoring**: Real-time inventory levels
- **Stock Constraint**: Database constraint ensures stock levels >= 0

### 7. Parts Search Capabilities

#### Advanced Search Features:
- Full-text search on parts (name, part number, manufacturer, description)
- Fuzzy search using trigram indexes
- GIN indexes for high-performance searches

## Key Differentiators

### 1. Multi-Equipment Cross-Reference
- Parts can be linked across different equipment types
- System tracks which equipment uses which parts
- Compatibility matrix shows alternative parts

### 2. Fleet-Wide Intelligence
- Parts usage visible across entire fleet
- Can identify common parts used in multiple vessels
- Helps optimize inventory across company

### 3. Critical Systems Tracking
- Equipment criticality levels (CRITICAL, IMPORTANT, STANDARD)
- Parts inherit criticality from their equipment
- Prioritizes stock levels for critical parts

### 4. Verification System
- Cross-references can be verified by authorized users
- Timestamp and user tracking for accountability
- Notes field for additional compatibility information

## Example Use Cases

### 1. Critical Part Stock Alert
When a critical part's current stock falls below minimum:
- System can identify all equipment using that part
- Shows criticality level of affected equipment
- Recommends reorder based on lead time

### 2. Cross-Fleet Part Availability
When a part is needed urgently:
- Search across all vessels for compatible parts
- See current stock levels at each location
- Find verified alternatives if exact match unavailable

### 3. Maintenance Planning
- View all critical parts for scheduled maintenance
- Check stock levels before maintenance window
- Order parts based on minimum stock requirements

## Implementation Status

Based on the codebase analysis:
- ✅ Database schema fully implemented
- ✅ Parts cross-reference table created
- ✅ Materialized view for parts intelligence
- ✅ Search functions implemented
- ✅ API endpoints defined
- ✅ Stock level tracking in place
- ✅ Criticality system implemented

## Recommended Stock Level Formula

While not explicitly coded, the system supports implementing:
```
Recommended Stock = (Equipment Count × Required Quantity) + Safety Stock
Where Safety Stock = Based on criticality level and lead time
```

## Data Relationships

```
Company
  └── Vessels
      └── Equipment (with criticality levels)
          └── Critical Parts (with stock levels)
              └── Cross References (compatibility matrix)
```

This parts intelligence system provides the foundation for advanced inventory management, predictive maintenance, and fleet-wide parts optimization.