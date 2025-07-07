import React from 'react';
import { Ship, UserCheck, Users, Wrench } from 'lucide-react';
import { useMockAuth } from '@/hooks/useMockAuth';

const DemoSelector: React.FC = () => {
  const { setMockUser } = useMockAuth();

  const demoRoles = [
    {
      role: 'admin',
      title: 'Admin Dashboard',
      description: 'Company setup, user management, vessel configuration',
      icon: UserCheck,
      color: 'from-purple-600 to-purple-800',
      shadowColor: 'shadow-purple-500/30',
    },
    {
      role: 'manager',
      title: 'Manager Dashboard',
      description: 'Vessel assignments, team oversight, equipment approval',
      icon: Users,
      color: 'from-blue-600 to-blue-800',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      role: 'technician',
      title: 'Technician Dashboard',
      description: 'Equipment onboarding, maintenance tasks, quality checks',
      icon: Wrench,
      color: 'from-green-600 to-green-800',
      shadowColor: 'shadow-green-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sms-dark to-sms-gray flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-sms-cyan to-sms-blue rounded-2xl flex items-center justify-center shadow-lg shadow-sms-cyan/30">
              <Ship className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">SMS Onboarding Portal</h1>
          <p className="text-xl text-gray-400">Demo Mode - Select a role to explore</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {demoRoles.map((demo) => {
            const Icon = demo.icon;
            return (
              <button
                key={demo.role}
                onClick={() => setMockUser(demo.role as 'admin' | 'manager' | 'technician')}
                className="group relative bg-sms-dark border border-gray-700 rounded-xl p-8 hover:border-sms-blue transition-all duration-300 hover:shadow-xl hover:shadow-sms-blue/20 hover:scale-105"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${demo.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${demo.color} rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg ${demo.shadowColor}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sms-cyan transition-colors">
                    {demo.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {demo.description}
                  </p>
                  <div className="mt-6 flex items-center justify-center text-sms-cyan">
                    <span className="text-sm font-medium">Enter as {demo.role}</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            This is a UI demo without database connection. Some features may show mock data.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            To exit demo mode, clear your browser's localStorage
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoSelector;