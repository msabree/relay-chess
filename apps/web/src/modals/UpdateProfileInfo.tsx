import { useContext, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppContext } from '@/contexts/App';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { validateUsername } from '@/utils/strings';
import dynamic from 'next/dynamic';
import { updateUser } from '@/apis/auth';

const User = dynamic(() => import('lucide-react').then(mod => mod.User), { ssr: false });
const Sparkles = dynamic(() => import('lucide-react').then(mod => mod.Sparkles), { ssr: false });
const Save = dynamic(() => import('lucide-react').then(mod => mod.Save), { ssr: false });
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
import { useUser } from '@/hooks/useUser';

export default function UpdateProfileInfo() {
  const { toast } = useToast();
  const { modal, setModal } = useContext(AppContext);
  const userQuery = useUser();
  const [userNameEditText, setUserNameEditText] = useState<string>('');

  if (userQuery.data === undefined) {
    return null;
  }

  return (
    <Dialog open={modal.name === 'UPDATE_PROFILE_INFO'} onOpenChange={() => setModal({ name: '' })}>
      <DialogContent className="glass-effect border border-line backdrop-blur-xl shadow-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold text-gradient flex items-center justify-center gap-3">
            <Sparkles className="w-7 h-7 text-accent-ink" />
            {"Update Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Username Input */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-fg-muted flex items-center gap-2">
              <User className="w-4 h-4 text-accent-ink" />
              {"Username"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-fg-muted" />
              </div>
              <Input
                defaultValue={userQuery.data?.username}
                className="pl-12 glass-effect border border-line bg-fg/5 text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:ring-accent/50 hover:border-accent/30 transition-all duration-200"
                placeholder={"Enter a new username"}
                onChange={(evt) => {
                  setUserNameEditText(evt.target.value);
                }}
              />
            </div>
            <p className="text-xs text-fg-muted">
              {"Username must be 2-30 characters and contain only letters, numbers, and underscores."}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button
              variant="ghost"
              onClick={() => setModal({ name: '' })}
              className="glass-effect border border-line hover:border-line hover:bg-fg/10 text-fg-muted hover:text-fg transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              {"Cancel"}
            </Button>
            <Button
              onClick={() => {
                if (userNameEditText.trim().toLowerCase() === userQuery.data?.username?.toLowerCase()) {
                  setModal({ name: '' });
                  return;
                }

                if (userNameEditText.trim().length < 2) {
                  toast({
                    title: "Update Profile Failed",
                    variant: 'destructive',
                    description: "Username too short.",
                  });
                  return;
                } else if (userNameEditText.length > 30) {
                  toast({
                    title: "Update Profile Failed",
                    variant: 'destructive',
                    description: "Username too long.",
                  });
                  return;
                } else if (!validateUsername(userNameEditText.trim())) {
                  toast({
                    title: "Update Profile Failed",
                    variant: 'destructive',
                    description: "Username contains invalid characters.",
                  });
                  return;
                }

                updateUser('username', userNameEditText.trim()).then(() => {
                  setModal({ name: '' });
                  userQuery.refetch();
                }).catch((err) => {
                  toast({
                    title: "Update Profile Failed",
                    variant: 'destructive',
                    description: err?.response?.status === 409 ? "Username not available." : "Unable to update username.",
                  });
                  return;
                });
              }}
              className="bg-accent hover:bg-accent/90 text-accent-fg font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {"Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
