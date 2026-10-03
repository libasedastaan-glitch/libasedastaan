import { supabase, isSupabaseLive } from '../../lib/supabase/client.ts';
import { UserProfile, UserRole } from '../types/index.ts';

// Cryptographic hash helper using native browser Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = 'libasedastaan_salt_2026_';
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `enc:sha256:${hashHex}`;
}

export async function verifyPasswordHash(password: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  const computed = await hashPassword(password);
  return computed === storedHash;
}

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@libasedastaan.com',
    full_name: 'Lead Administrator',
    role: 'admin',
    created_at: new Date('2026-01-01').toISOString(),
    password_hash: 'enc:sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'manager@libasedastaan.com',
    full_name: 'Catalog Manager',
    role: 'manager',
    created_at: new Date('2026-01-05').toISOString(),
    password_hash: 'enc:sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'libasedastaan@gmail.com',
    full_name: 'Lead Director',
    role: 'admin',
    created_at: new Date('2026-01-01').toISOString(),
    password_hash: 'enc:sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  },
];

class TeamService {
  private profiles: UserProfile[] = [...INITIAL_PROFILES];
  private listeners: (() => void)[] = [];
  private isInitialized = false;
  private realtimeChannel: any = null;

  constructor() {
    this.init();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    await this.fetchProfiles();
    this.setupRealtimeSubscription();
  }

  /**
   * Fetches all staff profiles from Supabase live database in real-time
   */
  public async fetchProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseLive()) {
      return this.profiles;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[TeamService] Could not fetch profiles from Supabase:', error.message);
        return this.profiles;
      }

      if (data && data.length > 0) {
        this.profiles = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          email: item.email,
          full_name: item.full_name || 'Staff Member',
          role: (item.role as UserRole) || 'manager',
          phone: item.phone,
          password_hash: item.password_hash,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        this.notify();
        return this.profiles;
      }

      // If profiles table in Supabase is completely empty, auto-seed default profiles
      console.log('[TeamService] Profiles table is empty. Auto-seeding default team profiles...');
      await this.seedDefaultProfiles();
      return this.profiles;
    } catch (err) {
      console.error('[TeamService] Error fetching profiles:', err);
      return this.profiles;
    }
  }

  /**
   * Populates the database with initial profiles so it is never empty
   */
  public async seedDefaultProfiles(): Promise<void> {
    if (!isSupabaseLive()) return;

    for (const p of INITIAL_PROFILES) {
      try {
        const hashedPassword = await hashPassword('AdminPassword123!');
        await supabase.from('profiles').upsert(
          {
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            role: p.role,
            password_hash: hashedPassword,
            created_at: p.created_at,
          },
          { onConflict: 'email' }
        );
      } catch (e) {
        console.warn(`[TeamService] Seeding notice for ${p.email}:`, e);
      }
    }

    // Refresh after insert
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    if (data && data.length > 0) {
      this.profiles = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        email: item.email,
        full_name: item.full_name || 'Staff Member',
        role: (item.role as UserRole) || 'manager',
        phone: item.phone,
        password_hash: item.password_hash,
        created_at: item.created_at,
      }));
      this.notify();
    }
  }

  /**
   * Listens to live Realtime PostgreSQL WebSocket events on profiles table
   */
  private setupRealtimeSubscription() {
    if (!isSupabaseLive()) return;

    try {
      this.realtimeChannel = supabase
        .channel('realtime:team_profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            console.log('[Realtime DB Profile Change]', payload.eventType, payload);

            if (payload.eventType === 'INSERT') {
              const newProfile: any = payload.new;
              const exists = this.profiles.some((p) => p.id === newProfile.id || p.email === newProfile.email);
              if (!exists) {
                this.profiles = [
                  ...this.profiles,
                  {
                    id: newProfile.id,
                    user_id: newProfile.user_id,
                    email: newProfile.email,
                    full_name: newProfile.full_name || 'Staff Member',
                    role: newProfile.role || 'manager',
                    password_hash: newProfile.password_hash,
                    created_at: newProfile.created_at,
                  },
                ];
                this.notify();
              }
            } else if (payload.eventType === 'UPDATE') {
              const updated: any = payload.new;
              this.profiles = this.profiles.map((p) =>
                p.id === updated.id || p.email === updated.email
                  ? {
                      ...p,
                      role: updated.role || p.role,
                      full_name: updated.full_name || p.full_name,
                      password_hash: updated.password_hash || p.password_hash,
                      updated_at: updated.updated_at,
                    }
                  : p
              );
              this.notify();
            } else if (payload.eventType === 'DELETE') {
              const oldItem: any = payload.old;
              this.profiles = this.profiles.filter((p) => p.id !== oldItem.id);
              this.notify();
            }
          }
        )
        .subscribe((status) => {
          console.log('[Supabase Realtime Profiles Status]', status);
        });
    } catch (e) {
      console.warn('[TeamService] Realtime subscription init error:', e);
    }
  }

  public getProfiles(): UserProfile[] {
    return this.profiles;
  }

  /**
   * Adds a new team member with encrypted password and inserts into Supabase
   */
  public async addTeamMember(data: {
    email: string;
    full_name: string;
    role: UserRole;
    password: string;
  }): Promise<UserProfile> {
    const cleanEmail = data.email.trim().toLowerCase();
    const encryptedPassword = await hashPassword(data.password);

    console.log(`[TeamService] Creating member ${cleanEmail} with encrypted password hash.`);

    // 1. Create Supabase Auth user if available
    let authUserId: string | undefined;
    try {
      const authRes = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
          },
        },
      });
      authUserId = authRes.data?.user?.id;
    } catch (authErr) {
      console.warn('[TeamService] Supabase Auth sign up notice:', authErr);
    }

    const newProfile: UserProfile = {
      id: authUserId || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: authUserId,
      email: cleanEmail,
      full_name: data.full_name.trim(),
      role: data.role,
      password_hash: encryptedPassword,
      created_at: new Date().toISOString(),
    };

    // 2. Insert into Supabase profiles table
    if (isSupabaseLive()) {
      const payload: any = {
        id: newProfile.id,
        email: newProfile.email,
        full_name: newProfile.full_name,
        role: newProfile.role,
        password_hash: encryptedPassword,
      };
      if (authUserId) {
        payload.user_id = authUserId;
      }

      const { data: dbData, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();

      if (error) {
        console.error('[TeamService] Supabase DB Insert Error:', error);
        throw new Error(error.message);
      }

      if (dbData) {
        newProfile.id = dbData.id;
      }
    }

    // Update in-memory state
    this.profiles = [
      ...this.profiles.filter((p) => p.email !== cleanEmail),
      newProfile,
    ];
    this.notify();

    return newProfile;
  }

  /**
   * Updates a team member's role directly in the Supabase database
   */
  public async updateMemberRole(id: string, newRole: UserRole): Promise<UserProfile | null> {
    console.log(`[TeamService] Updating member role ${id} to ${newRole}`);

    if (isSupabaseLive()) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        // Fallback search by email
        const target = this.profiles.find((p) => p.id === id);
        if (target) {
          const { error: emailErr } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('email', target.email);

          if (emailErr) throw new Error(emailErr.message);
        } else {
          throw new Error(error.message);
        }
      }
    }

    this.profiles = this.profiles.map((p) =>
      p.id === id ? { ...p, role: newRole } : p
    );
    this.notify();

    return this.profiles.find((p) => p.id === id) || null;
  }

  /**
   * Removes a person from the profiles database
   */
  public async removeTeamMember(id: string): Promise<boolean> {
    console.log(`[TeamService] Removing team member ${id}`);

    if (isSupabaseLive()) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);

      if (error) {
        // Fallback by email
        const target = this.profiles.find((p) => p.id === id);
        if (target) {
          await supabase.from('profiles').delete().eq('email', target.email);
        } else {
          throw new Error(error.message);
        }
      }
    }

    this.profiles = this.profiles.filter((p) => p.id !== id);
    this.notify();
    return true;
  }
}

export const teamService = new TeamService();
