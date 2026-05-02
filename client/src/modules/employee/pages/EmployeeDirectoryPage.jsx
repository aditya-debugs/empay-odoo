import { useEffect, useState } from 'react';
import { Card, Input } from '../../../features/ui';
import { Search, Users } from 'lucide-react';
import api from '../../../services/api';

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
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
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Employee Directory</h1>
      <p className="mt-1 text-sm text-ink-muted">View all employees in the organization</p>

      {error && <div className="mt-4 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">{error}</div>}

      <div className="mt-6">
        <Input
          placeholder="Search by name, email, or department..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="mt-8 text-center text-ink-muted">Loading employees...</div>
      ) : employees.length === 0 ? (
        <div className="mt-8 text-center text-ink-muted">No employees found</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Card key={emp.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{emp.user?.name}</h3>
                  <p className="text-xs text-ink-muted mt-1">{emp.position}</p>
                  <p className="text-xs text-ink-muted">{emp.department}</p>
                  <a href={`mailto:${emp.user?.email}`} className="text-xs text-primary-600 mt-2 hover:underline">
                    {emp.user?.email}
                  </a>
                  {emp.phone && <p className="text-xs text-ink-muted mt-1">📞 {emp.phone}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
