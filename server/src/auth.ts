import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend environment.'
    );
}

const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error('Missing JWT_SECRET in backend environment.');
}

const JWT_SECRET: string = secret;

const expiry = process.env.JWT_EXPIRY || '15m';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
    },
});

// ─── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ─── JWT helpers ───────────────────────────────────────────────────────────────

export function signJwt(payload: Record<string, unknown>): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: expiry as jwt.SignOptions['expiresIn'],
    });
}

export function verifyJwt(token: string): Record<string, unknown> | null {
    try {
        return jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    } catch {
        return null;
    }
}

// ─── User queries (public.users) ───────────────────────────────────────────────

export async function findUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, password_hash, role, is_active')
        .eq('email', email)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function findUserById(id: string) {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_active')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createUser(email: string, passwordHash: string) {
    const { data, error } = await supabaseAdmin
        .from('users')
        .insert({ email, password_hash: passwordHash })
        .select('id, email, role')
        .single();

    if (error) throw error;
    return data;
}

export async function updateLastLogin(userId: string): Promise<void> {
    await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', userId);
    if (error) throw error;
}

// ─── Profile queries (public.user_profiles) ────────────────────────────────────

export async function createUserProfile(
    userId: string,
    fullName: string | null
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
            user_id: userId,           // FK → public.users.id
            full_name: fullName,
        });

    if (error) throw error;
}

export async function getUserProfile(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('full_name, phone, company_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}
