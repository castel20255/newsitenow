module.exports = [
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/actions/account-auth.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "000b1f44d700e1d3ed8305113ef8268172bb041356",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$account$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signOutAccount"],
    "6028d8d6d13d41ce7df7792b7957f6cdcff726f7c6",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$account$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signUpAccount"],
    "607f61d45337cf11c6ff04448995ff9626108996c7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$account$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signInAccount"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$actions$2f$account$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => "[project]/app/actions/account-auth.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$account$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/actions/account-auth.ts [app-rsc] (ecmascript)");
}),
"[project]/.next-internal/server/app/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/actions/account-auth.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$account$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/actions/account-auth.ts [app-rsc] (ecmascript)");
;
;
;
}),
"[project]/app/actions/account-auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"000b1f44d700e1d3ed8305113ef8268172bb041356":{"name":"signOutAccount"},"6028d8d6d13d41ce7df7792b7957f6cdcff726f7c6":{"name":"signUpAccount"},"607f61d45337cf11c6ff04448995ff9626108996c7":{"name":"signInAccount"}},"app/actions/account-auth.ts",""] */ __turbopack_context__.s([
    "signInAccount",
    ()=>signInAccount,
    "signOutAccount",
    ()=>signOutAccount,
    "signUpAccount",
    ()=>signUpAccount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$getCountries$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/libphonenumber-js/min/exports/getCountries.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$parsePhoneNumber$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__parsePhoneNumber__as__parsePhoneNumberFromString$3e$__ = __turbopack_context__.i("[project]/node_modules/libphonenumber-js/min/exports/parsePhoneNumber.js [app-rsc] (ecmascript) <export parsePhoneNumber as parsePhoneNumberFromString>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
const idleState = {
    status: 'idle',
    message: ''
};
const INVALID_CREDENTIALS = 'The username/email or password is incorrect.';
function readField(formData, name) {
    const value = formData.get(name);
    return typeof value === 'string' ? value.trim() : '';
}
async function signUpAccount(_previous = idleState, formData) {
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
        return {
            status: 'error',
            message: 'Username must be 3 to 24 letters, numbers, or underscores.'
        };
    }
    if (fullName.length < 2 || fullName.length > 120) {
        return {
            status: 'error',
            message: 'Enter your full name.'
        };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            status: 'error',
            message: 'Enter a valid email address.'
        };
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$getCountries$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCountries"])().includes(countryCode)) {
        return {
            status: 'error',
            message: 'Choose a valid country.'
        };
    }
    const parsedPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$parsePhoneNumber$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__parsePhoneNumber__as__parsePhoneNumberFromString$3e$__["parsePhoneNumberFromString"])(phoneNumber, countryCode);
    if (!parsedPhone?.isValid()) {
        return {
            status: 'error',
            message: 'Enter a valid phone number for the selected country.'
        };
    }
    if (password.length < 10 || password.length > 128) {
        return {
            status: 'error',
            message: 'Use a password between 10 and 128 characters.'
        };
    }
    if (password !== passwordConfirmation) {
        return {
            status: 'error',
            message: 'The passwords do not match.'
        };
    }
    if (!termsAccepted) {
        return {
            status: 'error',
            message: 'Accept the terms to create your account.'
        };
    }
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSupabaseServerClient"])();
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
                    terms_accepted: true
                }
            }
        });
        if (error || !data.user) {
            return {
                status: 'error',
                message: 'We could not create this account. Check your details or try signing in.'
            };
        }
        return {
            status: 'success',
            confirmationRequired: !data.session,
            message: data.session ? 'Your account is ready. You can start with your demo balance.' : 'Check your email to verify your account and finish signing up.'
        };
    } catch  {
        return {
            status: 'error',
            message: 'Account service is unavailable. Check the Supabase configuration and try again.'
        };
    }
}
async function signInAccount(_previous = idleState, formData) {
    const identifier = readField(formData, 'identifier').toLowerCase();
    const password = String(formData.get('password') ?? '');
    if (!identifier || !password) {
        return {
            status: 'error',
            message: 'Enter your email or username and password.'
        };
    }
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSupabaseServerClient"])();
        let email = identifier;
        if (!identifier.includes('@')) {
            if (!/^[a-z0-9_]{3,24}$/.test(identifier)) {
                return {
                    status: 'error',
                    message: INVALID_CREDENTIALS
                };
            }
            const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSupabaseAdminClient"])();
            const { data: profile } = await admin.from('profiles').select('id').eq('username', identifier).maybeSingle();
            if (!profile) return {
                status: 'error',
                message: INVALID_CREDENTIALS
            };
            const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.id);
            email = authUserError ? '' : authUser.user.email ?? '';
        }
        if (!email) return {
            status: 'error',
            message: INVALID_CREDENTIALS
        };
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) return {
            status: 'error',
            message: INVALID_CREDENTIALS
        };
        return {
            status: 'success',
            message: 'Signed in.'
        };
    } catch  {
        return {
            status: 'error',
            message: 'Account service is unavailable. Check the Supabase configuration and try again.'
        };
    }
}
async function signOutAccount() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSupabaseServerClient"])();
    await supabase.auth.signOut();
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    signUpAccount,
    signInAccount,
    signOutAccount
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signUpAccount, "6028d8d6d13d41ce7df7792b7957f6cdcff726f7c6", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signInAccount, "607f61d45337cf11c6ff04448995ff9626108996c7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signOutAccount, "000b1f44d700e1d3ed8305113ef8268172bb041356", null);
}),
"[project]/lib/supabase/admin.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSupabaseAdminClient",
    ()=>createSupabaseAdminClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/config.ts [app-rsc] (ecmascript)");
;
;
;
function createSupabaseAdminClient() {
    const { url, serviceRoleKey, isServerConfigured } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSupabaseConfig"])();
    if (!isServerConfigured || !url || !serviceRoleKey) {
        throw new Error('Supabase server credentials are not configured.');
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false
        }
    });
}
}),
"[project]/lib/supabase/config.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseConfig",
    ()=>getSupabaseConfig
]);
function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    return {
        url,
        anonKey,
        serviceRoleKey,
        isBrowserConfigured: Boolean(url && anonKey),
        isServerConfigured: Boolean(url && anonKey && serviceRoleKey)
    };
}
}),
"[project]/lib/supabase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSupabaseServerClient",
    ()=>createSupabaseServerClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/config.ts [app-rsc] (ecmascript)");
;
;
;
;
async function createSupabaseServerClient() {
    const { url, anonKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSupabaseConfig"])();
    if (!url || !anonKey) throw new Error('Supabase is not configured.');
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(url, anonKey, {
        cookies: {
            getAll: ()=>cookieStore.getAll(),
            setAll: (cookiesToSet)=>{
                for (const { name, value, options } of cookiesToSet){
                    cookieStore.set(name, value, options);
                }
            }
        }
    });
}
}),
];

//# sourceMappingURL=_19dlcbw._.js.map