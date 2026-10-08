import { Card, CardContent } from '@/components/ui/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { MotionRoot } from './MotionRoot';
import { PasskeyManager } from './PasskeyManager';
import { PasswordPanel } from './PasswordPanel';
import { SessionsPanel } from './SessionsPanel';
import { TwoFactorPanel } from './TwoFactorPanel';

export default function SecurityPanel({ username }: { username?: string }) {
  return (
    <MotionRoot>
      <Tabs defaultValue="password">
        <TabsList aria-label="Seguridad">
          <TabsTrigger value="password">Contraseña</TabsTrigger>
          <TabsTrigger value="twofa">2FA</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
        </TabsList>
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
