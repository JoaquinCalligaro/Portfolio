import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { AccountPanel } from './AccountPanel';
import { MotionRoot } from './MotionRoot';
import { PasskeyManager } from './PasskeyManager';
import { PasswordPanel } from './PasswordPanel';
import { SessionsPanel } from './SessionsPanel';
import { TwoFactorPanel } from './TwoFactorPanel';

const TABS = ['account', 'password', 'twofa', 'devices', 'sessions'];

export default function SecurityPanel({ username }: { username?: string }) {
  const [tab, setTab] = useState('account');

  // El hash (#account) elige la pestaña; va en useEffect para no romper la hidratación.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (TABS.includes(hash)) setTab(hash);
  }, []);

  return (
    <MotionRoot>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Seguridad">
          <TabsTrigger value="account">Cuenta</TabsTrigger>
          <TabsTrigger value="password">Contraseña</TabsTrigger>
          <TabsTrigger value="twofa">2FA</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardContent>
              <AccountPanel username={username ?? ''} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardContent>
              <PasswordPanel username={username} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="twofa">
          <Card>
            <CardContent>
              <TwoFactorPanel />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="devices">
          <Card>
            <CardContent>
              <PasskeyManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sessions">
          <Card>
            <CardContent>
              <SessionsPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MotionRoot>
  );
}
