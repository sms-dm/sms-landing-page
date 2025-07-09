# Manager Dashboard

This module contains the manager dashboard for vessel onboarding assignments.

## Features

1. **Vessel Assignment Interface**
   - Shows vessels needing onboarding
   - Simple dropdown to assign technicians or HSE officers
   - No complex scheduling or availability tracking

2. **Progress Indicator**
   - Shows X of Y vessels assigned
   - Visual progress bar

3. **Team Members List**
   - Simple list showing names of technicians and HSE officers
   - Active status indicator

4. **Assignment Tracking**
   - Current assignments display
   - Status tracking (pending, in progress, completed)

5. **Login Reminders**
   - Option to send reminder when assigning vessels
   - Checkbox in assignment dialog

## Components

- `ReviewDashboardPage` - Main dashboard page
- `VesselAssignmentCard` - Individual vessel card with assign button
- `TeamMembersList` - Display team members by role
- `AssignmentStats` - Statistics cards showing assignment progress
- `AssignVesselDialog` - Modal for assigning vessels to team members

## API Endpoints

The manager dashboard uses the following API endpoints:

- `GET /manager/vessels/needing-onboarding` - Get vessels awaiting assignment
- `GET /manager/team-members` - Get available team members
- `GET /manager/assignments` - Get current assignments
- `POST /manager/assignments` - Create new assignment
- `GET /manager/assignments/stats` - Get assignment statistics

## Usage

The manager dashboard is accessible at `/manager/review` route for users with MANAGER role.