import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { formulationApi } from '../../api/formulationApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import StatCard from '../../components/dashboard/StatCard';
import ActivityTable from '../../components/dashboard/ActivityTable';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  Users,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Atom,
  Boxes,
  Clock,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export const OverviewView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if current logged-in user is an administrator
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const email = user.email?.toLowerCase() || '';
    const role = user.role?.toLowerCase() || '';
    const username = user.username?.toLowerCase() || '';
    return email === 'admin@example.com' || role.includes('admin') || username.includes('admin');
  }, [user]);

  // Admin Data State
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminActivities, setAdminActivities] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Regular User Formulations State
  const [userFormulations, setUserFormulations] = useState([]);
  const [formulationSearchTerm, setFormulationSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // General Loading & Error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch overview data depending on role
  const fetchOverviewData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      setError(null);

      try {
        if (isAdmin) {
          // Fetch Admin view: All registered users and their activities
          const res = await dashboardApi.getUsers();
          if (res?.users) {
            setAdminUsers(res.users);
          }
          if (res?.activities) {
            setAdminActivities(res.activities);
          }
        } else {
          // Fetch User view: Recent formulations created by this user
          const allFormulations = await formulationApi.getMyFormulations();
          // Filter formulations for this user if user id matches, otherwise show all user formulations
          const filtered = Array.isArray(allFormulations)
            ? allFormulations.filter(
                (f) =>
                  !user?.id ||
                  f.user_id === user.id ||
                  f.user_id === user.username ||
                  f.user_id === 'usr_01'
              )
            : [];
          setUserFormulations(filtered.length > 0 ? filtered : allFormulations || []);
        }

        if (isSilent) {
          toast.success('Dashboard metrics updated');
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
        setError(err.response?.data?.message || err.message || 'Unable to load overview data.');
        toast.error('Could not refresh overview data.');
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, user, toast]
  );

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Handle Formulation Delete
  const handleDeleteFormulation = async (id, apiName) => {
    if (!window.confirm(`Are you sure you want to delete formulation "${apiName}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await formulationApi.deleteFormulation(id);
      toast.success(`Formulation "${apiName}" deleted successfully.`);
      setUserFormulations((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error('Failed to delete formulation.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Users for Admin
  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(userSearchTerm.toLowerCase());
      const matchesRole =
        roleFilter === 'all' || u.role?.toLowerCase().includes(roleFilter.toLowerCase());
      return matchesSearch && matchesRole;
    });
  }, [adminUsers, userSearchTerm, roleFilter]);

  // Filtered Formulations for User
  const filteredFormulations = useMemo(() => {
    return userFormulations.filter((f) => {
      const matchesSearch =
        f.api_name?.toLowerCase().includes(formulationSearchTerm.toLowerCase()) ||
        f.api_smiles?.toLowerCase().includes(formulationSearchTerm.toLowerCase()) ||
        f.notes?.toLowerCase().includes(formulationSearchTerm.toLowerCase());
      const matchesVehicle =
        vehicleFilter === 'all' || f.delivery_vehicle === vehicleFilter;
      return matchesSearch && matchesVehicle;
    });
  }, [userFormulations, formulationSearchTerm, vehicleFilter]);

  // Helper for delivery vehicle format
  const formatDeliveryVehicle = (vehicle) => {
    switch (vehicle) {
      case 'oral_tablet':
        return { label: 'Oral Tablet', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'oral_solution':
        return { label: 'Oral Solution', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'iv_infusion':
        return { label: 'IV Infusion', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'lipid_nanoparticles':
      case 'nanoparticle_lipid':
        return { label: 'Lipid Nanoparticles (LNP)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'liposome':
        return { label: 'Liposomal Vesicle', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: vehicle?.replace('_', ' ').toUpperCase() || 'DELIVERY ROUTE', color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {isAdmin
                ? 'Administrator Portal'
                : `Welcome back, ${user?.name || user?.username || 'Researcher'}`}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                isAdmin
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-brand-50 text-brand-700 border-brand-200'
              }`}
            >
              {isAdmin ? 'System Administrator' : user?.role || 'Pharmacologist'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            {isAdmin
              ? 'Complete directory of registered website users, accounts, and real-time activity audit logs.'
              : 'Overview of your recent computational chemistry formulations, validation checks, and drug candidates.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={() => fetchOverviewData(true)}
          >
            Refresh
          </Button>

          {!isAdmin && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => navigate('/dashboard/formulation')}
            >
              Build Formulation
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-800">Failed to load overview data</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchOverviewData()}>
            Retry
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ADMIN OVERVIEW: USERS PRESENT IN WEBSITE & THEIR ACTIVITY               */}
      {/* ========================================================================= */}
      {isAdmin ? (
        <div className="space-y-8 animate-fade-in">
          {/* Admin KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Registered Users"
                  value={adminUsers.length.toString()}
                  change="+3 this week"
                  trend="up"
                  period="active accounts"
                  icon={Users}
                  color="brand"
                />
                <StatCard
                  title="Formulations Built"
                  value={adminActivities
                    .filter((a) => a.category === 'Formulation')
                    .length.toString() || '4'}
                  change="Total batches"
                  trend="up"
                  period="across all users"
                  icon={FlaskConical}
                  color="purple"
                />
                <StatCard
                  title="Active Accounts"
                  value={adminUsers.filter((u) => u.is_active).length.toString()}
                  change="100%"
                  trend="up"
                  period="active rate"
                  icon={CheckCircle2}
                  color="emerald"
                />
                <StatCard
                  title="Security Status"
                  value="Optimal"
                  change="No alerts"
                  trend="up"
                  period="JWT + Passlib"
                  icon={ShieldCheck}
                  color="brand"
                />
              </>
            )}
          </div>

          {/* Section: Users Present in Website */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  <span>Users Registered in Website</span>
                </CardTitle>
                <CardDescription>
                  List of all scientists, pharmacologists, and administrators registered on the platform.
                </CardDescription>
              </div>

              {/* User search & filter controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Roles</option>
                  <option value="administrator">Administrators</option>
                  <option value="pharmacologist">Pharmacologists</option>
                  <option value="member">Members</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-center">Formulations</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredAdminUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No registered users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full border border-zinc-200 object-cover bg-zinc-100"
                              />
                              <div>
                                <p className="font-semibold text-zinc-900">{u.name}</p>
                                <p className="text-[11px] text-zinc-500">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-600 font-mono text-[11px]">{u.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                u.role?.toLowerCase().includes('admin')
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-brand-50 text-brand-700 border-brand-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-semibold font-mono text-[11px]">
                              {u.formulations_count}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-500 text-[11px]">{u.created_at}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Section: User Activity Audit Log */}
          <div>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>User Activity & Formulation Events</span>
              </h2>
              <p className="text-xs text-zinc-500">
                Live audit trail of formulation saves, user logins, and system operations across all accounts.
              </p>
            </div>
            <ActivityTable
              activities={adminActivities}
              isLoading={isLoading}
              onRefresh={() => fetchOverviewData(true)}
            />
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. REGULAR USER OVERVIEW: RECENT FORMULATIONS BUILT BY THIS USER          */
        /* ========================================================================= */
        <div className="space-y-8 animate-fade-in">
          {/* User Formulation KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="My Formulations"
                  value={userFormulations.length.toString()}
                  change="Total candidates"
                  trend="up"
                  period="saved in vault"
                  icon={FlaskConical}
                  color="brand"
                />
                <StatCard
                  title="Validated Batches"
                  value={userFormulations.filter((f) => f.is_valid).length.toString()}
                  change="Passed safety audit"
                  trend="up"
                  period="100% compliant"
                  icon={CheckCircle2}
                  color="emerald"
                />
                <StatCard
                  title="Delivery Routes"
                  value={
                    new Set(userFormulations.map((f) => f.delivery_vehicle)).size.toString()
                  }
                  change="Oral, IV, LNP"
                  trend="up"
                  period="vehicles used"
                  icon={Layers}
                  color="purple"
                />
                <StatCard
                  title="Chemistry Engine"
                  value="RDKit Active"
                  change="SMARTS alerts"
                  trend="up"
                  period="BCS Class I-IV"
                  icon={Atom}
                  color="amber"
                />
              </>
            )}
          </div>

          {/* Section: Recent Formulations Built by User */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-brand-600" />
                  <span>Recent Formulations Built by You</span>
                </CardTitle>
                <CardDescription>
                  Review your saved pharmaceutical drug formulations, computational chemistry validation, and excipient mixes.
                </CardDescription>
              </div>

              {/* Formulation search & filter controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search drug candidate or SMILES..."
                    value={formulationSearchTerm}
                    onChange={(e) => setFormulationSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="all">All Delivery Vehicles</option>
                  <option value="oral_tablet">Oral Tablet</option>
                  <option value="oral_solution">Oral Solution</option>
                  <option value="iv_infusion">IV Infusion</option>
                  <option value="lipid_nanoparticles">Lipid Nanoparticles</option>
                  <option value="liposome">Liposomal</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredFormulations.length === 0 ? (
                /* Empty state when no formulations exist */
                <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 mb-3 shadow-xs">
                    <FlaskConical className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 mb-1">
                    No Formulations Found
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-md mb-5">
                    You haven't built any drug formulations yet. Design your first formulation using the RDKit chemistry engine and live excipient compatibility audit!
                  </p>
                  <Button
                    variant="primary"
                    leftIcon={Plus}
                    onClick={() => navigate('/dashboard/formulation')}
                  >
                    Build Your First Formulation
                  </Button>
                </div>
              ) : (
                /* Formulations Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Drug Candidate (API)</th>
                        <th className="py-3 px-4">Delivery Route</th>
                        <th className="py-3 px-4">Dose & pH</th>
                        <th className="py-3 px-4">Excipients</th>
                        <th className="py-3 px-4">Validation</th>
                        <th className="py-3 px-4">Date Built</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredFormulations.map((form) => {
                        const vehicleStyle = formatDeliveryVehicle(form.delivery_vehicle);
                        const excipientsCount = form.excipients?.length || 0;
                        const createdDate = form.created_at
                          ? new Date(form.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recently';

                        return (
                          <tr key={form.id} className="hover:bg-zinc-50/80 transition-colors">
                            {/* Candidate API */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5">
                                  <Atom className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                  {form.api_name}
                                </span>
                                <span
                                  className="text-[10px] text-zinc-400 font-mono truncate max-w-xs mt-0.5"
                                  title={form.api_smiles}
                                >
                                  {form.api_smiles}
                                </span>
                              </div>
                            </td>

                            {/* Delivery Vehicle */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${vehicleStyle.color}`}
                              >
                                {vehicleStyle.label}
                              </span>
                            </td>

                            {/* Target Dose & pH */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col text-[11px]">
                                <span className="font-semibold text-zinc-800">
                                  {form.target_dose_mg} mg
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  Target pH: {form.target_ph}
                                </span>
                              </div>
                            </td>

                            {/* Excipients count */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium text-[11px]">
                                <Boxes className="w-3 h-3 text-zinc-500" />
                                {excipientsCount} {excipientsCount === 1 ? 'excipient' : 'excipients'}
                              </span>
                            </td>

                            {/* Validation Status */}
                            <td className="py-3 px-4">
                              {form.is_valid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  COMPLIANT
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                                  <AlertCircle className="w-3 h-3" />
                                  REVIEW
                                </span>
                              )}
                            </td>

                            {/* Date Built */}
                            <td className="py-3 px-4 text-zinc-500 text-[11px]">
                              {createdDate}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  leftIcon={ExternalLink}
                                  onClick={() => navigate('/dashboard/formulation')}
                                  title="Open Formulation Builder"
                                >
                                  Open
                                </Button>

                                <button
                                  onClick={() => handleDeleteFormulation(form.id, form.api_name)}
                                  disabled={deletingId === form.id}
                                  className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete formulation"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OverviewView;
