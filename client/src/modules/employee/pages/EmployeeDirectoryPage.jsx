import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input } from '../../../features/ui';
import { Search, Users, Mail, Phone, Hash } from 'lucide-react';
import api from '../../../services/api';

export default function EmployeeDirectoryPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/employees?search=${search}`);
        setEmployees(data.employees || []);
      } catch (err) {
        setError(err.message || 'Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(loadEmployees, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Organization Directory</h1>
          <p className="mt-1 text-xs font-medium text-ink-soft uppercase tracking-widest">Team Connectivity • Verified Profiles</p>
        </div>
        <div className="relative w-64">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-soft" />
           <input
              type="text"
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
           />
        </div>
      </div>

      {error && <div className="p-3 bg-danger-50 text-danger-700 rounded-lg text-sm border border-danger-100">{error}</div>}

      {loading ? (
        <div className="py-20 text-center text-ink-muted text-sm space-y-2 animate-pulse">
           <Users className="h-6 w-6 mx-auto opacity-20" />
           <p>Scanning directory database...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="py-20 text-center text-ink-muted text-sm italic">
           {search ? `No team members found for "${search}"` : 'The organizational directory is loading...'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Card key={emp.id} className="p-6 hover:shadow-lg transition-all border-none shadow-sm group">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500 transition-colors">
                  <Users className="h-6 w-6 text-brand-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-ink">{emp.name || `${emp.firstName} ${emp.lastName}`}</h3>
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-0.5">{emp.position}</p>
                  <p className="text-xs text-ink-muted mt-1">{emp.department}</p>
                  
                  <div className="mt-4 space-y-2">
                    <a href={`mailto:${emp.email}`} className="flex items-center gap-2 text-xs text-ink-soft hover:text-brand-600 transition-colors">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{emp.email}</span>
                    </a>
                    {emp.phone && (
                      <div className="flex items-center gap-2 text-xs text-ink-soft">
                        <Phone className="h-3 w-3" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-ink-soft bg-surface-muted px-2 py-0.5 rounded w-fit">
                        <Hash className="h-2.5 w-2.5" />
                        <span>ID: {emp.employeeId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



