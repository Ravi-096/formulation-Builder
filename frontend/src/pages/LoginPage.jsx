import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import {
  Lock,
  Mail,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleQuickFill = (identifier, password) => {
    setFormData({ identifier, password });
    setFormErrors({});
    setServerError('');
  };

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errors = {};

    if (!formData.identifier.trim()) {
      errors.identifier = 'Email or username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await login(formData);

      toast.success(
        `Welcome back, ${res.user?.name || res.user?.username || 'User'}!`
      );

      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/20 mb-4">
            <Layers className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Welcome back
          </h1>

          <p className="text-sm text-zinc-500 mt-2">
            Sign in to continue to your account
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border border-zinc-200 shadow-xl p-6 sm:p-8">
          {/* Active Session Notification */}
          {isAuthenticated && user && (
            <div className="mb-6 p-3.5 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs">
                  {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 leading-tight">
                    Signed in as {user.name || user.username}
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    {user.email} • {user.role || 'Member'}
                  </p>
                </div>
              </div>
              <Link
                to="/dashboard/overview"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />

              <div className="text-sm text-rose-700 font-medium">
                {serverError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email or Username"
              name="identifier"
              type="text"
              placeholder="Enter your email or username"
              leftIcon={Mail}
              value={formData.identifier}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  identifier: e.target.value,
                });

                if (formErrors.identifier) {
                  setFormErrors({
                    ...formErrors,
                    identifier: null,
                  });
                }
              }}
              error={formErrors.identifier}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              leftIcon={Lock}
              showPasswordToggle
              value={formData.password}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  password: e.target.value,
                });

                if (formErrors.password) {
                  setFormErrors({
                    ...formErrors,
                    password: null,
                  });
                }
              }}
              error={formErrors.password}
              required
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  toast.info(
                    'Password reset instructions will be sent to your registered email.'
                  );
                }}
                className="text-brand-600 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credentials Helper Box */}
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                Quick Demo Accounts
              </span>
              <span className="text-[10px] text-zinc-400">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@example.com', 'password123')}
                className="p-2.5 rounded-lg border border-zinc-200 hover:border-brand-500/50 bg-zinc-50 text-left hover:bg-zinc-100 transition-colors"
              >
                <p className="text-xs font-semibold text-zinc-800">Admin Account</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">admin@example.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('user@example.com', 'password123')}
                className="p-2.5 rounded-lg border border-zinc-200 hover:border-brand-500/50 bg-zinc-50 text-left hover:bg-zinc-100 transition-colors"
              >
                <p className="text-xs font-semibold text-zinc-800">Engineer Account</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">user@example.com</p>
              </button>
            </div>
          </div>
        </Card>
        

        {/* Register */}
        <p className="text-center text-sm text-zinc-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-600 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
