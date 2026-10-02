import { useContext, useEffect, useRef } from 'react';
import { AppContext } from '@/contexts/App';
import dynamic from 'next/dynamic';
import { useNotifications } from '@/hooks/useNotifications';
import { useUser } from '@/hooks/useUser';

const Bell = dynamic(() => import('lucide-react').then(mod => mod.Bell), { ssr: false });

const Notifications = () => {
  const { modal, setModal } = useContext(AppContext);
  const userQuery = useUser();
  const userId = userQuery.data?._id ?? '';
  const notificationsQuery = useNotifications(userId);
  const notificationsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setModal({ name: '' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setModal]);

  if (modal.name !== 'NOTIFICATIONS') return null;

  return (
    <div 
      ref={notificationsRef}
      className="fixed top-16 right-4 w-80 bg-[#1E2547] rounded-lg shadow-lg border border-[#2A3356] overflow-hidden z-50"
    >
      <div className="p-4 border-b border-[#2A3356]">
        <h3 className="text-lg font-semibold text-white">{"Notifications"}</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notificationsQuery.data && notificationsQuery.data.length > 0 ? (
          <div className="divide-y divide-[#2A3356]">
            {notificationsQuery.data.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-4 hover:bg-[#2A3356] transition-colors ${!notification.seen ? 'bg-[#2A3356]/50' : ''}`}
              >
                <p className="text-white/90">{notification.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-white/70">
            <Bell className="h-8 w-8 mx-auto mb-2 text-white/50" />
            <p>{"No notifications yet"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
