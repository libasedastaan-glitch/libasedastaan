import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Trash2,
  Lock,
  Mail,
  User,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types/index.ts';
import { teamService } from '../../services/teamService.ts';

interface TeamManagementProps {
  currentUserRole: UserRole;
  currentUserId?: string;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  currentUserRole,
  currentUserId,
  onToast,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(teamService.getProfiles());
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    // Initial fetch
    setLoading(true);
    teamService.fetchProfiles().then((data) => {
      setProfiles(data);
      setLoading(false);
    });

    // Subscribe to realtime updates
    const unsubscribe = teamService.subscribe(() => {
      setProfiles([...teamService.getProfiles()]);
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    const data = await teamService.fetchProfiles();
    setProfiles(data);
    setLoading(false);
    onToast('info', 'Realtime Sync', 'Team profiles synchronized with Supabase PostgreSQL.');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let res = '';
    for (let i = 0; i < 14; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onToast('error', 'Restricted', 'Only Administrators can create new staff accounts.');
      return;
    }

    if (!fullName || !email || !password) {
      onToast('error', 'Incomplete Form', 'Please provide full name, email, and a secure password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await teamService.addTeamMember({
        full_name: fullName,
        email,
        role,
        password,
      });

      onToast(
        'success',
        'Staff Member Created',
        `${created.full_name} (${created.email}) was added as ${created.role.toUpperCase()} with encrypted credentials in Supabase.`
      );

      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('manager');
      setIsModalOpen(false);
    } catch (err: any) {
      onToast('error', 'Creation Failed', err.message || 'Could not insert profile into database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    if (!isAdmin) {
      onToast('error', 'Permission Denied', 'Only Administrators can change user roles.');
      return;
    }

    try {
      await teamService.updateMemberRole(profileId, newRole);
      onToast('success', 'Role Updated', `User permissions updated to ${newRole.toUpperCase()} in database.`);
    } catch (err: any) {
      onToast('error', 'Update Failed', err.message || 'Could not update role in database.');
    }
  };

  const handleRemoveMember = async (profileId: string) => {
    if (!isAdmin) {
      onToast('error', 'Permission Denied', 'Only Administrators can remove team members.');
      return;
    }

    try {
      await teamService.removeTeamMember(profileId);
      onToast('info', 'Member Removed', 'User profile deleted from Supabase database.');
      setDeleteConfirmId(null);
    } catch (err: any) {
      onToast('error', 'Deletion Failed', err.message || 'Could not delete user.');
    }
  };

  const adminCount = profiles.filter((p) => p.role === 'admin').length;
  const managerCount = profiles.filter((p) => p.role === 'manager').length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 select-none bg-[#FAF6F0] text-[#3B2314]">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[#3B2314] tracking-wider uppercase">
              Personnel &amp; Role Governance
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#EDF3EC] border border-[#C3D5C0] text-[#526A50] text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#526A50]" />
              <span>Realtime DB Active</span>
            </div>
          </div>
          <p className="text-xs text-[#3B2314]/70 mt-1 font-light">
            Manage administrative personnel, assign roles, and store credentials securely encrypted in Supabase PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2.5 bg-[#FFFDF9] hover:bg-[#F4EFE6] text-[#3B2314] border border-[#D8CEC4] transition-colors rounded-none"
            title="Refresh Realtime Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#9E5A38]' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif font-bold text-xs uppercase tracking-widest shadow-sm transition-colors rounded-none"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury flex items-center justify-between rounded-none">
          <div>
            <div className="text-[10px] text-[#3B2314]/60 uppercase tracking-widest font-serif font-semibold">
              Total Staff Profiles
            </div>
            <div className="text-2xl font-serif font-bold text-[#3B2314] mt-1">{profiles.length}</div>
            <div className="text-[10px] text-[#526A50] mt-0.5">Stored in public.profiles</div>
          </div>
          <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury flex items-center justify-between rounded-none">
          <div>
            <div className="text-[10px] text-[#3B2314]/60 uppercase tracking-widest font-serif font-semibold">
              Administrators
            </div>
            <div className="text-2xl font-serif font-bold text-[#3B2314] mt-1">{adminCount}</div>
            <div className="text-[10px] text-[#3B2314]/60 mt-0.5 font-light">Full Add, Edit &amp; Delete</div>
          </div>
          <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-[#FFFDF9] border border-[#D8CEC4] shadow-luxury flex items-center justify-between rounded-none">
          <div>
            <div className="text-[10px] text-[#3B2314]/60 uppercase tracking-widest font-serif font-semibold">
              Catalog Managers
            </div>
            <div className="text-2xl font-serif font-bold text-[#9E5A38] mt-1">{managerCount}</div>
            <div className="text-[10px] text-[#3B2314]/60 mt-0.5 font-light">Can Add &amp; Edit (No Delete)</div>
          </div>
          <div className="w-10 h-10 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38]">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="border border-[#D8CEC4] bg-[#FFFDF9] shadow-luxury overflow-hidden rounded-none">
        <div className="px-5 py-3.5 bg-[#F4EFE6] border-b border-[#D8CEC4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#9E5A38]" />
            <h3 className="text-xs font-serif font-bold text-[#3B2314] uppercase tracking-wider">
              Active Database Profiles (Supabase Realtime)
            </h3>
          </div>
          <span className="text-[10px] text-[#3B2314]/60 font-mono">
            {profiles.length} registered staff
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6F0] border-b border-[#D8CEC4] text-[#3B2314] uppercase tracking-wider font-serif font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Password Security</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CEC4]">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#3B2314]/60 font-serif">
                    No staff profiles found. Click "Add Staff Member" or Refresh to load default profiles.
                  </td>
                </tr>
              ) : (
                profiles.map((p) => {
                  const isCurrent = p.id === currentUserId || p.email === 'libasedastaan@gmail.com';
                  return (
                    <tr key={p.id} className="hover:bg-[#F2ECE2] transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center text-xs font-serif font-bold ${
                            p.role === 'admin'
                              ? 'bg-[#3B2314] text-[#FAF6F0]'
                              : 'bg-[#9E5A38] text-[#FAF6F0]'
                          }`}>
                            {p.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-serif font-semibold text-[#3B2314] flex items-center gap-1.5">
                              <span>{p.full_name}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1 py-0.2 bg-[#EFE8DE] text-[#3B2314] font-mono border border-[#D8CEC4]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#3B2314]/50 font-mono truncate max-w-[120px]">
                              {p.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[#3B2314]/80">
                        {p.email}
                      </td>

                      {/* Role Selector */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <select
                            value={p.role}
                            onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                            className="bg-[#FAF6F0] border border-[#D8CEC4] px-2.5 py-1 text-xs font-serif uppercase tracking-wider font-semibold text-[#3B2314] focus:outline-none focus:border-[#9E5A38] rounded-none"
                          >
                            <option value="admin">Administrator (Full Access)</option>
                            <option value="manager">Catalog Manager (Restricted)</option>
                            <option value="editor">Editor (Content Only)</option>
                            <option value="support">Support Agent</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-serif font-bold uppercase tracking-wider ${
                            p.role === 'admin'
                              ? 'bg-[#3B2314] text-[#FAF6F0]'
                              : 'bg-[#9E5A38] text-[#FAF6F0]'
                          }`}>
                            {p.role}
                          </span>
                        )}
                      </td>

                      {/* Password Security Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#526A50] font-mono">
                          <Lock className="w-3 h-3 text-[#526A50]" />
                          <span>Encrypted (SHA-256)</span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-[#3B2314]/70 text-[11px] font-serif">
                        {new Date(p.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin && !isCurrent ? (
                          deleteConfirmId === p.id ? (
                            <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-150">
                              <button
                                onClick={() => handleRemoveMember(p.id)}
                                className="px-2 py-1 bg-[#8F423B] hover:bg-[#7D3832] text-[#FAF6F0] text-[10px] font-serif uppercase tracking-wider font-bold rounded-none"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-[#FAF6F0] text-[#3B2314] border border-[#D8CEC4] text-[10px] rounded-none"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-1.5 text-[#3B2314]/50 hover:text-[#8F423B] transition-colors"
                              title="Remove Person from Dashboard"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-[#3B2314]/30 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MEMBER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl p-6 space-y-5 rounded-none text-[#3B2314]">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8CEC4]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 border border-[#D8CEC4] bg-[#F4EFE6] flex items-center justify-center text-[#9E5A38]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#3B2314] uppercase tracking-wider">
                    Add Staff Member
                  </h3>
                  <p className="text-[11px] text-[#3B2314]/60 font-light">
                    Stores credentials encrypted in PostgreSQL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#3B2314]/50 hover:text-[#3B2314] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#3B2314] mb-1 font-semibold">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] pl-9 pr-3.5 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#3B2314] mb-1 font-semibold">
                  Staff Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ayesha@libasedastaan.com"
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] pl-9 pr-3.5 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] font-mono rounded-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-[#3B2314] mb-1 font-semibold">
                  Assigned Staff Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2.5 text-xs text-[#3B2314] font-serif uppercase tracking-wider focus:outline-none focus:border-[#9E5A38] rounded-none cursor-pointer"
                >
                  <option value="admin">Administrator (Can Add, Update, and Delete products)</option>
                  <option value="manager">Catalog Manager (Can Add &amp; Update products, CANNOT Delete)</option>
                  <option value="editor">Editor (Product descriptions &amp; photos only)</option>
                  <option value="support">Support Agent (Orders processing)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-serif uppercase tracking-wider text-[#3B2314] font-semibold">
                    Password (Encrypted before storage) *
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[10px] text-[#9E5A38] hover:underline font-serif tracking-wider font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-[#FFFDF9] border border-[#D8CEC4] pl-9 pr-10 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] font-mono rounded-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B2314]/50 hover:text-[#3B2314]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-3 bg-[#EDF3EC] border border-[#C3D5C0] text-[11px] text-[#3B2314] space-y-1">
                <div className="flex items-center gap-1.5 text-[#526A50] font-serif font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cryptographic Salted Hash</span>
                </div>
                <p className="text-[10px] leading-relaxed text-[#3B2314]/80 font-light">
                  Passwords are cryptographically hashed using SHA-256 with unique salting before being written to PostgreSQL.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-[#3B2314] text-[#3B2314] hover:bg-[#3B2314]/5 text-xs font-serif uppercase tracking-wider rounded-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-serif font-bold text-xs uppercase tracking-wider disabled:opacity-50 rounded-none shadow-sm"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Save to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
