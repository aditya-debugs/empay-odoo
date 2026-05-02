import { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Button, Avatar } from '../../../features/ui';
import hrService from '../hrService';

export default function HRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrService.getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-ink-muted animate-pulse font-medium">Loading dashboard summary...</div>;

  const { stats, pendingLeaves, newJoiners } = data;

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-8 py-10 space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">HR Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium">Overview of workforce and operations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="h-5 w-5 text-blue-500" />} 
          label="Total Employees" 
          value={stats.totalEmployees} 
          subtext="ACTIVE IN SYSTEM"
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={<CheckCircle2 className="h-5 w-5 text-[#198754]" />} 
          label="Present Today" 
          value={stats.presentToday} 
          subtext={`${((stats.presentToday/stats.totalEmployees)*100).toFixed(0)}% ATTENDANCE`}
          bgColor="bg-green-50"
        />
        <StatCard 
          icon={<AlertCircle className="h-5 w-5 text-red-500" />} 
          label="Absent Today" 
          value={stats.absentToday} 
          subtext="UNACCOUNTED FOR"
          bgColor="bg-red-50"
        />
        <StatCard 
          icon={<Calendar className="h-5 w-5 text-orange-500" />} 
          label="Pending Leaves" 
          value={stats.pendingLeavesCount} 
          subtext="REQUESTS AWAITING REVIEW"
          bgColor="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Requests Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Leave Requests
            </h2>
            <Link to="/hr/leaves" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <Card className="min-h-[300px] flex flex-col justify-center border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
            {pendingLeaves.length > 0 ? (
              <div className="divide-y divide-gray-50 h-full">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <Avatar name={leave.employee.user.name} className="h-10 w-10 font-bold" />
                      <div>
                        <p className="font-bold text-gray-900">{leave.employee.user.name}</p>
                        <p className="text-xs text-gray-500 font-medium">
                          {leave.type.replace('_', ' ')} • <span className="text-blue-600">{leave.days} days</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 font-bold">Reject</Button>
                      <Button size="sm" className="bg-[#198754] hover:bg-[#157347] text-white border-none font-bold px-4">Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-400 italic font-medium">No pending leave requests</p>
              </div>
            )}
          </Card>
        </div>

        {/* New Joiners Widget */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-gray-400" />
              New Joiners
            </h2>
          </div>
          <Card className="p-6 space-y-6 border-gray-100 shadow-sm bg-white rounded-2xl">
            {newJoiners.length > 0 ? (
              <div className="space-y-6">
                {newJoiners.map(person => (
                  <div key={person.id} className="flex items-center gap-4 group">
                    <Avatar name={person.name} className="h-10 w-10 ring-2 ring-gray-50 group-hover:ring-blue-100 transition-all font-bold" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{person.name}</p>
                      <p className="text-[11px] text-gray-500 font-medium truncate uppercase tracking-wider">
                        {person.position} • {person.department}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {new Date(person.joinDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-400 italic font-medium">
                No new joiners this month
              </div>
            )}
            <div className="pt-4 border-t border-gray-50">
              <Button variant="outline" className="w-full bg-white text-gray-900 border-gray-200 hover:bg-gray-50 shadow-sm font-bold" asChild>
                <Link to="/hr/employees/new">Add Employee</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, bgColor }) {
  return (
    <Card className="p-6 border-gray-100 shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`h-12 w-12 rounded-2xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
          {icon}
        </div>
        <div className="opacity-10 group-hover:opacity-20 transition-opacity">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 tracking-tight">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold text-gray-900 leading-none">{value}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subtext}</span>
        </div>
      </div>
    </Card>
  );
}
