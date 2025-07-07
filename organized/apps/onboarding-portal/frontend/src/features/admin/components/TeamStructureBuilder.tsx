import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, UserRole } from '@/types';
import { 
  Users, 
  UserPlus, 
  UserMinus,
  Search,
  ChevronDown,
  ChevronRight,
  Building,
  Shield,
  Wrench,
  ArrowRight
} from 'lucide-react';

interface TeamMember {
  id: string;
  user: User;
  managerId?: string;
  departmentId?: string;
}

interface TeamStructure {
  managerId: string;
  managerName: string;
  departmentName: string;
  members: TeamMember[];
}

export const TeamStructureBuilder: React.FC = () => {
  const [teamStructures, setTeamStructures] = useState<TeamStructure[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<TeamMember[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedMember, setDraggedMember] = useState<TeamMember | null>(null);
  const [dragOverTeam, setDragOverTeam] = useState<string | null>(null);

  // Mock data
  useEffect(() => {
    const mockStructures: TeamStructure[] = [
      {
        managerId: 'mgr1',
        managerName: 'John Smith',
        departmentName: 'Engineering',
        members: [
          {
            id: '1',
            user: {
              id: 'tech1',
              email: 'tech1@company.com',
              role: UserRole.TECHNICIAN,
              companyId: 'company1',
              firstName: 'Alice',
              lastName: 'Williams',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            managerId: 'mgr1',
            departmentId: 'dept1'
          },
          {
            id: '2',
            user: {
              id: 'tech2',
              email: 'tech2@company.com',
              role: UserRole.TECHNICIAN,
              companyId: 'company1',
              firstName: 'Bob',
              lastName: 'Martinez',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            managerId: 'mgr1',
            departmentId: 'dept1'
          }
        ]
      },
      {
        managerId: 'mgr2',
        managerName: 'Sarah Johnson',
        departmentName: 'Deck Operations',
        members: [
          {
            id: '3',
            user: {
              id: 'tech3',
              email: 'tech3@company.com',
              role: UserRole.TECHNICIAN,
              companyId: 'company1',
              firstName: 'Charlie',
              lastName: 'Davis',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            managerId: 'mgr2',
            departmentId: 'dept2'
          }
        ]
      }
    ];

    const mockUnassigned: TeamMember[] = [
      {
        id: '4',
        user: {
          id: 'tech4',
          email: 'david.brown@company.com',
          role: UserRole.TECHNICIAN,
          companyId: 'company1',
          firstName: 'David',
          lastName: 'Brown',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: '5',
        user: {
          id: 'tech5',
          email: 'emma.wilson@company.com',
          role: UserRole.TECHNICIAN,
          companyId: 'company1',
          firstName: 'Emma',
          lastName: 'Wilson',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    setTeamStructures(mockStructures);
    setUnassignedMembers(mockUnassigned);
    // Expand all teams by default
    setExpandedTeams(new Set(mockStructures.map(ts => ts.managerId)));
  }, []);

  const toggleTeamExpansion = (managerId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerId)) {
        newSet.delete(managerId);
      } else {
        newSet.add(managerId);
      }
      return newSet;
    });
  };

  const handleDragStart = (member: TeamMember) => {
    setDraggedMember(member);
  };

  const handleDragOver = (e: React.DragEvent, managerId: string | null) => {
    e.preventDefault();
    setDragOverTeam(managerId);
  };

  const handleDrop = (e: React.DragEvent, targetManagerId: string | null) => {
    e.preventDefault();
    if (!draggedMember) return;

    // Remove from current location
    if (draggedMember.managerId) {
      setTeamStructures(prev => prev.map(team => 
        team.managerId === draggedMember.managerId
          ? { ...team, members: team.members.filter(m => m.id !== draggedMember.id) }
          : team
      ));
    } else {
      setUnassignedMembers(prev => prev.filter(m => m.id !== draggedMember.id));
    }

    // Add to new location
    if (targetManagerId) {
      const updatedMember = { ...draggedMember, managerId: targetManagerId };
      setTeamStructures(prev => prev.map(team =>
        team.managerId === targetManagerId
          ? { ...team, members: [...team.members, updatedMember] }
          : team
      ));
    } else {
      const updatedMember = { ...draggedMember, managerId: undefined };
      setUnassignedMembers(prev => [...prev, updatedMember]);
    }

    setDraggedMember(null);
    setDragOverTeam(null);
  };

  const handleAssignMember = (member: TeamMember, managerId: string) => {
    setUnassignedMembers(prev => prev.filter(m => m.id !== member.id));
    const updatedMember = { ...member, managerId };
    setTeamStructures(prev => prev.map(team =>
      team.managerId === managerId
        ? { ...team, members: [...team.members, updatedMember] }
        : team
    ));
  };

  const handleUnassignMember = (member: TeamMember) => {
    setTeamStructures(prev => prev.map(team =>
      team.managerId === member.managerId
        ? { ...team, members: team.members.filter(m => m.id !== member.id) }
        : team
    ));
    const updatedMember = { ...member, managerId: undefined };
    setUnassignedMembers(prev => [...prev, updatedMember]);
  };

  const filteredUnassigned = unassignedMembers.filter(member =>
    member.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Structure Builder</h1>
        <p className="mt-2 text-gray-600">Build and organize your team hierarchy by assigning technicians to managers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Members */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-full">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Unassigned Members</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div 
              className={`space-y-2 min-h-[400px] border-2 border-dashed rounded-lg p-4 ${
                dragOverTeam === null ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => handleDragOver(e, null)}
              onDrop={(e) => handleDrop(e, null)}
            >
              {filteredUnassigned.map((member) => (
                <div
                  key={member.id}
                  draggable
                  onDragStart={() => handleDragStart(member)}
                  className="bg-white p-3 rounded-md shadow-sm cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredUnassigned.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No matching members found' : 'All members are assigned'}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Team Structures */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Team Assignments</h2>
          
          {teamStructures.map((team) => (
            <Card key={team.managerId} className="p-4">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => toggleTeamExpansion(team.managerId)}
              >
                <div className="flex items-center">
                  <button className="mr-2">
                    {expandedTeams.has(team.managerId) ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full mr-3 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{team.managerName}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        {team.departmentName}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  {team.members.length} members
                </div>
              </div>

              {expandedTeams.has(team.managerId) && (
                <div 
                  className={`ml-8 min-h-[100px] border-2 border-dashed rounded-lg p-4 ${
                    dragOverTeam === team.managerId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}
                  onDragOver={(e) => handleDragOver(e, team.managerId)}
                  onDrop={(e) => handleDrop(e, team.managerId)}
                >
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        draggable
                        onDragStart={() => handleDragStart(member)}
                        className="bg-white p-3 rounded-md shadow-sm cursor-move hover:shadow-md transition-shadow flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                            <Wrench className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{member.user.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignMember(member)}
                          className="opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {team.members.length === 0 && (
                      <div className="text-center py-4 text-gray-400">
                        Drag members here to assign to {team.managerName}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-start">
            <ArrowRight className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Drag and drop members between teams or to unassigned area
          </li>
          <li className="flex items-start">
            <ArrowRight className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Click on team headers to expand/collapse member lists
          </li>
          <li className="flex items-start">
            <ArrowRight className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Use the search box to quickly find specific members
          </li>
        </ul>
      </div>
    </div>
  );
};