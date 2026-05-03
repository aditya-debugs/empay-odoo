import { useAuth } from '../../features/auth/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar role={user?.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
