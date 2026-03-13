import React from 'react';
import { Role } from '../types';
import { UsersIcon, ChevronRightIcon } from './Icons';

interface RoleSelectorProps {
  onSelect: (role: Role, name: string) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelect }) => {
  const [name, setName] = React.useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">ClassSync</h1>
            <p className="text-slate-500 mt-2">Real-time AI Classroom Translator</p>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
            </div>

            <div className="pt-4 space-y-3">
                <button 
                    onClick={() => name && onSelect(Role.TEACHER, name)}
                    disabled={!name}
                    className="w-full flex items-center justify-between p-4 border-2 border-slate-100 hover:border-indigo-500 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-left">
                        <span className="block font-semibold text-lg text-slate-900 group-hover:text-indigo-600">I am a Teacher</span>
                        <span className="text-sm text-slate-500">Host session, view dashboard</span>
                    </div>
                    <ChevronRightIcon className="text-slate-300 group-hover:text-indigo-500" />
                </button>

                <button 
                    onClick={() => name && onSelect(Role.STUDENT, name)}
                    disabled={!name}
                    className="w-full flex items-center justify-between p-4 border-2 border-slate-100 hover:border-purple-500 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="text-left">
                        <span className="block font-semibold text-lg text-slate-900 group-hover:text-purple-600">I am a Student</span>
                        <span className="text-sm text-slate-500">View captions, ask questions</span>
                    </div>
                    <ChevronRightIcon className="text-slate-300 group-hover:text-purple-500" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};