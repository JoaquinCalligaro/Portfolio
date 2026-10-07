import { Card, CardContent } from '@/components/ui/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import { MotionRoot } from './MotionRoot';
import { PasskeyManager } from './PasskeyManager';
import { SessionsPanel } from './SessionsPanel';

export default function SecurityPanel() {
  return (
    <MotionRoot>
      <Tabs defaultValue="devices">
        <TabsList aria-label="Seguridad">
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
        </TabsList>
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
