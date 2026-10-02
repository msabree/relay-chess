import { useContext } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { clearAuth } from '@/lib/auth';
import { AppContext } from '@/contexts/App';
import dynamic from 'next/dynamic';
import { useUser } from '@/hooks/useUser';

const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
const LogOut = dynamic(() => import('lucide-react').then(mod => mod.LogOut), { ssr: false });
const Settings = dynamic(() => import('lucide-react').then(mod => mod.Settings), { ssr: false });
const Palette = dynamic(() => import('lucide-react').then(mod => mod.Palette), { ssr: false });
const User = dynamic(() => import('lucide-react').then(mod => mod.User), { ssr: false });
import { Button } from '@/components/ui/button';
import { BOARD_COLOR_SCHEMES } from '@/constants';
import { updateUser } from '@/apis/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RightDrawer = () => {
  const { rightDrawerOpen, setRightDrawerOpen, setModal } = useContext(AppContext);
  const { data:session } = useSession();
  const userQuery = useUser();
  const boardColor = userQuery.data?.boardColor ?? BOARD_COLOR_SCHEMES[0].value;
  if (!rightDrawerOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300" 
      onClick={() => setRightDrawerOpen(false)}
    >
      <div 
        className="fixed right-0 top-0 h-full w-80 glass-effect border-l border-line backdrop-blur-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg glass-effect border border-line">
              <Settings className="h-5 w-5 text-accent-ink" />
            </div>
            <h2 className="text-xl font-bold text-fg">{"Settings"}</h2>
          </div>
          <button
            onClick={() => setRightDrawerOpen(false)}
            className="p-2.5 rounded-lg text-fg-muted hover:text-accent-ink hover:bg-fg/10 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
          <div className="space-y-6">
            <div className="flex flex-col items-center p-8 rounded-2xl glass-effect border border-line backdrop-blur-xl">
              <div className="relative mb-5">
                <Avatar className="w-24 h-24 border-2 border-accent/30">
                  <AvatarImage src={session?.user?.image ?? '/static/images/avatar/1.jpg'} />
                  <AvatarFallback className="bg-accent text-accent-fg text-2xl font-bold">
                    {session?.user?.name?.[0]?.toUpperCase() ?? userQuery.data?.username?.[0]?.toUpperCase() ?? 'RC'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-line"></div>
              </div>
              <div className="text-center">
                <p className="text-fg font-semibold text-lg mb-2">{userQuery.data?.username ?? "Guest"}</p>
                <p className="text-sm text-fg-muted">{session?.user?.email ?? "Not signed in"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => {
                  setRightDrawerOpen(false);
                  setModal({ name: 'UPDATE_PROFILE_INFO' });
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl glass-effect border border-line hover:border-accent/50 hover:bg-accent/10 text-fg transition-all duration-200 group"
              >
                <div className="p-2.5 rounded-lg bg-fg/5 group-hover:bg-accent/20 transition-colors">
                  <User className="h-5 w-5 text-fg-muted group-hover:text-accent-ink transition-colors" />
                </div>
                <span className="font-medium">{"Edit Username"}</span>
              </button>

              <div className="p-5 rounded-xl glass-effect border border-line backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-fg/5">
                    <Palette className="h-5 w-5 text-accent-ink" />
                  </div>
                  <span className="text-fg font-medium">{"Board Color"}</span>
                </div>
                <Select
                  value={boardColor}
                  onValueChange={(value) => {
                    updateUser('boardColor', value).then(() => {
                      userQuery.refetch();
                    });
                  }}
                >
                  <SelectTrigger className="w-full glass-effect border border-line text-fg focus:border-accent/50 focus:ring-accent/50 hover:border-accent/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-effect border border-line backdrop-blur-xl">
                    {BOARD_COLOR_SCHEMES.map((colorScheme) => (
                      <SelectItem 
                        key={colorScheme.labelKey} 
                        value={colorScheme.value}
                        className="text-fg hover:bg-fg/10 focus:bg-fg/10"
                      >
                        {(colorScheme.labelKey === 'slate' ? 'Slate (default)' : colorScheme.labelKey === 'blueWhite' ? 'Blue/White' : colorScheme.labelKey === 'greenWhite' ? 'Green/White' : 'Red/White')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {session && (
              <div className="pt-6 border-t border-line mt-6">
                <Button
                  onClick={() => { clearAuth(); signOut(); }}
                  variant="ghost"
                  className="w-full flex items-center justify-center gap-2.5 glass-effect border border-danger/30 hover:border-danger/50 hover:bg-danger/10 text-danger hover:text-danger transition-all duration-200 py-3"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-semibold">{"Sign Out"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightDrawer;
