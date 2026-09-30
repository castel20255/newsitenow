'use server';

import { getCountries, parsePhoneNumberFromString } from 'libphonenumber-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthActionState {
  status: 'idle' | 'error' | 'success';
  message: string;
  confirmationRequired?: boolean;
}

const idleState: AuthActionState = { status: 'idle', message: '' };
const INVALID_CREDENTIALS = 'The username/email or password is incorrect.';

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export async function signUpAccount(
  _previous: AuthActionState = idleState,
  formData: FormData
): Promise<AuthActionState> {
  const username = readField(formData, 'username').toLowerCase();
  const fullName = readField(formData, 'fullName');
  const email = readField(formData, 'email').toLowerCase();
  const countryCode = readField(formData, 'countryCode').toUpperCase();
  const countryName = readField(formData, 'countryName');
  const phoneNumber = readField(formData, 'phoneNumber');
  const password = String(formData.get('password') ?? '');
  const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');
  const termsAccepted = formData.get('termsAccepted') === 'on';

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return { status: 'error', message: 'Username must be 3 to 24 letters, numbers, or underscores.' };
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return { status: 'error', message: 'Enter your full name.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }
  if (!(getCountries() as string[]).includes(countryCode)) {
    return { status: 'error', message: 'Choose a valid country.' };
  }
  const parsedPhone = parsePhoneNumberFromString(phoneNumber, countryCode as never);
  if (!parsedPhone?.isValid()) {
    return { status: 'error', message: 'Enter a valid phone number for the selected country.' };
  }
  if (password.length < 10 || password.length > 128) {
    return { status: 'error', message: 'Use a password between 10 and 128 characters.' };
  }
  if (password !== passwordConfirmation) {
    return { status: 'error', message: 'The passwords do not match.' };
  }
  if (!termsAccepted) {
    return { status: 'error', message: 'Accept the terms to create your account.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          country_code: countryCode,
          country_name: countryName,
          phone_e164: parsedPhone.number,
          terms_accepted: true,
        },
      },
    });

    if (error || !data.user) {
      return {
        status: 'error',
        message: 'We could not create this account. Check your details or try signing in.',
      };
    }

    return {
      status: 'success',
      confirmationRequired: !data.session,
      message: data.session
        ? 'Your account is ready. You can start with your demo balance.'
        : 'Check your email to verify your account and finish signing up.',
    };
  } catch {
    return {
      status: 'error',
      message: 'Account service is unavailable. Check the Supabase configuration and try again.',
    };
  }
}

export async function signInAccount(
  _previous: AuthActionState = idleState,
  formData: FormData
): Promise<AuthActionState> {
  const identifier = readField(formData, 'identifier').toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!identifier || !password) {
    return { status: 'error', message: 'Enter your email or username and password.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    let email = identifier;

    if (!identifier.includes('@')) {
      if (!/^[a-z0-9_]{3,24}$/.test(identifier)) {
        return { status: 'error', message: INVALID_CREDENTIALS };
      }
      const admin = createSupabaseAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('username', identifier)
        .maybeSingle();
      if (!profile) return { status: 'error', message: INVALID_CREDENTIALS };

      const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.id);
      email = authUserError ? '' : authUser.user.email ?? '';
    }

    if (!email) return { status: 'error', message: INVALID_CREDENTIALS };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { status: 'error', message: INVALID_CREDENTIALS };

    return { status: 'success', message: 'Signed in.' };
  } catch {
    return {
      status: 'error',
      message: 'Account service is unavailable. Check the Supabase configuration and try again.',
    };
  }
}

export async function signOutAccount(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}