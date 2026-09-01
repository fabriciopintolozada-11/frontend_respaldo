import { Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-md w-full mx-auto">
        <Outlet />
      </div>
    </div>
  );
}