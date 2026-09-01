import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User, Wrench } from 'lucide-react';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useAuthContext } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-lime-400 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-7 h-7 text-lime-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Los Fratelli Workshop
          </h1>
          <p className="text-sm text-slate-600 mt-1">Sign in to continue to your dashboard</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Username"
              id="login-username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. recep01"
              required
              autoComplete="username"
              tone="light"
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Password"
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              tone="light"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Demo accounts: <span className="font-mono">recep01 · mech01 · lead01 · admin01</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Password: <span className="font-mono">Fratelli2026!</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}