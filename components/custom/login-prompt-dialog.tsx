'use client';

import { useRef } from 'react';
import { Localize } from '@deriv-com/translations';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
}

function LoginPromptActions({
  onClose,
  onLogin,
  onSignUp,
}: Pick<LoginPromptDialogProps, 'onLogin' | 'onSignUp'> & { onClose: () => void }) {
  // Prevent double activation while the prompt is closing.
  const startedRef = useRef(false);
  const start = (action: () => Promise<void>) => {
    onClose();
    if (startedRef.current) return;
    startedRef.current = true;
    void action();
  };

  return (
    <>
      <Button className="w-full" onClick={() => start(onSignUp)}>
        <Localize i18n_default_text="Create free account" />
      </Button>
      <Button variant="outline" className="w-full" onClick={() => start(onLogin)}>
        <Localize i18n_default_text="Log in" />
      </Button>
    </>
  );
}

/**
 * Prompt shown when a logged-out user activates Buy: a centered dialog on
 * desktop, a bottom sheet on mobile. Both actions open the site's own auth form.
 */
export function LoginPromptDialog({
  open,
  onOpenChange,
  onLogin,
  onSignUp,
}: LoginPromptDialogProps) {
  const isMobile = useIsMobile();
  const close = () => onOpenChange(false);

  if (isMobile) {
    return (
      // No background scaling: the sheet overlays a live chart canvas, which
      // should not shrink behind the overlay.
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              <Localize i18n_default_text="Start trading with us" />
            </DrawerTitle>
            <DrawerDescription>
              <Localize i18n_default_text="Log in or create a free account to place a trade." />
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <LoginPromptActions onClose={close} onLogin={onLogin} onSignUp={onSignUp} />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <Localize i18n_default_text="Start trading with us" />
          </DialogTitle>
          <DialogDescription>
            <Localize i18n_default_text="Log in or create a free account to place a trade." />
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <LoginPromptActions onClose={close} onLogin={onLogin} onSignUp={onSignUp} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
