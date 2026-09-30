/**
 * Mock API Provider
 * Provides realistic mock API endpoints with simulated latency for zero-setup demo & development.
 */

const STORAGE_USERS_KEY = 'ks_mock_users';
const STORAGE_ACTIVITIES_KEY = 'ks_mock_activities';

// Default initial mock users
const DEFAULT_USERS = [
  {
    id: 'usr_01',
    email: 'admin@example.com',
    username: 'admin_alex',
    name: 'Alex Morgan',
    role: 'Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'usr_02',
    email: 'user@example.com',
    username: 'sarah_dev',
    name: 'Sarah Connor',
    role: 'Product Engineer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-02-20T10:15:00Z',
  },
];

// Helper to generate a realistic JWT mock token
export const createMockJwt = (user) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      iat: Math.floor(Date.now() / 1000),
    })
  );
  const signature = btoa('mock_signature_ks_secret_token');
  return `${header}.${payload}.${signature}`;
};

// Parse mock JWT payload
export const parseMockJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
};

const getStoredUsers = () => {
  const raw = localStorage.getItem(STORAGE_USERS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
};

const DEFAULT_ACTIVITIES = [
  {
    id: 'act_101',
    user: {
      name: 'Emma Watson',
      email: 'emma.w@company.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    },
    action: 'Subscription Upgraded',
    details: 'Upgraded to Enterprise Tier (Annual)',
    amount: '+$2,400.00',
    status: 'completed',
    timestamp: '5 minutes ago',
    category: 'Billing',
  },
  {
    id: 'act_102',
    user: {
      name: 'David Kim',
      email: 'david.k@developer.io',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    action: 'API Key Generated',
    details: 'Created Production API key for Webhook cluster',
    amount: '—',
    status: 'completed',
    timestamp: '22 minutes ago',
    category: 'Security',
  },
  {
    id: 'act_103',
    user: {
      name: 'Sophia Chen',
      email: 'sophia.c@design.co',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
    },
    action: 'Payment Processing',
    details: 'Invoice #INV-2024-089 pending bank clearance',
    amount: '$850.00',
    status: 'pending',
    timestamp: '1 hour ago',
    category: 'Finance',
  },
  {
    id: 'act_104',
    user: {
      name: 'Marcus Vance',
      email: 'marcus.v@cloud.net',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    action: 'Database Sync Job',
    details: 'Synchronizing secondary replica across US-East',
    amount: '—',
    status: 'in_progress',
    timestamp: '2 hours ago',
    category: 'Infrastructure',
  },
  {
    id: 'act_105',
    user: {
      name: 'Liam Neeson',
      email: 'liam.n@security.org',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    },
    action: 'Failed Login Attempt',
    details: '3 consecutive failed attempts from IP 194.26.29.11',
    amount: '—',
    status: 'failed',
    timestamp: '3 hours ago',
    category: 'Security',
  },
  {
    id: 'act_106',
    user: {
      name: 'Olivia Martinez',
      email: 'olivia.m@tech.com',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    },
    action: 'Team Member Invited',
    details: 'Invited developer @olivia.m to project "Core-App"',
    amount: '—',
    status: 'completed',
    timestamp: '5 hours ago',
    category: 'Team',
  },
];

export const mockApiHandler = async (config) => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  let data = {};
  if (config.data) {
    try {
      data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      data = config.data;
    }
  }

  // Simulate network delay (200ms - 350ms)
  await new Promise((resolve) => setTimeout(resolve, 250));

  // --- Auth: Login ---
  if (url.includes('/auth/login') && method === 'post') {
    const { identifier, email, password } = data;
    const loginKey = (identifier || email || '').toLowerCase().trim();

    if (!loginKey || !password) {
      throw {
        response: {
          status: 400,
          data: { message: 'Please provide both email/username and password.' },
        },
      };
    }

    const users = getStoredUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === loginKey ||
        u.username.toLowerCase() === loginKey
    );

    // Accept test password "password123" or any 6+ char password for user accounts
    if (user && (password === 'password123' || password.length >= 6)) {
      const token = createMockJwt(user);
      return {
        status: 200,
        data: {
          success: true,
          message: 'Authentication successful',
          token,
          user,
        },
      };
    }

    throw {
      response: {
        status: 401,
        data: { message: 'Invalid credentials. Try demo login or check your password.' },
      },
    };
  }

  // --- Auth: Register ---
  if (url.includes('/auth/register') && method === 'post') {
    const { email, username, password, confirmPassword } = data;

    if (!email || !username || !password) {
      throw {
        response: {
          status: 400,
          data: { message: 'All fields are required.' },
        },
      };
    }

    if (confirmPassword && password !== confirmPassword) {
      throw {
        response: {
          status: 400,
          data: { message: 'Passwords do not match.' },
        },
      };
    }

    if (password.length < 6) {
      throw {
        response: {
          status: 400,
          data: { message: 'Password must be at least 6 characters long.' },
        },
      };
    }

    const users = getStoredUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw {
        response: {
          status: 409,
          data: { message: 'An account with this email already exists.' },
        },
      };
    }

    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw {
        response: {
          status: 409,
          data: { message: 'Username is already taken.' },
        },
      };
    }

    const newUser = {
      id: `usr_${Date.now().toString(36)}`,
      email,
      username,
      name: username
        .split(/[._-]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' '),
      role: 'Member',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const token = createMockJwt(newUser);
    return {
      status: 201,
      data: {
        success: true,
        message: 'Account registered successfully',
        token,
        user: newUser,
      },
    };
  }

  // --- Auth: Profile (/auth/me) ---
  if (url.includes('/auth/me') && method === 'get') {
    const authHeader = config.headers?.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const decoded = parseMockJwt(token);

    if (!decoded) {
      throw {
        response: {
          status: 401,
          data: { message: 'Invalid or expired session token.' },
        },
      };
    }

    const users = getStoredUsers();
    const user = users.find((u) => u.id === decoded.sub || u.email === decoded.email) || {
      id: decoded.sub,
      email: decoded.email,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(decoded.username || 'user')}`,
    };

    return {
      status: 200,
      data: { success: true, user },
    };
  }

  // --- Dashboard: Stats ---
  if (url.includes('/dashboard/stats') && method === 'get') {
    return {
      status: 200,
      data: {
        success: true,
        stats: {
          totalRevenue: {
            value: '$124,592',
            change: '+14.2%',
            trend: 'up',
            period: 'vs last month',
            description: 'Total revenue generated across all active subscriptions',
          },
          activeUsers: {
            value: '8,429',
            change: '+8.1%',
            trend: 'up',
            period: 'vs last month',
            description: 'Monthly active user accounts engaging with portal',
          },
          pendingTasks: {
            value: '43',
            change: '-12.5%',
            trend: 'down',
            period: 'vs last week',
            description: 'Open support tickets and infrastructure sync tasks',
          },
          conversionRate: {
            value: '4.82%',
            change: '+2.4%',
            trend: 'up',
            period: 'vs last month',
            description: 'Trial to paid subscription conversion rate',
          },
        },
      },
    };
  }

  // --- Dashboard: Recent Activity ---
  if (url.includes('/dashboard/recent-activity') && method === 'get') {
    return {
      status: 200,
      data: {
        success: true,
        activities: DEFAULT_ACTIVITIES,
        total: DEFAULT_ACTIVITIES.length,
      },
    };
  }

  // --- Dashboard: Analytics ---
  if (url.includes('/dashboard/analytics') && method === 'get') {
    return {
      status: 200,
      data: {
        success: true,
        analytics: {
          weeklyTraffic: [
            { day: 'Mon', visits: 2400, pageViews: 4200, bounceRate: '32%' },
            { day: 'Tue', visits: 3100, pageViews: 5600, bounceRate: '28%' },
            { day: 'Wed', visits: 3800, pageViews: 6800, bounceRate: '25%' },
            { day: 'Thu', visits: 4200, pageViews: 7400, bounceRate: '24%' },
            { day: 'Fri', visits: 4900, pageViews: 8900, bounceRate: '22%' },
            { day: 'Sat', visits: 2800, pageViews: 4100, bounceRate: '38%' },
            { day: 'Sun', visits: 2100, pageViews: 3500, bounceRate: '41%' },
          ],
          devices: [
            { platform: 'Desktop (Chrome, Safari, Edge)', percentage: 64, color: '#0ea5e9' },
            { platform: 'Mobile (iOS & Android)', percentage: 28, color: '#8b5cf6' },
            { platform: 'Tablet', percentage: 8, color: '#10b981' },
          ],
          serverMetrics: {
            uptime: '99.98%',
            avgLatency: '42ms',
            errorRate: '0.04%',
            requestsPerMin: '14.2k',
          },
        },
      },
    };
  }

  // Default 404 for unknown endpoint
  throw {
    response: {
      status: 404,
      data: { message: `Endpoint not found: ${method.toUpperCase()} ${url}` },
    },
  };
};
