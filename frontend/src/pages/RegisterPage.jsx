
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import {
  Lock,
  Mail,
  User,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const passwordStrength = useMemo(() => {
    const pwd = formData.password;

    if (!pwd) {
      return {
        score: 0,
        label: '',
        color: 'bg-zinc-200',
      };
    }

    let score = 0;

    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return {
        score: 1,
        label: 'Weak',
        color: 'bg-rose-500',
      };
    }

    if (score <= 4) {
      return {
        score: 2,
        label: 'Good',
        color: 'bg-amber-500',
      };
    }

    return {
      score: 3,
      label: 'Strong',
      color: 'bg-emerald-500',
    };
  }, [formData.password]);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      errors.username =
        'Username can only contain letters, numbers, _ and -';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const res = await register(formData);

      toast.success(
        `Account created! Welcome, ${
          res.user?.name || res.user?.username || 'User'
        }!`
      );

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(
        err.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/20 mb-4">
            <Layers className="w-6 h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Create your account
          </h1>

          <p className="text-sm text-zinc-500 mt-2">
            Enter your details to get started
          </p>
        </div>

        {/* Register Card */}
        <Card className="bg-white border border-zinc-200 shadow-xl p-6 sm:p-8">
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
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              leftIcon={Mail}
              value={formData.email}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  email: e.target.value,
                });

                if (formErrors.email) {
                  setFormErrors({
                    ...formErrors,
                    email: null,
                  });
                }
              }}
              error={formErrors.email}
              required
            />

            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="Choose a username"
              leftIcon={User}
              value={formData.username}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  username: e.target.value,
                });

                if (formErrors.username) {
                  setFormErrors({
                    ...formErrors,
                    username: null,
                  });
                }
              }}
              error={formErrors.username}
              required
            />

            <div>
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

              {/* Password Strength */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Password strength</span>

                    <span className="font-medium text-zinc-700">
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`rounded-full h-full ${
                          passwordStrength.score >= level
                            ? passwordStrength.color
                            : 'bg-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              leftIcon={Lock}
              showPasswordToggle
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                });

                if (formErrors.confirmPassword) {
                  setFormErrors({
                    ...formErrors,
                    confirmPassword: null,
                  });
                }
              }}
              error={formErrors.confirmPassword}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={ArrowRight}
            >
              Create Account
            </Button>
          </form>
        </Card>

        {/* Login */}
        <p className="text-center text-sm text-zinc-600 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

