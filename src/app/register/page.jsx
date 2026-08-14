import { prisma } from '@/lib/prisma';
import RegisterForm from './RegisterForm';

export const metadata = {
  title: 'Register - Automatix',
  description: 'Create an Automatix account',
};

export default async function RegisterPage() {
  const settings = await prisma.platformSettings.findFirst() || { maxUsers: 10, starterPlanEnabled: true };
  const userCount = await prisma.user.count({ where: { role: 'CLIENT' } });

  const isFull = userCount >= settings.maxUsers;
  const isEnabled = settings.starterPlanEnabled;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <RegisterForm isFull={isFull} isEnabled={isEnabled} />
      </div>
    </div>
  );
}
