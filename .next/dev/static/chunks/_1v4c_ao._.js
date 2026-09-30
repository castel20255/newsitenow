(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/custom/ViewportScaler.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ViewportScaler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const MIN_SCALE = 0.5;
const LG_BREAKPOINT = 1024; // matches Tailwind's `lg`
function ViewportScaler({ children }) {
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [scale, setScale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const updateScale = ()=>{
        const el = containerRef.current;
        if (!el) return;
        if (window.innerWidth >= LG_BREAKPOINT) {
            setScale(false);
            return;
        }
        // Temporarily clear transform so scrollHeight reflects the natural (unscaled) height
        el.style.transform = 'none';
        const naturalHeight = el.scrollHeight;
        el.style.transform = '';
        if (!naturalHeight) return;
        const newScale = Math.max(MIN_SCALE, Math.min(1, window.innerHeight / naturalHeight));
        setScale((prev)=>prev === newScale ? prev : newScale);
    };
    // Synchronous first measurement before browser paint — prevents visible unscaled frame.
    // Calling setState inside useLayoutEffect is intentional: we need the DOM measurement
    // to happen synchronously before the browser paints to avoid a visible unscaled frame.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "ViewportScaler.useLayoutEffect": ()=>{
            // eslint-disable-next-line react-hooks/set-state-in-effect
            updateScale();
        }
    }["ViewportScaler.useLayoutEffect"], []);
    // React to content height changes (fonts loading, dynamic data, images)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ViewportScaler.useEffect": ()=>{
            const el = containerRef.current;
            if (!el) return;
            const ro = new ResizeObserver({
                "ViewportScaler.useEffect": ()=>updateScale()
            }["ViewportScaler.useEffect"]);
            ro.observe(el);
            return ({
                "ViewportScaler.useEffect": ()=>ro.disconnect()
            })["ViewportScaler.useEffect"];
        }
    }["ViewportScaler.useEffect"], []);
    // Debounced window resize + orientation-change listener
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ViewportScaler.useEffect": ()=>{
            let timer;
            const handler = {
                "ViewportScaler.useEffect.handler": ()=>{
                    clearTimeout(timer);
                    timer = setTimeout(updateScale, 100);
                }
            }["ViewportScaler.useEffect.handler"];
            window.addEventListener('resize', handler);
            window.addEventListener('orientationchange', handler);
            return ({
                "ViewportScaler.useEffect": ()=>{
                    clearTimeout(timer);
                    window.removeEventListener('resize', handler);
                    window.removeEventListener('orientationchange', handler);
                }
            })["ViewportScaler.useEffect"];
        }
    }["ViewportScaler.useEffect"], []);
    const isMobile = typeof scale === 'number';
    const isReady = scale !== null;
    // Desktop (or pre-measurement): plain passthrough container.
    // Also used as the measurement host before the first scale value is known.
    if (!isMobile) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef,
            style: {
                height: '100dvh',
                opacity: isReady ? 1 : 0,
                transition: 'opacity 0.15s ease'
            },
            children: children
        }, void 0, false, {
            fileName: "[project]/components/custom/ViewportScaler.tsx",
            lineNumber: 77,
            columnNumber: 7
        }, this);
    }
    // Mobile with a computed scale.
    //
    // Two-layer structure:
    //   • Outer clip wrapper — fixed 100vw × 100dvh, overflow:hidden.
    //     Acts as the viewport "frame" and hides the oversized inner div
    //     before the CSS transform is applied.
    //   • Inner measured div (containerRef) — intentionally wider than the
    //     viewport (width = 100vw / scale) so that after scale(n) it is
    //     exactly 100vw.  transformOrigin:top-left keeps the top-left corner
    //     anchored while the content scales down to fit the viewport height.
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            width: '100vw',
            height: '100dvh',
            overflow: 'hidden',
            opacity: isReady ? 1 : 0,
            transition: 'opacity 0.15s ease'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef,
            style: {
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
                // Both dimensions are 100% / scale of the outer clip wrapper (100vw × 100dvh),
                // so after scale(n) they resolve to exactly 100vw × 100dvh.
                // display:flex + flexDirection:column lets children use flex-1 / shrink-0
                // against a definite height, keeping the buy-button footer anchored at the
                // visual bottom without any special positioning.
                width: `${100 / scale}%`,
                height: `${100 / scale}%`,
                display: 'flex',
                flexDirection: 'column'
            },
            children: children
        }, void 0, false, {
            fileName: "[project]/components/custom/ViewportScaler.tsx",
            lineNumber: 110,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/custom/ViewportScaler.tsx",
        lineNumber: 101,
        columnNumber: 5
    }, this);
}
_s(ViewportScaler, "dRZbggHVo9MRkWb59QD1hYUCXD0=");
_c = ViewportScaler;
var _c;
__turbopack_context__.k.register(_c, "ViewportScaler");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/custom/deriv-ws-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DerivWSProvider",
    ()=>DerivWSProvider,
    "useDerivWSContext",
    ()=>useDerivWSContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useDerivWS$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/react/useDerivWS.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/use-auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$balance$2d$sync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/use-balance-sync.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const DerivWSContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function DerivWSProvider({ children }) {
    _s();
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { ws, isConnected, isExhausted } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useDerivWS$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDerivWS"])({
        url: auth.wsUrl,
        accountId: auth.activeAccountId ?? undefined
    });
    // Gate on wsUrl, not activeAccountId alone. An account is selected well before
    // its socket is authorized — it is restored from storage at mount and set by
    // completeAuth before the OTP URL resolves — and `balance` on the public
    // socket earns AuthorizationRequired, which the app's blanket WS-error toast
    // showed the user as "Please log in." right after a successful login
    // (deriv-com/deriv-api-v2#587). Matches the `isAuthenticated: !!auth.wsUrl`
    // gate every other authenticated consumer already uses.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$balance$2d$sync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBalanceSync"])(ws, isConnected, auth.wsUrl ? auth.activeAccountId : null, auth.updateAccountBalance);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DerivWSContext.Provider, {
        value: {
            ws,
            isConnected,
            isExhausted,
            auth
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/custom/deriv-ws-provider.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
_s(DerivWSProvider, "3bO7GM0X2YhXA9QOH7V1WafFJnU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useDerivWS$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDerivWS"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$balance$2d$sync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBalanceSync"]
    ];
});
_c = DerivWSProvider;
function useDerivWSContext() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(DerivWSContext);
    if (!ctx) {
        throw new Error('useDerivWSContext must be used within a DerivWSProvider');
    }
    return ctx;
}
_s1(useDerivWSContext, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "DerivWSProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/custom/env-check.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EnvCheck",
    ()=>EnvCheck
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/custom/i18n-provider.tsx [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function EnvCheck() {
    _s();
    const { localize } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppTranslations"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EnvCheck.useEffect": ()=>{
            if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_PREVIEW_MODE === 'true') return;
            if (window.location.pathname.includes('/preview') || window.location.pathname.includes('/edit')) return;
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_APP_ID || !__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_REDIRECT_URI) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].warning(localize('Waiting for environment variables to be set…'));
            }
        }
    }["EnvCheck.useEffect"], [
        localize
    ]);
    return null;
}
_s(EnvCheck, "qkeZzNSoBXaNnXN1Qmx9BnG5Jh4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppTranslations"]
    ];
});
_c = EnvCheck;
var _c;
__turbopack_context__.k.register(_c, "EnvCheck");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/custom/i18n-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppI18nProvider",
    ()=>AppI18nProvider,
    "useAppTranslations",
    ()=>useAppTranslations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$I18nextProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-i18next/dist/es/I18nextProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/i18n.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const AppI18nContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function AppI18nProvider({ catalogs, children }) {
    _s();
    const [instance] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "AppI18nProvider.useState": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createSeededI18n"])(catalogs)
    }["AppI18nProvider.useState"]);
    const [currentLang, setCurrentLang] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('EN');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppI18nProvider.useEffect": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncDocumentLang"])('EN');
            // Drop sticky unsupported codes the library may have written under
            // `i18n_language` (e.g. DE from `?lang=de`) before we apply our preference.
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scrubLibraryLanguageKey"])();
            const stored = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readStoredLanguage"])();
            if (stored === 'EN') {
                return;
            }
            void instance.changeLanguage(stored).then({
                "AppI18nProvider.useEffect": ()=>{
                    setCurrentLang(stored);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncDocumentLang"])(stored);
                }
            }["AppI18nProvider.useEffect"]);
        }
    }["AppI18nProvider.useEffect"], [
        instance
    ]);
    const switchLanguage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AppI18nProvider.useCallback[switchLanguage]": (lang)=>{
            void instance.changeLanguage(lang).then({
                "AppI18nProvider.useCallback[switchLanguage]": ()=>{
                    setCurrentLang(lang);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persistLanguage"])(lang);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncDocumentLang"])(lang);
                }
            }["AppI18nProvider.useCallback[switchLanguage]"]);
        }
    }["AppI18nProvider.useCallback[switchLanguage]"], [
        instance
    ]);
    const localize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AppI18nProvider.useCallback[localize]": (text, values = {})=>{
            // Keep callback identity aligned with the active catalog for consumers
            // that memoize translated labels on `localize`.
            void currentLang;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["localizeWithInstance"])(instance, text, values);
        }
    }["AppI18nProvider.useCallback[localize]"], [
        instance,
        currentLang
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AppI18nProvider.useMemo[value]": ()=>({
                currentLang,
                switchLanguage,
                localize,
                instance
            })
    }["AppI18nProvider.useMemo[value]"], [
        currentLang,
        switchLanguage,
        localize,
        instance
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$I18nextProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["I18nextProvider"], {
        i18n: instance,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AppI18nContext.Provider, {
            value: value,
            children: children
        }, void 0, false, {
            fileName: "[project]/components/custom/i18n-provider.tsx",
            lineNumber: 95,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/custom/i18n-provider.tsx",
        lineNumber: 94,
        columnNumber: 5
    }, this);
}
_s(AppI18nProvider, "OfTj9tCJ/V/ihROrrz0Xb0jWIZc=");
_c = AppI18nProvider;
function useAppTranslations() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AppI18nContext);
    if (!context) {
        throw new Error('useAppTranslations must be used within AppI18nProvider');
    }
    return context;
}
_s1(useAppTranslations, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AppI18nProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/custom/logo-src-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LogoSrcProvider",
    ()=>LogoSrcProvider,
    "useLogoSrc",
    ()=>useLogoSrc
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const LogoSrcContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function LogoSrcProvider({ logoSrc, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LogoSrcContext.Provider, {
        value: logoSrc,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/custom/logo-src-provider.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_c = LogoSrcProvider;
function useLogoSrc() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LogoSrcContext) ?? undefined;
}
_s(useLogoSrc, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
var _c;
__turbopack_context__.k.register(_c, "LogoSrcProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/custom/providers.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.module.js [app-client] (ecmascript)");
'use client';
;
;
function Providers({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        attribute: "class",
        defaultTheme: "system",
        enableSystem: true,
        disableTransitionOnChange: true,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/custom/providers.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = Providers;
var _c;
__turbopack_context__.k.register(_c, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/sonner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const Toaster = ({ ...props })=>{
    _s();
    const { theme = "system" } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toaster"], {
        theme: theme,
        className: "toaster group",
        toastOptions: {
            classNames: {
                toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                description: "group-[.toast]:text-muted-foreground",
                actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
            }
        },
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/sonner.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Toaster, "EriOrahfenYKDCErPq+L6926Dw4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = Toaster;
;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/use-auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prefetchAuthReferral",
    ()=>prefetchAuthReferral,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/oauth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$accounts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/accounts.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$referral$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/referral.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/custom/i18n-provider.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/i18n.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function getAuthConfig(lang) {
    const config = {
        clientId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_APP_ID ?? '',
        redirectUri: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? (("TURBOPACK compile-time truthy", 1) ? window.location.origin : "TURBOPACK unreachable")
    };
    // Prefer the live UI language; fall back to the namespaced storage key so
    // login/sign-up still forward `lang` if called outside the provider tree.
    const resolvedLang = lang ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readStoredLanguage"])();
    if (resolvedLang) {
        config.lang = resolvedLang;
    }
    // Convert comma-separated scopes to space-separated (OAuth spec)
    const scopesEnv = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_OAUTH_SCOPES ?? '';
    if (scopesEnv) {
        config.scopes = scopesEnv.split(',').map((s)=>s.trim()).join(' ');
    }
    const referralLink = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ?? '';
    if (referralLink) {
        const referral = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$referral$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseReferralLink"])(referralLink);
        if (referral) {
            config.affiliateToken = referral.affiliateToken;
            config.affiliateTokenParam = referral.affiliateTokenParam;
            config.utmCampaign = referral.utmCampaign;
            config.utmSource = referral.utmSource;
            config.utmMedium = referral.utmMedium;
        }
    }
    // Override with live per-click params from landing URL (e.g. Scaleo t= token).
    // These are present in window.location.search when the user arrives via an
    // affiliate link and haven't been removed yet (OAuth params aren't in the URL
    // at this point — they only appear after Deriv redirects back with ?code=).
    const landing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$referral$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseLandingParams"])();
    if (landing) {
        // Only override the token when the landing URL actually carries one (t=).
        // parseLandingParams returns a non-null result for any utm_* param, so an
        // unguarded write would clobber a valid env token with '' on generic
        // marketing links (e.g. ?utm_source=google with no t=).
        if (landing.affiliateToken) {
            config.affiliateToken = landing.affiliateToken;
            config.affiliateTokenParam = landing.affiliateTokenParam;
        }
        if (landing.utmSource) config.utmSource = landing.utmSource;
        if (landing.utmMedium) config.utmMedium = landing.utmMedium;
        if (landing.utmCampaign) config.utmCampaign = landing.utmCampaign;
    }
    return config;
}
// Start the Scaleo referral resolution ahead of a login/sign-up activation.
// The login prompt calls this when it opens, so by the time the user taps a
// CTA the lookup has settled and the click path goes straight to the PKCE
// build and navigation — the same synchronous shape as Trader's
// redirectToLogin, whose crypto-only double-tap window Trader accepts with no
// guard. Consumed (cleared) on use, so a login with no fresh prefetch — the
// header buttons — resolves its own exactly as before.
let pendingReferral = null;
function prefetchAuthReferral() {
    const referralLink = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ?? '';
    if (!referralLink) return;
    pendingReferral = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$referral$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveReferralViaProxy"])(referralLink);
}
// Build the auth config and, if we don't already have an affiliate token (from
// a resolved/Format-3 referral link or live landing params), try to resolve a
// fresh per-user token via the app-builder BFF proxy. Strictly non-blocking:
// any failure leaves the config untouched so login/sign-up always proceeds.
async function getAuthConfigWithReferral(lang) {
    const config = getAuthConfig(lang);
    if (!config.affiliateToken) {
        try {
            const referralLink = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ?? '';
            const pending = pendingReferral ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$referral$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveReferralViaProxy"])(referralLink);
            pendingReferral = null;
            const resolved = await pending;
            if (resolved) {
                config.affiliateToken = resolved.affiliateToken;
                config.affiliateTokenParam = resolved.affiliateTokenParam;
                if (resolved.utmSource) config.utmSource = resolved.utmSource;
                if (resolved.utmMedium) config.utmMedium = resolved.utmMedium;
                if (resolved.utmCampaign) config.utmCampaign = resolved.utmCampaign;
            }
        } catch  {
        // Never block login on attribution resolution.
        }
    }
    return config;
}
function useAuth() {
    _s();
    const { currentLang } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppTranslations"])();
    const [authState, setAuthState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useAuth.useState": ()=>("TURBOPACK compile-time value", "object") !== 'undefined' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthInfo"])() ? 'authenticated' : 'unauthenticated'
    }["useAuth.useState"]);
    const [accounts, setAccounts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useAuth.useState": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDerivAccounts"])() ?? [];
        }
    }["useAuth.useState"]);
    const [activeAccountId, setActiveAccountId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useAuth.useState": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveLoginId"])() ?? null;
        }
    }["useAuth.useState"]);
    const [wsUrl, setWsUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(undefined);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const initRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const activeAccountIdRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tabHiddenAtRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Fetch OTP WebSocket URL for an account
    const fetchOTPUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[fetchOTPUrl]": async (accountId, authInfo)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$accounts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getWebSocketOTP"])(accountId, authInfo, getAuthConfig().clientId);
        }
    }["useAuth.useCallback[fetchOTPUrl]"], []);
    // Complete auth: fetch accounts → get OTP → set WS URL
    const completeAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[completeAuth]": async (authInfo, preferredAccountId)=>{
            const fetchedAccounts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$accounts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchAccounts"])(authInfo, getAuthConfig().clientId);
            setAccounts(fetchedAccounts);
            if (fetchedAccounts.length > 0) {
                const selectedAccount = fetchedAccounts.find({
                    "useAuth.useCallback[completeAuth]": (account)=>account.account_id === preferredAccountId
                }["useAuth.useCallback[completeAuth]"]) ?? fetchedAccounts[0];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveLoginId"])(selectedAccount.account_id);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAccountType"])(selectedAccount.account_type);
                setActiveAccountId(selectedAccount.account_id);
                const otpUrl = await fetchOTPUrl(selectedAccount.account_id, authInfo);
                setWsUrl(otpUrl);
            }
            setAuthState('authenticated');
        }
    }["useAuth.useCallback[completeAuth]"], [
        fetchOTPUrl
    ]);
    // Fall back to the cached account snapshot when the fresh fetch fails (e.g.
    // transient network error) instead of forcing a logout. The balance stream
    // reconciles any staleness as soon as the socket connects.
    const restoreCachedSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[restoreCachedSession]": async (authInfo)=>{
            const cachedAccounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDerivAccounts"])();
            const loginId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveLoginId"])() ?? cachedAccounts?.[0]?.account_id;
            if (!cachedAccounts || cachedAccounts.length === 0 || !loginId) return false;
            // Mirror completeAuth: keep the persisted selection in sync as well.
            const selectedAccount = cachedAccounts.find({
                "useAuth.useCallback[restoreCachedSession].selectedAccount": (a)=>a.account_id === loginId
            }["useAuth.useCallback[restoreCachedSession].selectedAccount"]);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveLoginId"])(loginId);
            if (selectedAccount) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAccountType"])(selectedAccount.account_type);
            setAccounts(cachedAccounts);
            setActiveAccountId(loginId);
            try {
                const otpUrl = await fetchOTPUrl(loginId, authInfo);
                setWsUrl(otpUrl);
                setAuthState('authenticated');
                return true;
            } catch  {
                return false;
            }
        }
    }["useAuth.useCallback[restoreCachedSession]"], [
        fetchOTPUrl
    ]);
    // Initialize: check for OAuth callback or existing session
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuth.useEffect": ()=>{
            if (initRef.current) return;
            initRef.current = true;
            const init = {
                "useAuth.useEffect.init": async ()=>{
                    const url = new URL(window.location.href);
                    const code = url.searchParams.get('code');
                    // Phase 3-5: Handle OAuth callback
                    if (code) {
                        setAuthState('authenticating');
                        try {
                            const authInfo = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["handleOAuthCallback"])(window.location.href, getAuthConfig());
                            await completeAuth(authInfo);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Authentication failed');
                            setAuthState('error');
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
                        }
                        return;
                    }
                    // Check for existing session
                    const storedAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthInfo"])();
                    if (storedAuth) {
                        // Check if token is expired
                        if (storedAuth.expires_at && Date.now() / 1000 > storedAuth.expires_at) {
                            let refreshed;
                            try {
                                refreshed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["refreshAccessToken"])(storedAuth.refresh_token, getAuthConfig().clientId);
                            } catch  {
                                // Refresh failed (token revoked/expired) — fall back to
                                // unauthenticated (public WS)
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
                                setAuthState('unauthenticated');
                                return;
                            }
                            try {
                                await completeAuth(refreshed, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveLoginId"])());
                            } catch  {
                                // Same resilience as the valid-session path: a transient fetch
                                // failure after a successful refresh keeps the session alive on
                                // the cached snapshot instead of forcing a logout.
                                if (!await restoreCachedSession(refreshed)) {
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
                                    setAuthState('unauthenticated');
                                }
                            }
                            return;
                        }
                        // Always refresh the account snapshot. The cached account list is only
                        // an initial render fallback and may contain a stale balance.
                        try {
                            await completeAuth(storedAuth, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getActiveLoginId"])());
                        } catch  {
                            // Fresh fetch failed (e.g. transient network error) — keep the
                            // session alive on the cached snapshot rather than logging out.
                            if (!await restoreCachedSession(storedAuth)) {
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
                                setAuthState('unauthenticated');
                            }
                        }
                    }
                }
            }["useAuth.useEffect.init"];
            init();
        }
    }["useAuth.useEffect"], [
        completeAuth,
        fetchOTPUrl,
        restoreCachedSession
    ]);
    // Keep ref in sync so visibility handler always has the current account ID
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuth.useEffect": ()=>{
            activeAccountIdRef.current = activeAccountId;
        }
    }["useAuth.useEffect"], [
        activeAccountId
    ]);
    // Refresh the OTP WebSocket URL when returning to the tab after >30s of inactivity.
    // OTP URLs are single-use, so a stale URL will cause reconnect failures.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuth.useEffect": ()=>{
            if (authState !== 'authenticated') return;
            const handleVisibilityChange = {
                "useAuth.useEffect.handleVisibilityChange": async ()=>{
                    if (document.visibilityState === 'hidden') {
                        tabHiddenAtRef.current = Date.now();
                        return;
                    }
                    const hiddenAt = tabHiddenAtRef.current;
                    if (!hiddenAt || Date.now() - hiddenAt < 30_000) return;
                    tabHiddenAtRef.current = null;
                    const accountId = activeAccountIdRef.current;
                    const authInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthInfo"])();
                    if (!authInfo || !accountId) return;
                    try {
                        const otpUrl = await fetchOTPUrl(accountId, authInfo);
                        setWsUrl(otpUrl);
                    } catch  {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
                        setAuthState('unauthenticated');
                        setWsUrl(undefined);
                    }
                }
            }["useAuth.useEffect.handleVisibilityChange"];
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return ({
                "useAuth.useEffect": ()=>document.removeEventListener('visibilitychange', handleVisibilityChange)
            })["useAuth.useEffect"];
        }
    }["useAuth.useEffect"], [
        authState,
        fetchOTPUrl
    ]);
    // Phase 1: Initiate login — includes partner attribution params, resolving a
    // fresh per-user Scaleo token via the BFF proxy when needed (non-blocking).
    // Forwards `lang` so Deriv's home app continues in the selected language (#559).
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[login]": async ()=>{
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initiateLogin"])(await getAuthConfigWithReferral(currentLang));
        }
    }["useAuth.useCallback[login]"], [
        currentLang
    ]);
    // Initiate sign-up — adds prompt=registration and partner attribution params
    const signUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[signUp]": async ()=>{
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initiateSignUp"])(await getAuthConfigWithReferral(currentLang));
        }
    }["useAuth.useCallback[signUp]"], [
        currentLang
    ]);
    // Logout: close WS (handled by useDerivWS cleanup), clear storage, reset state
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[logout]": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$accounts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logout"])();
            setAccounts([]);
            setActiveAccountId(null);
            setWsUrl(undefined);
            setAuthState('unauthenticated');
            setError(null);
        }
    }["useAuth.useCallback[logout]"], []);
    // Account switch: fetch new OTP first, then update accountId and wsUrl together
    // so reconnectKey and url change in the same render cycle with the correct OTP.
    const switchAccount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[switchAccount]": async (accountId)=>{
            const authInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthInfo"])();
            if (!authInfo) return;
            try {
                const account = accounts.find({
                    "useAuth.useCallback[switchAccount].account": (a)=>a.account_id === accountId
                }["useAuth.useCallback[switchAccount].account"]);
                if (account) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAccountType"])(account.account_type);
                // Fetch OTP before updating accountId so reconnectKey and url are consistent
                const otpUrl = await fetchOTPUrl(accountId, authInfo);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveLoginId"])(accountId);
                setActiveAccountId(accountId);
                setWsUrl(otpUrl);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Account switch failed');
            }
        }
    }["useAuth.useCallback[switchAccount]"], [
        fetchOTPUrl,
        accounts
    ]);
    // Keep the account snapshot and its persisted fallback synchronized with
    // authenticated balance stream updates.
    const updateAccountBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useAuth.useCallback[updateAccountBalance]": (accountId, balance, currency)=>{
            setAccounts({
                "useAuth.useCallback[updateAccountBalance]": (currentAccounts)=>{
                    let changed = false;
                    const updatedAccounts = currentAccounts.map({
                        "useAuth.useCallback[updateAccountBalance].updatedAccounts": (account)=>{
                            if (account.account_id !== accountId) return account;
                            const updatedCurrency = currency ?? account.currency;
                            if (account.balance === balance && account.currency === updatedCurrency) {
                                return account;
                            }
                            changed = true;
                            return {
                                ...account,
                                balance,
                                currency: updatedCurrency
                            };
                        }
                    }["useAuth.useCallback[updateAccountBalance].updatedAccounts"]);
                    if (!changed) return currentAccounts;
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeDerivAccounts"])(updatedAccounts);
                    return updatedAccounts;
                }
            }["useAuth.useCallback[updateAccountBalance]"]);
        }
    }["useAuth.useCallback[updateAccountBalance]"], []);
    const activeAccount = accounts.find((acc)=>acc.account_id === activeAccountId) ?? accounts[0] ?? null;
    return {
        authState,
        accounts,
        activeAccount,
        activeAccountId,
        wsUrl,
        login,
        signUp,
        logout,
        switchAccount,
        updateAccountBalance,
        error
    };
}
_s(useAuth, "ykgpxe98oVB8+akFZguXzvXeIKM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppTranslations"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/use-balance-sync.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseBalanceUpdate",
    ()=>parseBalanceUpdate,
    "useBalanceSync",
    ()=>useBalanceSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function normalizeBalance(value) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
}
function parseBalanceUpdate(message) {
    const payload = message.balance;
    const scalarBalance = normalizeBalance(payload);
    if (scalarBalance !== null) return {
        balance: scalarBalance
    };
    if (!isRecord(payload)) return null;
    const balance = normalizeBalance(payload.balance);
    if (balance === null) return null;
    const accountId = typeof payload.loginid === 'string' ? payload.loginid : typeof payload.account_id === 'string' ? payload.account_id : undefined;
    const currency = typeof payload.currency === 'string' ? payload.currency : undefined;
    return {
        accountId,
        balance,
        currency
    };
}
function useBalanceSync(ws, isConnected, activeAccountId, onBalanceUpdate) {
    _s();
    // Keep the callback in a ref so an inline (unmemoized) callback at the call
    // site does not tear down and recreate the subscription on every render.
    const onBalanceUpdateRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onBalanceUpdate);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBalanceSync.useEffect": ()=>{
            onBalanceUpdateRef.current = onBalanceUpdate;
        }
    }["useBalanceSync.useEffect"], [
        onBalanceUpdate
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBalanceSync.useEffect": ()=>{
            if (!ws || !isConnected || !activeAccountId) return;
            let disposed = false;
            let unsubscribe = {
                "useBalanceSync.useEffect.unsubscribe": ()=>{}
            }["useBalanceSync.useEffect.unsubscribe"];
            // The OTP-authorized socket is scoped to a single account — the options
            // gateway balance schema has no `account: 'all'` parameter, so the stream
            // covers the active account only and resubscribes on account switch.
            ws.subscribe({
                balance: 1
            }, {
                "useBalanceSync.useEffect": (message)=>{
                    const update = parseBalanceUpdate(message);
                    if (!update) return;
                    onBalanceUpdateRef.current(update.accountId ?? activeAccountId, update.balance, update.currency);
                }
            }["useBalanceSync.useEffect"]).then({
                "useBalanceSync.useEffect": (subscription)=>{
                    if (disposed) {
                        subscription.unsubscribe();
                        return;
                    }
                    unsubscribe = subscription.unsubscribe;
                }
            }["useBalanceSync.useEffect"]).catch({
                "useBalanceSync.useEffect": ()=>{
                // The account snapshot fetched during authentication remains available
                // if balance streaming is temporarily unavailable.
                }
            }["useBalanceSync.useEffect"]);
            return ({
                "useBalanceSync.useEffect": ()=>{
                    disposed = true;
                    unsubscribe();
                }
            })["useBalanceSync.useEffect"];
        }
    }["useBalanceSync.useEffect"], [
        ws,
        isConnected,
        activeAccountId
    ]);
}
_s(useBalanceSync, "OYnU8FwPx1S7ezvaVog5Mhxz2Do=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/i18n.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DATE_FNS_LOCALES",
    ()=>DATE_FNS_LOCALES,
    "LANGUAGE_LABELS",
    ()=>LANGUAGE_LABELS,
    "LANGUAGE_LOCALES",
    ()=>LANGUAGE_LOCALES,
    "LANGUAGE_STORAGE_KEY",
    ()=>LANGUAGE_STORAGE_KEY,
    "LIBRARY_LANGUAGE_STORAGE_KEY",
    ()=>LIBRARY_LANGUAGE_STORAGE_KEY,
    "SUPPORTED_LANGUAGES",
    ()=>SUPPORTED_LANGUAGES,
    "createSeededI18n",
    ()=>createSeededI18n,
    "hashTranslationKey",
    ()=>hashTranslationKey,
    "localizeWithInstance",
    ()=>localizeWithInstance,
    "persistLanguage",
    ()=>persistLanguage,
    "readStoredLanguage",
    ()=>readStoredLanguage,
    "resolveSupportedLanguage",
    ()=>resolveSupportedLanguage,
    "scrubLibraryLanguageKey",
    ()=>scrubLibraryLanguageKey,
    "syncDocumentLang",
    ()=>syncDocumentLang
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$crc$2d$32$2f$crc32$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/crc-32/crc32.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$en$2d$US$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/locale/en-US.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$es$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/locale/es.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$fr$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/locale/fr.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$pt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/locale/pt.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$i18next$2f$dist$2f$esm$2f$i18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/i18next/dist/esm/i18next.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$initReactI18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-i18next/dist/es/initReactI18next.js [app-client] (ecmascript)");
;
;
;
;
const SUPPORTED_LANGUAGES = [
    'EN',
    'ES',
    'FR',
    'PT'
];
const LANGUAGE_STORAGE_KEY = 'deriv_template_i18n_language';
const LIBRARY_LANGUAGE_STORAGE_KEY = 'i18n_language';
const LANGUAGE_LABELS = {
    EN: 'English',
    ES: 'Español',
    FR: 'Français',
    PT: 'Português'
};
const LANGUAGE_LOCALES = {
    EN: 'en',
    ES: 'es',
    FR: 'fr',
    PT: 'pt'
};
const DATE_FNS_LOCALES = {
    EN: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$en$2d$US$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enUS"],
    ES: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$es$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["es"],
    FR: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$fr$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fr"],
    PT: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$pt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pt"]
};
const HASH_OPTIONS = {
    hashTransKey (value) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$crc$2d$32$2f$crc32$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].str(value).toString();
    },
    useSuspense: false
};
function isSupportedLanguage(value) {
    return SUPPORTED_LANGUAGES.includes(value);
}
function normalizeLangToken(raw) {
    return raw.trim().replace(/^"+|"+$/g, '').toUpperCase();
}
function parseStorageToken(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') return parsed;
    } catch  {
    // fall through — value may be a bare code
    }
    return raw;
}
function resolveSupportedLanguage(raw) {
    if (!raw) return 'EN';
    const normalized = normalizeLangToken(raw);
    return isSupportedLanguage(normalized) ? normalized : 'EN';
}
function scrubLibraryLanguageKey() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const legacy = window.localStorage.getItem(LIBRARY_LANGUAGE_STORAGE_KEY);
        if (legacy == null) return;
        const token = normalizeLangToken(parseStorageToken(legacy));
        const hasTemplatePreference = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) != null;
        if (!isSupportedLanguage(token) || hasTemplatePreference) {
            window.localStorage.removeItem(LIBRARY_LANGUAGE_STORAGE_KEY);
        }
    } catch  {
        window.localStorage.removeItem(LIBRARY_LANGUAGE_STORAGE_KEY);
    }
}
function readStoredLanguage() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('lang');
        if (fromQuery) {
            return resolveSupportedLanguage(fromQuery);
        }
    } catch  {
    // ignore malformed search params
    }
    try {
        const owned = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (owned != null) {
            scrubLibraryLanguageKey();
            return resolveSupportedLanguage(parseStorageToken(owned));
        }
        const legacy = window.localStorage.getItem(LIBRARY_LANGUAGE_STORAGE_KEY);
        if (legacy == null) return 'EN';
        const legacyToken = normalizeLangToken(parseStorageToken(legacy));
        if (isSupportedLanguage(legacyToken)) {
            // One-time migrate off the shared library key so Bot/Trader cannot
            // clobber or leak the template preference (html lang).
            persistLanguage(legacyToken);
            return legacyToken;
        }
        // Unsupported sticky value from the library — drop it so later Bot/Trader
        // `initializeI18n` calls do not OTA-fetch `/translations/<code>.json`.
        window.localStorage.removeItem(LIBRARY_LANGUAGE_STORAGE_KEY);
        return 'EN';
    } catch  {
        return 'EN';
    }
}
function persistLanguage(lang) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(lang));
    // Never mirror into the library key — Bot/Trader and the package own it.
    window.localStorage.removeItem(LIBRARY_LANGUAGE_STORAGE_KEY);
}
function syncDocumentLang(lang) {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = LANGUAGE_LOCALES[lang];
}
function resourcesFromCatalogs(catalogs) {
    return {
        EN: {
            translation: catalogs.EN
        },
        ES: {
            translation: catalogs.ES
        },
        FR: {
            translation: catalogs.FR
        },
        PT: {
            translation: catalogs.PT
        }
    };
}
function createSeededI18n(catalogs) {
    const instance = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$i18next$2f$dist$2f$esm$2f$i18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createInstance();
    void instance.use(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$initReactI18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initReactI18next"]).init({
        lng: 'EN',
        fallbackLng: 'EN',
        resources: resourcesFromCatalogs(catalogs),
        interpolation: {
            escapeValue: false
        },
        react: HASH_OPTIONS
    });
    return instance;
}
function hashTranslationKey(text) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$crc$2d$32$2f$crc32$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].str(text).toString();
}
function localizeWithInstance(instance, text, values = {}) {
    if (!text) return '';
    return instance.t(hashTranslationKey(text), {
        defaultValue: text,
        ...values
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/i18n/en.json.[json].cjs [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "334568355": "Off",
    "363990763": "Sell price:",
    "390647540": "Real account",
    "509620861": "No positions",
    "584028307": "Allow equals",
    "613877038": "Chart",
    "637875646": "Selling...",
    "720293140": "Log out",
    "753727511": "Type",
    "766317539": "Language",
    "773091074": "Stake:",
    "793344317": "P&L",
    "832763093": "Current Value",
    "882345928": "Buy button",
    "905134118": "Payout:",
    "969871230": "Unexpected error occurred. Please try again.",
    "1001160515": "Sell",
    "1032173180": "Deriv",
    "1049384824": "Rise",
    "1132259710": "Powered by",
    "1146094010": "Fall (Equal)",
    "1208729868": "Ticks",
    "1257876852": "Purchasing...",
    "1272337240": "Days",
    "1272681097": "Hours",
    "1357812313": "Rise ↑",
    "1387503299": "Log in",
    "1391174838": "Potential payout:",
    "1475540081": "Waiting for environment variables to be set…",
    "1533177906": "Fall",
    "1583500750": "Select a symbol",
    "1626487281": "Sell failed",
    "1670426231": "End Time",
    "1734229191": "Sell Failed",
    "1782703044": "Sign up",
    "1876325183": "Minutes",
    "1900909177": "Buy price: {{buy_price}} USD | Payout: {{payout}} USD | Balance: {{balance}} USD",
    "2035258293": "Start trading with us",
    "2133451414": "Duration",
    "-1014795598": "Report",
    "-1016724027": "App Logo",
    "-1043541097": "Your preferences",
    "-1152511291": "Dark",
    "-1214406999": "Connection Error",
    "-1256020695": "Rise / Fall",
    "-1272702829": "Payout {{payout}} USD",
    "-1342699195": "Total profit/loss:",
    "-1358367903": "Stake",
    "-137444201": "Buy",
    "-138538812": "Log in or create a free account to place a trade.",
    "-1428458509": "Light",
    "-1500971707": "Sell Price",
    "-1555699982": "GMT",
    "-1596567146": "AM",
    "-1674441366": "On",
    "-1675848843": "Error",
    "-1694314813": "Contract value:",
    "-1713944846": "Select date & time",
    "-1812408271": "View your positions →",
    "-1927581288": "A space that feels like you.",
    "-1953801662": "Rise (Equal)",
    "-1972481796": "Fall ↓",
    "-2036388794": "Create free account",
    "-2071137005": "Toggle theme",
    "-217091450": "PM",
    "-257698357": "All ({{count}})",
    "-292288201": "Logging in...",
    "-345754673": "Symbol",
    "-422437364": "Chart + symbol",
    "-437354176": "Appearance",
    "-453343266": "Not editable",
    "-529846150": "Seconds",
    "-590018519": "Contract Purchased",
    "-592021712": "Value",
    "-631344814": "{{label}} · not editable",
    "-673424733": "Demo account",
    "-751402988": "Symbol picker",
    "-784179732": "Closed ({{count}})",
    "-793953720": "Purchase Failed",
    "-804701045": "Open ({{count}})",
    "-811190405": "Time",
    "-824109891": "System",
    "-839094775": "Back"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/i18n/es.json.[json].cjs [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "334568355": "Desactivado",
    "363990763": "Precio de venta:",
    "390647540": "Cuenta real",
    "509620861": "Sin posiciones",
    "584028307": "Permitir iguales",
    "613877038": "Gráfico",
    "637875646": "Vendiendo...",
    "720293140": "Cerrar sesión",
    "753727511": "Tipo",
    "766317539": "Idioma",
    "773091074": "Apuesta:",
    "793344317": "P&L",
    "832763093": "Valor actual",
    "882345928": "Botón de compra",
    "905134118": "Pago:",
    "969871230": "Ocurrió un error inesperado. Por favor, inténtelo de nuevo.",
    "1001160515": "Vender",
    "1032173180": "Deriv",
    "1049384824": "Rise",
    "1132259710": "Desarrollado por",
    "1146094010": "Fall (Equal)",
    "1208729868": "Ticks",
    "1257876852": "Comprando...",
    "1272337240": "Días",
    "1272681097": "Horas",
    "1357812313": "Rise ↑",
    "1387503299": "Iniciar sesión",
    "1391174838": "Pago potencial:",
    "1475540081": "Esperando que se establezcan las variables de entorno…",
    "1533177906": "Fall",
    "1583500750": "Seleccione un símbolo",
    "1626487281": "Venta fallida",
    "1670426231": "Hora de finalización",
    "1734229191": "Venta Fallida",
    "1782703044": "Regístrese",
    "1876325183": "Minutos",
    "1900909177": "Precio de compra: {{buy_price}} USD | Pago: {{payout}} USD | Saldo: {{balance}} USD",
    "2035258293": "Empiece a hacer trading con nosotros",
    "2133451414": "Duración",
    "-1014795598": "Informe",
    "-1016724027": "Logotipo de la aplicación",
    "-1043541097": "Sus preferencias",
    "-1152511291": "Oscuro",
    "-1214406999": "Error de conexión",
    "-1256020695": "Rise / Fall",
    "-1272702829": "Pago {{payout}} USD",
    "-1342699195": "Ganancia/pérdida total:",
    "-1358367903": "Inversión",
    "-137444201": "Comprar",
    "-138538812": "Inicie sesión o cree una cuenta gratuita para realizar una operación.",
    "-1428458509": "Claro",
    "-1500971707": "Precio de venta",
    "-1555699982": "GMT",
    "-1596567146": "AM",
    "-1674441366": "Activado",
    "-1675848843": "Error",
    "-1694314813": "Valor del contrato:",
    "-1713944846": "Seleccionar fecha y hora",
    "-1812408271": "Ver sus posiciones →",
    "-1927581288": "Un espacio que refleja quién es usted.",
    "-1953801662": "Rise (Equal)",
    "-1972481796": "Fall ↓",
    "-2036388794": "Crear cuenta gratuita",
    "-2071137005": "Cambiar tema",
    "-217091450": "PM",
    "-257698357": "Todos ({{count}})",
    "-292288201": "Iniciando sesión...",
    "-345754673": "Símbolo",
    "-422437364": "Gráfico + símbolo",
    "-437354176": "Apariencia",
    "-453343266": "No editable",
    "-529846150": "Segundos",
    "-590018519": "Contrato comprado",
    "-592021712": "Valor",
    "-631344814": "{{label}} · no editable",
    "-673424733": "Cuenta de demostración",
    "-751402988": "Selector de símbolo",
    "-784179732": "Cerrado ({{count}})",
    "-793953720": "Compra fallida",
    "-804701045": "Abierto ({{count}})",
    "-811190405": "Tiempo",
    "-824109891": "Sistema",
    "-839094775": "Atrás"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/i18n/fr.json.[json].cjs [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "334568355": "Désactivé",
    "363990763": "Prix de vente :",
    "390647540": "Compte réel",
    "509620861": "Aucune position",
    "584028307": "Autoriser l'égalité",
    "613877038": "Graphique",
    "637875646": "Vente en cours...",
    "720293140": "Déconnexion",
    "753727511": "Type",
    "766317539": "Langue",
    "773091074": "Mise :",
    "793344317": "P&L",
    "832763093": "Valeur actuelle",
    "882345928": "Bouton Acheter",
    "905134118": "Paiement :",
    "969871230": "Une erreur inattendue s'est produite. Veuillez réessayer.",
    "1001160515": "Vendre",
    "1032173180": "Deriv",
    "1049384824": "Rise",
    "1132259710": "Propulsé par",
    "1146094010": "Fall (Equal)",
    "1208729868": "Ticks",
    "1257876852": "Achat en cours...",
    "1272337240": "Jours",
    "1272681097": "Heures",
    "1357812313": "Rise ↑",
    "1387503299": "Connexion",
    "1391174838": "Paiement potentiel :",
    "1475540081": "En attente de la définition des variables d'environnement…",
    "1533177906": "Fall",
    "1583500750": "Sélectionner un symbole",
    "1626487281": "Échec de la vente",
    "1670426231": "Heure de fin",
    "1734229191": "Échec de la vente",
    "1782703044": "Inscription",
    "1876325183": "Minutes",
    "1900909177": "Prix d'achat : {{buy_price}} USD | Paiement : {{payout}} USD | Solde : {{balance}} USD",
    "2035258293": "Commencez à trader avec nous",
    "2133451414": "Durée",
    "-1014795598": "Rapport",
    "-1016724027": "Logo de l'application",
    "-1043541097": "Vos préférences",
    "-1152511291": "Sombre",
    "-1214406999": "Erreur de connexion",
    "-1256020695": "Rise / Fall",
    "-1272702829": "Paiement {{payout}} USD",
    "-1342699195": "Profit/perte total(e) :",
    "-1358367903": "Mise",
    "-137444201": "Acheter",
    "-138538812": "Connectez-vous ou créez un compte gratuit pour passer un ordre.",
    "-1428458509": "Clair",
    "-1500971707": "Prix de vente",
    "-1555699982": "GMT",
    "-1596567146": "AM",
    "-1674441366": "Activé",
    "-1675848843": "Erreur",
    "-1694314813": "Valeur du contrat :",
    "-1713944846": "Sélectionner la date et l'heure",
    "-1812408271": "Voir vos positions →",
    "-1927581288": "Un espace qui vous ressemble.",
    "-1953801662": "Rise (Equal)",
    "-1972481796": "Fall ↓",
    "-2036388794": "Créer un compte gratuit",
    "-2071137005": "Basculer le thème",
    "-217091450": "PM",
    "-257698357": "Tous ({{count}})",
    "-292288201": "Connexion en cours...",
    "-345754673": "Symbol",
    "-422437364": "Graphique + symbol",
    "-437354176": "Apparence",
    "-453343266": "Non modifiable",
    "-529846150": "Secondes",
    "-590018519": "Contrat acheté",
    "-592021712": "Valeur",
    "-631344814": "{{label}} · non modifiable",
    "-673424733": "Compte de démonstration",
    "-751402988": "Sélecteur de symbol",
    "-784179732": "Fermé ({{count}})",
    "-793953720": "Échec de l'achat",
    "-804701045": "Ouvert ({{count}})",
    "-811190405": "Heure",
    "-824109891": "Système",
    "-839094775": "Retour"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/i18n/provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TemplateI18nProvider",
    ()=>TemplateI18nProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/custom/i18n-provider.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$en$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/i18n/en.json.[json].cjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$es$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/i18n/es.json.[json].cjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$fr$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/i18n/fr.json.[json].cjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$pt$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/i18n/pt.json.[json].cjs [app-client] (ecmascript)");
'use client';
;
;
;
;
;
;
const catalogs = {
    EN: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$en$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
    ES: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$es$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
    FR: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$fr$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
    PT: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$i18n$2f$pt$2e$json$2e5b$json$5d2e$cjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
};
function TemplateI18nProvider({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$i18n$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppI18nProvider"], {
        catalogs: catalogs,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/i18n/provider.tsx",
        lineNumber: 19,
        columnNumber: 10
    }, this);
}
_c = TemplateI18nProvider;
var _c;
__turbopack_context__.k.register(_c, "TemplateI18nProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/i18n/pt.json.[json].cjs [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "334568355": "Desligado",
    "363990763": "Preço de venda:",
    "390647540": "Conta real",
    "509620861": "Sem posições",
    "584028307": "Permitir a igualdade",
    "613877038": "Gráfico",
    "637875646": "A vender...",
    "720293140": "Terminar sessão",
    "753727511": "Tipo",
    "766317539": "Idioma",
    "773091074": "Aposta:",
    "793344317": "P&L",
    "832763093": "Valor Atual",
    "882345928": "Botão de compra",
    "905134118": "Pagamento:",
    "969871230": "Ocorreu um erro inesperado. Por favor, tente novamente.",
    "1001160515": "Vender",
    "1032173180": "Deriv",
    "1049384824": "Rise",
    "1132259710": "Desenvolvido por",
    "1146094010": "Fall (Equal)",
    "1208729868": "Ticks",
    "1257876852": "A comprar...",
    "1272337240": "Dias",
    "1272681097": "Horas",
    "1357812313": "Rise ↑",
    "1387503299": "Iniciar sessão",
    "1391174838": "Pagamento potencial:",
    "1475540081": "À espera que as variáveis de ambiente sejam definidas…",
    "1533177906": "Fall",
    "1583500750": "Selecionar um símbolo",
    "1626487281": "Venda falhada",
    "1670426231": "Hora de Fim",
    "1734229191": "Venda Falhada",
    "1782703044": "Registe-se",
    "1876325183": "Minutos",
    "1900909177": "Preço de compra: {{buy_price}} USD | Pagamento: {{payout}} USD | Saldo: {{balance}} USD",
    "2035258293": "Comece a negociar connosco",
    "2133451414": "Duração",
    "-1014795598": "Relatório",
    "-1016724027": "Logótipo da App",
    "-1043541097": "As suas preferências",
    "-1152511291": "Escuro",
    "-1214406999": "Erro de Ligação",
    "-1256020695": "Rise / Fall",
    "-1272702829": "Pagamento {{payout}} USD",
    "-1342699195": "Lucro/perda total:",
    "-1358367903": "Montante apostado",
    "-137444201": "Comprar",
    "-138538812": "Inicie sessão ou crie uma conta gratuita para realizar uma negociação.",
    "-1428458509": "Claro",
    "-1500971707": "Preço de Venda",
    "-1555699982": "GMT",
    "-1596567146": "AM",
    "-1674441366": "Ativado",
    "-1675848843": "Erro",
    "-1694314813": "Valor do contrato:",
    "-1713944846": "Selecionar data e hora",
    "-1812408271": "Ver as suas posições →",
    "-1927581288": "Um espaço que parece feito para si.",
    "-1953801662": "Rise (Equal)",
    "-1972481796": "Fall ↓",
    "-2036388794": "Criar conta gratuita",
    "-2071137005": "Alternar tema",
    "-217091450": "PM",
    "-257698357": "Todos ({{count}})",
    "-292288201": "A iniciar sessão...",
    "-345754673": "Symbol",
    "-422437364": "Gráfico + symbol",
    "-437354176": "Aparência",
    "-453343266": "Não editável",
    "-529846150": "Segundos",
    "-590018519": "Contrato Adquirido",
    "-592021712": "Valor",
    "-631344814": "{{label}} · não editável",
    "-673424733": "Conta demo",
    "-751402988": "Seletor de symbol",
    "-784179732": "Fechados ({{count}})",
    "-793953720": "Falha na Compra",
    "-804701045": "Abertos ({{count}})",
    "-811190405": "Tempo",
    "-824109891": "Sistema",
    "-839094775": "Voltar"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/auth/accounts.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchAccounts",
    ()=>fetchAccounts,
    "getWebSocketOTP",
    ()=>getWebSocketOTP,
    "logout",
    ()=>logout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/config/urls.ts [app-client] (ecmascript)");
;
;
async function fetchAccounts(authInfo, clientId) {
    const response = await fetch(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApiBaseUrl"])()}/accounts`, {
        headers: {
            Authorization: `Bearer ${authInfo.access_token}`,
            'Deriv-App-ID': clientId
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch accounts (${response.status})`);
    }
    const data = await response.json();
    const accounts = data.data;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeDerivAccounts"])(accounts);
    if (accounts.length > 0) {
        const firstAccount = accounts[0];
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setActiveLoginId"])(firstAccount.account_id);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setAccountType"])(firstAccount.account_type);
    }
    return accounts;
}
async function getWebSocketOTP(accountId, authInfo, clientId) {
    const response = await fetch(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApiBaseUrl"])()}/accounts/${accountId}/otp`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${authInfo.access_token}`,
            'Deriv-App-ID': clientId
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to get WebSocket OTP (${response.status})`);
    }
    const data = await response.json();
    return data.data.url;
}
function logout() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/auth/crypto.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Generate cryptographically secure random bytes and return as base64url string.
 */ __turbopack_context__.s([
    "base64urlEncode",
    ()=>base64urlEncode,
    "generateRandomBase64url",
    ()=>generateRandomBase64url,
    "sha256Base64url",
    ()=>sha256Base64url
]);
function generateRandomBase64url(byteLength = 32) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return base64urlEncode(bytes);
}
function base64urlEncode(bytes) {
    const binary = String.fromCharCode(...bytes);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sha256Base64url(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(hashBuffer));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/auth/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/oauth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$accounts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/accounts.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$referral$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/referral.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$crypto$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/crypto.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/storage.ts [app-client] (ecmascript)");
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/auth/oauth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OAuthError",
    ()=>OAuthError,
    "buildAuthorizationUrl",
    ()=>buildAuthorizationUrl,
    "buildSignUpUrl",
    ()=>buildSignUpUrl,
    "cleanupUrl",
    ()=>cleanupUrl,
    "exchangeCodeForTokens",
    ()=>exchangeCodeForTokens,
    "handleOAuthCallback",
    ()=>handleOAuthCallback,
    "initiateLogin",
    ()=>initiateLogin,
    "initiateSignUp",
    ()=>initiateSignUp,
    "parseCallbackParams",
    ()=>parseCallbackParams,
    "refreshAccessToken",
    ()=>refreshAccessToken,
    "validateCallback",
    ()=>validateCallback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$crypto$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/crypto.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/auth/storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/config/urls.ts [app-client] (ecmascript)");
;
;
;
/**
 * Build the base PKCE URLSearchParams shared by login and sign-up.
 * Stores a fresh CSRF token and code verifier in sessionStorage.
 */ async function buildPkceParams(config) {
    const csrfToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$crypto$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomBase64url"])(32);
    const codeVerifier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$crypto$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomBase64url"])(32);
    const codeChallenge = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$crypto$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sha256Base64url"])(codeVerifier);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeCSRFToken"])(csrfToken);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeCodeVerifier"])(codeVerifier);
    return new URLSearchParams({
        scope: config.scopes ?? 'trade account_manage',
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        state: csrfToken,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    });
}
/**
 * Append partner attribution + language params shared by login and sign-up.
 * `lang` mirrors deriv-api-v2's redirectToLogin/SignUp so Deriv's home app
 * opens in the same language the user selected in the template.
 */ function appendAttributionParams(params, config) {
    if (config.affiliateToken) {
        const tokenParam = config.affiliateTokenParam ?? 't';
        params.set(tokenParam, config.affiliateToken);
    }
    if (config.utmSource) params.set('utm_source', config.utmSource);
    if (config.utmMedium) params.set('utm_medium', config.utmMedium);
    if (config.utmCampaign) params.set('utm_campaign', config.utmCampaign);
    if (config.lang) params.set('lang', config.lang.toUpperCase());
}
async function buildAuthorizationUrl(config) {
    const params = await buildPkceParams(config);
    appendAttributionParams(params, config);
    return `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthBaseUrl"])()}/auth?${params.toString()}`;
}
async function buildSignUpUrl(config) {
    const params = await buildPkceParams(config);
    params.set('prompt', 'registration');
    appendAttributionParams(params, config);
    return `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthBaseUrl"])()}/auth?${params.toString()}`;
}
async function initiateLogin(config) {
    const url = await buildAuthorizationUrl(config);
    window.location.href = url;
}
async function initiateSignUp(config) {
    const url = await buildSignUpUrl(config);
    window.location.href = url;
}
function parseCallbackParams(url) {
    const urlObj = new URL(url);
    return {
        code: urlObj.searchParams.get('code'),
        state: urlObj.searchParams.get('state'),
        scope: urlObj.searchParams.get('scope'),
        error: urlObj.searchParams.get('error'),
        error_description: urlObj.searchParams.get('error_description')
    };
}
function validateCallback(params, redirectUri) {
    // Check for error response
    if (params.error) {
        cleanupUrl(redirectUri);
        throw new OAuthError(`OAuth error: ${params.error} - ${params.error_description || ''}`);
    }
    // State must be present
    if (!params.state) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
        cleanupUrl(redirectUri);
        throw new OAuthError('Missing state parameter — possible CSRF attack');
    }
    // Validate CSRF token matches
    const storedToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCSRFToken"])();
    if (!storedToken || storedToken !== params.state) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
        cleanupUrl(redirectUri);
        throw new OAuthError('CSRF token mismatch — possible CSRF attack');
    }
    // Clear CSRF token after successful validation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearCSRFToken"])();
    if (!params.code) {
        throw new OAuthError('Missing authorization code');
    }
    return params.code;
}
async function exchangeCodeForTokens(params) {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: params.code,
        client_id: params.clientId,
        redirect_uri: params.redirectUri,
        code_verifier: params.codeVerifier
    });
    const response = await fetch(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthBaseUrl"])()}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new OAuthError(`Token exchange failed (${response.status}): ${errorBody}`);
    }
    const tokenData = await response.json();
    const authInfo = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expires_at: tokenData.expires_at ?? Math.floor(Date.now() / 1000) + tokenData.expires_in,
        scope: tokenData.scope,
        refresh_token: tokenData.refresh_token
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeAuthInfo"])(authInfo);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearCodeVerifier"])();
    return authInfo;
}
async function refreshAccessToken(refreshToken, clientId) {
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId
    });
    const response = await fetch(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuthBaseUrl"])()}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });
    if (!response.ok) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAllAuthData"])();
        throw new OAuthError(`Token refresh failed (${response.status})`);
    }
    const tokenData = await response.json();
    const authInfo = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expires_at: tokenData.expires_at ?? Math.floor(Date.now() / 1000) + tokenData.expires_in,
        scope: tokenData.scope,
        refresh_token: tokenData.refresh_token
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeAuthInfo"])(authInfo);
    return authInfo;
}
async function handleOAuthCallback(callbackUrl, config) {
    const params = parseCallbackParams(callbackUrl);
    const code = validateCallback(params, config.redirectUri);
    const codeVerifier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCodeVerifier"])();
    if (!codeVerifier) {
        throw new OAuthError('Code verifier expired or missing');
    }
    const authInfo = await exchangeCodeForTokens({
        code,
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        codeVerifier
    });
    cleanupUrl(config.redirectUri);
    return authInfo;
}
function cleanupUrl(baseUrl) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const url = new URL(window.location.href);
    const paramsToRemove = [
        'code',
        'state',
        'scope',
        'error',
        'error_description'
    ];
    paramsToRemove.forEach((param)=>url.searchParams.delete(param));
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
}
class OAuthError extends Error {
    constructor(message){
        super(message);
        this.name = 'OAuthError';
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/auth/referral.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseLandingParams",
    ()=>parseLandingParams,
    "parseReferralLink",
    ()=>parseReferralLink,
    "resolveReferralViaProxy",
    ()=>resolveReferralViaProxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/config/urls.ts [app-client] (ecmascript)");
;
function parseReferralLink(referralLink) {
    if (!referralLink) return null;
    try {
        const url = new URL(referralLink);
        // Format 3: standard OAuth token aliases — preserve the exact param name used.
        // Checked in priority order; the first one present wins.
        const TOKEN_ALIASES = [
            't',
            'affiliate_token',
            'sidi',
            'ca'
        ];
        for (const param of TOKEN_ALIASES){
            const value = url.searchParams.get(param);
            if (value) {
                return {
                    affiliateToken: value,
                    affiliateTokenParam: param,
                    utmCampaign: url.searchParams.get('utm_campaign') ?? '',
                    utmSource: url.searchParams.get('utm_source') ?? undefined,
                    utmMedium: url.searchParams.get('utm_medium') ?? undefined
                };
            }
        }
        // Format 1: deriv.com/signup?sidc=...&utm_campaign=... (DynamicWorks platform)
        // sidc is not an OAuth alias — forward the token as 't'.
        const sidc = url.searchParams.get('sidc');
        if (sidc) {
            return {
                affiliateToken: sidc,
                affiliateTokenParam: 't',
                utmCampaign: url.searchParams.get('utm_campaign') ?? 'dynamicworks',
                utmSource: url.searchParams.get('utm_source') ?? undefined,
                utmMedium: url.searchParams.get('utm_medium') ?? undefined
            };
        }
        // Format 2: track.deriv.com/_TOKEN_/1/
        if (url.hostname.includes('track.deriv.com')) {
            const pathSegments = url.pathname.split('/').filter(Boolean);
            if (pathSegments.length > 0) {
                // Remove leading/trailing underscores from the token segment
                const rawToken = pathSegments[0].replace(/^_|_$/g, '');
                if (rawToken) {
                    return {
                        affiliateToken: rawToken,
                        affiliateTokenParam: 't',
                        utmCampaign: 'myaffiliates'
                    };
                }
            }
        }
    } catch  {
    // Invalid URL
    }
    return null;
}
function parseLandingParams() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    const utmSource = params.get('utm_source') ?? undefined;
    const utmMedium = params.get('utm_medium') ?? undefined;
    const utmCampaign = params.get('utm_campaign') ?? undefined;
    if (!t && !utmSource && !utmMedium && !utmCampaign) return null;
    return {
        affiliateToken: t ?? '',
        affiliateTokenParam: 't',
        utmCampaign: utmCampaign ?? '',
        utmSource,
        utmMedium
    };
}
/** True for a Scaleo click link (*-tracking.deriv.com/click?...). */ function isScaleoClickLink(referralLink) {
    try {
        const url = new URL(referralLink);
        return url.hostname.endsWith('-tracking.deriv.com') && url.pathname === '/click';
    } catch  {
        return false;
    }
}
async function resolveReferralViaProxy(referralLink) {
    if (!referralLink || typeof fetch === 'undefined') return null;
    if (!isScaleoClickLink(referralLink)) return null;
    const TIMEOUT_MS = 2500;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer;
    // Hard 2.5s cap on the critical login path. AbortController cancels the
    // in-flight request when available; the Promise.race timeout guarantees the
    // cap even when it is not (so the awaited call can never hang login).
    const timeout = new Promise((resolve)=>{
        timer = setTimeout(()=>{
            controller?.abort();
            resolve(null);
        }, TIMEOUT_MS);
    });
    // Never rejects → no unhandled rejection if the timeout wins the race.
    const work = (async ()=>{
        try {
            const endpoint = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAppBuilderBaseUrl"])()}/api/app-builder/resolve-tracking?link=${encodeURIComponent(referralLink)}`;
            const response = await fetch(endpoint, {
                signal: controller?.signal
            });
            if (!response.ok) return null;
            const data = await response.json();
            if (data && typeof data === 'object' && 'url' in data) {
                const resolvedUrl = data.url;
                if (typeof resolvedUrl === 'string' && resolvedUrl) {
                    return parseReferralLink(resolvedUrl);
                }
            }
            return null;
        } catch  {
            return null;
        }
    })();
    try {
        return await Promise.race([
            work,
            timeout
        ]);
    } finally{
        if (timer) clearTimeout(timer);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/auth/storage.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearAllAuthData",
    ()=>clearAllAuthData,
    "clearAuthInfo",
    ()=>clearAuthInfo,
    "clearCSRFToken",
    ()=>clearCSRFToken,
    "clearCodeVerifier",
    ()=>clearCodeVerifier,
    "clearDerivAccounts",
    ()=>clearDerivAccounts,
    "getAccountType",
    ()=>getAccountType,
    "getActiveLoginId",
    ()=>getActiveLoginId,
    "getAuthInfo",
    ()=>getAuthInfo,
    "getCSRFToken",
    ()=>getCSRFToken,
    "getCodeVerifier",
    ()=>getCodeVerifier,
    "getDerivAccounts",
    ()=>getDerivAccounts,
    "setAccountType",
    ()=>setAccountType,
    "setActiveLoginId",
    ()=>setActiveLoginId,
    "storeAuthInfo",
    ()=>storeAuthInfo,
    "storeCSRFToken",
    ()=>storeCSRFToken,
    "storeCodeVerifier",
    ()=>storeCodeVerifier,
    "storeDerivAccounts",
    ()=>storeDerivAccounts
]);
const CSRF_TOKEN_KEY = 'oauth_csrf_token';
const CODE_VERIFIER_KEY = 'oauth_code_verifier';
const AUTH_INFO_KEY = 'auth_info';
const DERIV_ACCOUNTS_KEY = 'deriv_accounts';
const ACTIVE_LOGINID_KEY = 'active_loginid';
const ACCOUNT_TYPE_KEY = 'account_type';
const TOKEN_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
function storeCSRFToken(token) {
    const stored = {
        value: token,
        createdAt: Date.now()
    };
    sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(stored));
}
function getCSRFToken() {
    const raw = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (Date.now() - stored.createdAt > TOKEN_MAX_AGE_MS) {
        clearCSRFToken();
        return null;
    }
    return stored.value;
}
function clearCSRFToken() {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
}
function storeCodeVerifier(verifier) {
    const stored = {
        value: verifier,
        createdAt: Date.now()
    };
    sessionStorage.setItem(CODE_VERIFIER_KEY, JSON.stringify(stored));
}
function getCodeVerifier() {
    const raw = sessionStorage.getItem(CODE_VERIFIER_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (Date.now() - stored.createdAt > TOKEN_MAX_AGE_MS) {
        clearCodeVerifier();
        return null;
    }
    return stored.value;
}
function clearCodeVerifier() {
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
}
function storeAuthInfo(authInfo) {
    localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(authInfo));
}
function getAuthInfo() {
    const raw = localStorage.getItem(AUTH_INFO_KEY);
    if (!raw) return null;
    const authInfo = JSON.parse(raw);
    if (authInfo.expires_at && Date.now() > authInfo.expires_at * 1000) {
        return null; // Token expired
    }
    return authInfo;
}
function clearAuthInfo() {
    localStorage.removeItem(AUTH_INFO_KEY);
}
function storeDerivAccounts(accounts) {
    localStorage.setItem(DERIV_ACCOUNTS_KEY, JSON.stringify(accounts));
}
function getDerivAccounts() {
    const raw = localStorage.getItem(DERIV_ACCOUNTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
}
function clearDerivAccounts() {
    localStorage.removeItem(DERIV_ACCOUNTS_KEY);
}
function setActiveLoginId(loginId) {
    localStorage.setItem(ACTIVE_LOGINID_KEY, loginId);
}
function getActiveLoginId() {
    return localStorage.getItem(ACTIVE_LOGINID_KEY);
}
function setAccountType(type) {
    localStorage.setItem(ACCOUNT_TYPE_KEY, type);
}
function getAccountType() {
    return localStorage.getItem(ACCOUNT_TYPE_KEY);
}
function clearAllAuthData() {
    clearCSRFToken();
    clearCodeVerifier();
    clearAuthInfo();
    clearDerivAccounts();
    localStorage.removeItem(ACTIVE_LOGINID_KEY);
    localStorage.removeItem(ACCOUNT_TYPE_KEY);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/config/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/config/urls.ts [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/config/urls.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getApiBaseUrl",
    ()=>getApiBaseUrl,
    "getAppBuilderBaseUrl",
    ()=>getAppBuilderBaseUrl,
    "getAuthBaseUrl",
    ()=>getAuthBaseUrl,
    "getPublicWsUrl",
    ()=>getPublicWsUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
function getEnv() {
    if (typeof globalThis !== 'undefined' && typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] !== 'undefined') {
        const env = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DERIV_ENV;
        if (env === 'preview') return 'preview';
    }
    return 'production';
}
const URLS = {
    production: {
        authBase: 'https://auth.deriv.com/oauth2',
        apiBase: 'https://api.derivws.com/trading/v1/options',
        publicWs: 'wss://api.derivws.com/trading/v1/options/ws/public',
        appBuilder: 'https://developers.deriv.com'
    },
    preview: {
        authBase: 'https://staging-auth.deriv.com/oauth2',
        apiBase: 'https://staging-api.derivws.com/trading/v1/options',
        publicWs: 'wss://staging-api.derivws.com/trading/v1/options/ws/public',
        appBuilder: 'https://staging-developers.deriv.com'
    }
};
function getAuthBaseUrl() {
    return URLS[getEnv()].authBase;
}
function getApiBaseUrl() {
    return URLS[getEnv()].apiBase;
}
function getPublicWsUrl() {
    return URLS[getEnv()].publicWs;
}
function getAppBuilderBaseUrl() {
    return URLS[getEnv()].appBuilder;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
// Auth
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$auth$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/auth/index.ts [app-client] (ecmascript) <locals>");
// Config
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/config/index.ts [app-client] (ecmascript) <locals>");
// Utils
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$utils$2f$pick$2d$default$2d$symbol$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/utils/pick-default-symbol.ts [app-client] (ecmascript)");
// WebSocket
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/ws/index.ts [app-client] (ecmascript) <locals>");
// React Hooks
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/react/index.ts [app-client] (ecmascript) <locals>");
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/react/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useDerivWS$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/react/useDerivWS.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useActiveSymbols$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/react/useActiveSymbols.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useTicks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/react/useTicks.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useProposal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/react/useProposal.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$react$2f$useBuy$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/react/useBuy.ts [app-client] (ecmascript)");
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/react/useActiveSymbols.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useActiveSymbols",
    ()=>useActiveSymbols
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$utils$2f$pick$2d$default$2d$symbol$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/utils/pick-default-symbol.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const SYMBOL_PARAM = 'symbol';
function readSymbolFromUrl() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return new URLSearchParams(window.location.search).get(SYMBOL_PARAM) ?? undefined;
}
function writeSymbolToUrl(symbol) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const params = new URLSearchParams(window.location.search);
    params.set(SYMBOL_PARAM, symbol);
    const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', next);
}
function useActiveSymbols(ws, isConnected, contractTypes) {
    _s();
    const [symbols, setSymbols] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [activeSymbol, setActiveSymbol] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [contracts, setContracts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [contractsAvailable, setContractsAvailable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [durationLimits, setDurationLimits] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        min: 1,
        max: 10,
        unit: 't'
    });
    const [defaultStake, setDefaultStake] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const loadContractsFor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useActiveSymbols.useCallback[loadContractsFor]": async (wsInstance, symbol)=>{
            const response = await wsInstance.send({
                contracts_for: symbol.underlying_symbol
            });
            const filtered = response.contracts_for?.available?.filter({
                "useActiveSymbols.useCallback[loadContractsFor]": (c)=>contractTypes.includes(c.contract_type)
            }["useActiveSymbols.useCallback[loadContractsFor]"]) ?? [];
            setContracts(filtered);
            setContractsAvailable(filtered.length > 0);
            if (filtered.length > 0) {
                const contract = filtered[0];
                const minMatch = contract.min_contract_duration.match(/^(\d+)/);
                const maxMatch = contract.max_contract_duration.match(/^(\d+)/);
                const unit = contract.min_contract_duration.replace(/^\d+/, '');
                const min = minMatch ? parseInt(minMatch[1], 10) : 1;
                const max = maxMatch ? parseInt(maxMatch[1], 10) : 10;
                setDurationLimits({
                    min,
                    max,
                    unit
                });
                setDefaultStake(contract.default_stake);
            }
        }
    }["useActiveSymbols.useCallback[loadContractsFor]"], [
        contractTypes
    ]);
    const selectSymbol = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useActiveSymbols.useCallback[selectSymbol]": (underlyingSymbol)=>{
            if (!ws || !isConnected) return;
            const symbol = symbols.find({
                "useActiveSymbols.useCallback[selectSymbol].symbol": (s)=>s.underlying_symbol === underlyingSymbol
            }["useActiveSymbols.useCallback[selectSymbol].symbol"]);
            if (!symbol || symbol.underlying_symbol === activeSymbol?.underlying_symbol) return;
            setActiveSymbol(symbol);
            writeSymbolToUrl(symbol.underlying_symbol);
            loadContractsFor(ws, symbol).catch({
                "useActiveSymbols.useCallback[selectSymbol]": ()=>{}
            }["useActiveSymbols.useCallback[selectSymbol]"]);
        }
    }["useActiveSymbols.useCallback[selectSymbol]"], [
        ws,
        isConnected,
        symbols,
        activeSymbol,
        loadContractsFor
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useActiveSymbols.useEffect": ()=>{
            if (!ws || !isConnected) return;
            let disposed = false;
            async function fetchSymbols() {
                try {
                    setIsLoading(true);
                    const response = await ws.send({
                        active_symbols: 'full',
                        contract_type: contractTypes
                    });
                    if (disposed) return;
                    const allSymbols = response.active_symbols;
                    if (!allSymbols || allSymbols.length === 0) {
                        throw new Error('No symbols available');
                    }
                    setSymbols(allSymbols);
                    const chosen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$utils$2f$pick$2d$default$2d$symbol$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pickDefaultSymbol"])(allSymbols, readSymbolFromUrl());
                    setActiveSymbol(chosen);
                    writeSymbolToUrl(chosen.underlying_symbol);
                    await loadContractsFor(ws, chosen);
                    if (disposed) return;
                    setIsLoading(false);
                } catch  {
                    if (!disposed) setIsLoading(false);
                }
            }
            fetchSymbols();
            return ({
                "useActiveSymbols.useEffect": ()=>{
                    disposed = true;
                }
            })["useActiveSymbols.useEffect"];
        }
    }["useActiveSymbols.useEffect"], [
        ws,
        isConnected,
        contractTypes,
        loadContractsFor
    ]);
    return {
        symbols,
        activeSymbol,
        selectSymbol,
        contracts,
        contractsAvailable,
        durationLimits,
        defaultStake,
        isLoading
    };
}
_s(useActiveSymbols, "JvtsSjncH0cLF8QW5K4XEGsdV5s=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/react/useBuy.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useBuy",
    ()=>useBuy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
function useBuy(ws, isConnected) {
    _s();
    const [isBuying, setIsBuying] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [buyResult, setBuyResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [buyError, setBuyError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const clearBuyResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBuy.useCallback[clearBuyResult]": ()=>{
            setBuyResult(null);
            setBuyError(null);
        }
    }["useBuy.useCallback[clearBuyResult]"], []);
    const buyContract = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useBuy.useCallback[buyContract]": async (proposal)=>{
            if (!ws || !isConnected) return;
            setIsBuying(true);
            setBuyError(null);
            setBuyResult(null);
            try {
                const response = await ws.send({
                    buy: proposal.id,
                    price: String(proposal.askPrice)
                });
                if (response.buy) {
                    setBuyResult({
                        contractId: response.buy.contract_id,
                        buyPrice: response.buy.buy_price,
                        payout: response.buy.payout,
                        longcode: response.buy.longcode,
                        balanceAfter: response.buy.balance_after
                    });
                }
            } catch (err) {
                setBuyError(err instanceof Error ? err.message : 'Purchase failed');
            } finally{
                setIsBuying(false);
            }
        }
    }["useBuy.useCallback[buyContract]"], [
        ws,
        isConnected
    ]);
    return {
        buyContract,
        isBuying,
        buyResult,
        buyError,
        clearBuyResult
    };
}
_s(useBuy, "+ckWIWYPXhKLpyMiWUGbYVOFi5Y=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/react/useDerivWS.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDerivWS",
    ()=>useDerivWS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/ws/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$deriv$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/ws/deriv-ws.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useDerivWS(options) {
    _s();
    const { url, accountId } = options ?? {};
    const wsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const listenersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isExhausted, setIsExhausted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDerivWS.useCallback[subscribe]": (listener)=>{
            listenersRef.current.add(listener);
            return ({
                "useDerivWS.useCallback[subscribe]": ()=>{
                    listenersRef.current.delete(listener);
                }
            })["useDerivWS.useCallback[subscribe]"];
        }
    }["useDerivWS.useCallback[subscribe]"], []);
    const getSnapshot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDerivWS.useCallback[getSnapshot]": ()=>wsRef.current
    }["useDerivWS.useCallback[getSnapshot]"], []);
    // Full reconnect key: changes when auth type changes OR when the account switches.
    // Stays stable when only the OTP URL string is refreshed for the same account.
    const isAuthenticated = url !== undefined;
    const reconnectKey = isAuthenticated ? `auth:${accountId ?? 'unknown'}` : 'public';
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useDerivWS.useEffect": ()=>{
            let disposed = false;
            const instance = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$deriv$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DerivWS"](url);
            wsRef.current = instance;
            listenersRef.current.forEach({
                "useDerivWS.useEffect": (l)=>l()
            }["useDerivWS.useEffect"]);
            const unsubscribeState = instance.onConnectionStateChange({
                "useDerivWS.useEffect.unsubscribeState": (connected)=>{
                    if (!disposed) {
                        setIsConnected(connected);
                        if (connected) setError(null);
                    }
                }
            }["useDerivWS.useEffect.unsubscribeState"]);
            const unsubscribeExhausted = instance.onReconnectExhausted({
                "useDerivWS.useEffect.unsubscribeExhausted": ()=>{
                    if (!disposed) setIsExhausted(true);
                }
            }["useDerivWS.useEffect.unsubscribeExhausted"]);
            instance.connect().catch({
                "useDerivWS.useEffect": (err)=>{
                    if (!disposed) {
                        setError(err instanceof Error ? err.message : 'Connection failed');
                    }
                }
            }["useDerivWS.useEffect"]);
            const listeners = listenersRef.current;
            return ({
                "useDerivWS.useEffect": ()=>{
                    disposed = true;
                    setIsConnected(false);
                    setIsExhausted(false);
                    unsubscribeState();
                    unsubscribeExhausted();
                    instance.disconnect();
                    wsRef.current = null;
                    listeners.forEach({
                        "useDerivWS.useEffect": (l)=>l()
                    }["useDerivWS.useEffect"]);
                }
            })["useDerivWS.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["useDerivWS.useEffect"], [
        reconnectKey
    ]);
    // When the OTP URL changes for the same account (tab focus refresh), silently
    // update the URL on the existing instance — no reconnect, no flash.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useDerivWS.useEffect": ()=>{
            if (url && wsRef.current) {
                wsRef.current.updateUrl(url);
            }
        }
    }["useDerivWS.useEffect"], [
        url
    ]);
    const ws = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(subscribe, getSnapshot, {
        "useDerivWS.useSyncExternalStore[ws]": ()=>null
    }["useDerivWS.useSyncExternalStore[ws]"]);
    return {
        ws,
        isConnected,
        isExhausted,
        error
    };
}
_s(useDerivWS, "2M5G+5YNkNihF2NtV623qj0sXw4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/react/useProposal.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProposal",
    ()=>useProposal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
function useProposal(ws, isConnected, params) {
    _s();
    const [proposal, setProposal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const unsubRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProposal.useEffect": ()=>{
            // Forget previous proposal subscription
            if (unsubRef.current) {
                unsubRef.current();
                unsubRef.current = null;
            }
            if (!ws || !isConnected || !params || params.amount <= 0) {
                return;
            }
            let cancelled = false;
            const payload = {
                proposal: 1,
                amount: params.amount,
                basis: params.basis,
                contract_type: params.contractType,
                currency: params.currency,
                underlying_symbol: params.symbol
            };
            if (params.dateExpiry !== undefined) {
                payload.date_expiry = params.dateExpiry;
            } else {
                payload.duration = params.duration;
                payload.duration_unit = params.durationUnit;
            }
            if (params.barrier !== undefined) {
                payload.barrier = params.barrier;
            }
            ws.subscribe(payload, {
                "useProposal.useEffect": (data)=>{
                    if (cancelled) return;
                    const resp = data;
                    if (resp.proposal) {
                        setProposal({
                            id: resp.proposal.id,
                            askPrice: resp.proposal.ask_price,
                            payout: resp.proposal.payout,
                            longcode: resp.proposal.longcode,
                            minStake: parseFloat(resp.proposal.validation_params?.stake?.min ?? '0'),
                            maxPayout: parseFloat(resp.proposal.validation_params?.payout?.max ?? '0')
                        });
                    }
                }
            }["useProposal.useEffect"]).then({
                "useProposal.useEffect": (sub)=>{
                    if (cancelled) {
                        sub.unsubscribe();
                    } else {
                        unsubRef.current = sub.unsubscribe;
                    }
                }
            }["useProposal.useEffect"]).catch({
                "useProposal.useEffect": ()=>{
                    if (!cancelled) setProposal(null);
                }
            }["useProposal.useEffect"]);
            return ({
                "useProposal.useEffect": ()=>{
                    cancelled = true;
                    setProposal(null);
                    if (unsubRef.current) {
                        unsubRef.current();
                        unsubRef.current = null;
                    }
                }
            })["useProposal.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally using individual param fields to avoid re-subscribing on object reference changes
        }
    }["useProposal.useEffect"], [
        ws,
        isConnected,
        params?.contractType,
        params?.symbol,
        params?.amount,
        params?.duration,
        params?.durationUnit,
        params?.barrier,
        params?.basis,
        params?.currency,
        params?.dateExpiry
    ]);
    return {
        proposal
    };
}
_s(useProposal, "1ifrEUO59XT3dceMhEdwr2SwuYQ=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/react/useTicks.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FORGET_ACK_TIMEOUT_MS",
    ()=>FORGET_ACK_TIMEOUT_MS,
    "useTicks",
    ()=>useTicks
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/core/src/ws/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$deriv$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/ws/deriv-ws.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$stream$2d$family$2d$forget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/ws/stream-family-forget.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const DEFAULT_TICK_COUNT = 1000;
/** The stream family a `{ forget_all: … }` must name to cancel our tick stream. */ const TICK_FAMILY = 'ticks';
const FORGET_ACK_TIMEOUT_MS = 1500;
/**
 * Resolve when `promise` settles or when `ms` elapses, whichever comes first.
 * Never rejects.
 */ function settleWithin(promise, ms) {
    return new Promise((resolve)=>{
        const timer = setTimeout(resolve, ms);
        const done = ()=>{
            clearTimeout(timer);
            resolve();
        };
        promise.then(done, done);
    });
}
function useTicks(ws, isConnected, activeSymbol, tickCount = DEFAULT_TICK_COUNT) {
    _s();
    const pricesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const pipSizeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(2);
    const unsubscribeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // The in-flight `forget` from the previous effect run. The next run awaits it
    // so a re-subscription for the same symbol cannot race its own cancellation.
    const pendingForgetRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Stable identity for this hook instance on the family-forget channel, so our
    // own `forget_all` never wakes us.
    const forgetChannelOwner = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({});
    const [currentTick, setCurrentTick] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [prices, setPrices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [pipSize, setPipSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(2);
    const pipSizeFromPip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useTicks.useCallback[pipSizeFromPip]": (pip)=>{
            if (pip >= 1) return 0;
            const str = pip.toString();
            const dotIndex = str.indexOf('.');
            return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
        }
    }["useTicks.useCallback[pipSizeFromPip]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useTicks.useEffect": ()=>{
            if (!ws || !isConnected || !activeSymbol) return;
            const socket = ws;
            const owner = forgetChannelOwner.current;
            const symbol = activeSymbol.underlying_symbol;
            let disposed = false;
            // Cancel the stream this hook created, remembering the round-trip so the
            // next subscription can wait for it. Scoped to our own subscription id —
            // never the whole tick family, which the chart's quote feed also lives in.
            const forgetOwnStream = {
                "useTicks.useEffect.forgetOwnStream": ()=>{
                    if (!unsubscribeRef.current) return;
                    pendingForgetRef.current = {
                        socket,
                        acknowledged: unsubscribeRef.current()
                    };
                    unsubscribeRef.current = null;
                }
            }["useTicks.useEffect.forgetOwnStream"];
            forgetOwnStream();
            // Reset refs
            pricesRef.current = [];
            const ps = pipSizeFromPip(activeSymbol.pip_size);
            pipSizeRef.current = ps;
            const onTick = {
                "useTicks.useEffect.onTick": (data)=>{
                    const tick = data.tick;
                    if (!tick) return;
                    const tickPs = tick.pip_size ?? pipSizeRef.current;
                    if (tick.pip_size && tick.pip_size !== pipSizeRef.current) {
                        pipSizeRef.current = tick.pip_size;
                    }
                    setCurrentTick(tick);
                    // Sliding window update
                    pricesRef.current = [
                        ...pricesRef.current,
                        tick.quote
                    ];
                    if (pricesRef.current.length > tickCount) {
                        pricesRef.current = pricesRef.current.slice(-tickCount);
                    }
                    setPrices([
                        ...pricesRef.current
                    ]);
                    setPipSize(tickPs);
                }
            }["useTicks.useEffect.onTick"];
            const reportFailure = {
                "useTicks.useEffect.reportFailure": (err)=>{
                    // Stream lifecycle failures are a developer concern — this hook never
                    // raises a user-facing notification of its own.
                    console.warn('[useTicks] tick subscription failed', {
                        symbol,
                        code: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$deriv$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDerivApiError"])(err) ? err.code : undefined,
                        msgType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$deriv$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDerivApiError"])(err) ? err.msgType : undefined,
                        error: err
                    });
                }
            }["useTicks.useEffect.reportFailure"];
            /**
     * Subscribe, retrying exactly once when the server says the stream is
     * already taken. A duplicate means another owner (or our own departing
     * instance) holds a tick-family stream for this symbol on this connection;
     * clearing the family and retaking it turns a dead feed into a live one.
     *
     * `forget_all` is connection-wide, so it also kills tick streams owned by
     * other consumers — silently, with no error frame on their side. Once the
     * server has acknowledged the clear we announce it, and those owners re-take
     * their own streams.
     *
     * `allowFamilyForget` is false on the recovery path so that announcement can
     * never cascade: one clear, one wake, one re-take per owner. Two rival
     * owners therefore cannot ping-pong.
     */ async function subscribeTicks(allowFamilyForget) {
                try {
                    return await socket.subscribe({
                        ticks: symbol
                    }, onTick);
                } catch (err) {
                    if (!allowFamilyForget) throw err;
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$deriv$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDerivApiError"])(err) || err.code !== 'AlreadySubscribed') throw err;
                    const cleared = await socket.send({
                        forget_all: TICK_FAMILY
                    }).then({
                        "useTicks.useEffect.subscribeTicks": ()=>true
                    }["useTicks.useEffect.subscribeTicks"], {
                        "useTicks.useEffect.subscribeTicks": ()=>false
                    }["useTicks.useEffect.subscribeTicks"]);
                    // Only a clear the server actually performed can have collateral damage.
                    if (cleared) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$stream$2d$family$2d$forget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notifyStreamFamilyForgotten"])({
                        socket,
                        family: TICK_FAMILY
                    }, owner);
                    if (disposed) return null;
                    return await socket.subscribe({
                        ticks: symbol
                    }, onTick);
                }
            }
            async function subscribe(allowFamilyForget) {
                const pending = pendingForgetRef.current;
                if (pending) {
                    // Only a cancellation on *this* connection can collide with the requests
                    // below. One left in flight on a socket that has since been replaced
                    // never will, and waiting on it would strand this run for good.
                    if (pending.socket === socket) {
                        await settleWithin(pending.acknowledged, FORGET_ACK_TIMEOUT_MS);
                    }
                    // Clear only our own entry — a later run may have armed a new one.
                    if (pendingForgetRef.current === pending) pendingForgetRef.current = null;
                    if (disposed) return;
                }
                const historyResponse = await socket.send({
                    ticks_history: symbol,
                    end: 'latest',
                    start: 1,
                    count: tickCount,
                    style: 'ticks'
                });
                if (disposed) return;
                setPipSize(ps);
                const historyPrices = historyResponse.history?.prices ?? [];
                pricesRef.current = historyPrices;
                setPrices([
                    ...historyPrices
                ]);
                const sub = await subscribeTicks(allowFamilyForget);
                if (!sub) return;
                if (disposed) {
                    // Established after teardown: cancel it, and record the forget so the
                    // next run still waits for it rather than racing this late stream.
                    pendingForgetRef.current = {
                        socket,
                        acknowledged: sub.unsubscribe()
                    };
                    return;
                }
                unsubscribeRef.current = sub.unsubscribe;
            }
            // Only ever one subscribe attempt at a time: two in flight would race to own
            // `unsubscribeRef`, and the loser's stream would never be cancelled.
            let inFlight = null;
            let recoveryQueued = false;
            const runSubscribe = {
                "useTicks.useEffect.runSubscribe": (allowFamilyForget)=>{
                    inFlight = subscribe(allowFamilyForget).catch(reportFailure).finally({
                        "useTicks.useEffect.runSubscribe": ()=>{
                            inFlight = null;
                            if (!recoveryQueued || disposed) return;
                            recoveryQueued = false;
                            recoverStream();
                        }
                    }["useTicks.useEffect.runSubscribe"]);
                }
            }["useTicks.useEffect.runSubscribe"];
            /**
     * Re-take our stream after another owner cleared the tick family. The server
     * sends no error and no close for that — the stream just stops delivering —
     * so the announcement is the only chance to notice.
     *
     * History is re-fetched too, so the price series has no hole where the
     * stream was down.
     */ function recoverStream() {
                if (disposed) return;
                // A clear that lands mid-handshake can kill the stream we are still
                // establishing, so the recovery waits for that attempt rather than racing
                // it — and then re-takes whatever it ended up with.
                if (inFlight) {
                    recoveryQueued = true;
                    return;
                }
                if (unsubscribeRef.current) {
                    // The server-side stream is already gone; this only releases the local
                    // handler slot. Not awaited — a `forget` for a dead id cannot collide
                    // with the new subscription, which carries a different id.
                    void unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }
                runSubscribe(false);
            }
            const onFamilyForgotten = {
                "useTicks.useEffect.onFamilyForgotten": (event)=>{
                    if (event.socket !== socket || event.family !== TICK_FAMILY) return;
                    recoverStream();
                }
            }["useTicks.useEffect.onFamilyForgotten"];
            const stopListening = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$stream$2d$family$2d$forget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onStreamFamilyForgotten"])(owner, onFamilyForgotten);
            runSubscribe(true);
            return ({
                "useTicks.useEffect": ()=>{
                    disposed = true;
                    stopListening();
                    setCurrentTick(null);
                    setPrices([]);
                    forgetOwnStream();
                }
            })["useTicks.useEffect"];
        }
    }["useTicks.useEffect"], [
        ws,
        isConnected,
        activeSymbol,
        tickCount,
        pipSizeFromPip
    ]);
    return {
        currentTick,
        prices,
        pipSize
    };
}
_s(useTicks, "cZqpWWtSNAkzwfSHr5QdsEXtX5w=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/utils/pick-default-symbol.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "pickDefaultSymbol",
    ()=>pickDefaultSymbol
]);
const DEFAULT_SYMBOL = '1HZ100V';
const isOpen = (s)=>s.exchange_is_open === 1;
const fromFavorites = (symbols)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = window.localStorage.getItem('cq-favorites');
        if (!raw) return undefined;
        const parsed = JSON.parse(raw);
        const favorites = parsed['chartTitle&Comparison'] ?? [];
        for (const fav of favorites){
            const match = symbols.find((s)=>s.underlying_symbol === fav && isOpen(s));
            if (match) return match;
        }
    } catch  {
    // malformed localStorage entry — ignore
    }
    return undefined;
};
function pickDefaultSymbol(symbols, preferredSymbol) {
    if (!symbols.length) throw new Error('No active symbols available');
    // 1. Preferred symbol (URL param / stored value) — must be open
    if (preferredSymbol) {
        const match = symbols.find((s)=>s.underlying_symbol === preferredSymbol && isOpen(s));
        if (match) return match;
    }
    // 2. User's chart favorites (first open match)
    const fav = fromFavorites(symbols);
    if (fav) return fav;
    // 3. 1HZ100V if open
    const volatility100_1s = symbols.find((s)=>s.underlying_symbol === DEFAULT_SYMBOL && isOpen(s));
    if (volatility100_1s) return volatility100_1s;
    // 4. First open random_index symbol
    const randomIndex = symbols.find((s)=>s.submarket === 'random_index' && isOpen(s));
    if (randomIndex) return randomIndex;
    // 5. First open major_pairs symbol
    const majorPairsOpen = symbols.find((s)=>s.submarket === 'major_pairs' && isOpen(s));
    if (majorPairsOpen) return majorPairsOpen;
    // 6. Any major_pairs symbol (market may be closed)
    const majorPairsAny = symbols.find((s)=>s.submarket === 'major_pairs');
    if (majorPairsAny) return majorPairsAny;
    // 7. Absolute fallback
    return symbols[0];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/ws/deriv-ws.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DerivApiError",
    ()=>DerivApiError,
    "DerivWS",
    ()=>DerivWS,
    "isDerivApiError",
    ()=>isDerivApiError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/config/urls.ts [app-client] (ecmascript)");
;
class DerivApiError extends Error {
    /** API error code, e.g. `AlreadySubscribed`. Empty string when the frame carried none. */ code;
    /** `msg_type` of the response the error arrived on, when the frame carried one. */ msgType;
    constructor(code, message, msgType){
        super(message);
        this.name = 'DerivApiError';
        this.code = code;
        this.msgType = msgType;
    }
}
function isDerivApiError(value) {
    return value instanceof DerivApiError;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readString(source, key) {
    const value = source[key];
    return typeof value === 'string' ? value : undefined;
}
/**
 * Build a DerivApiError from a raw error frame. The message is left empty when
 * the API omits it — callers that render it already supply their own localized
 * fallback, so no English copy is invented here.
 */ function toDerivApiError(data) {
    const detail = isRecord(data.error) ? data.error : {};
    return new DerivApiError(readString(detail, 'code') ?? '', readString(detail, 'message') ?? '', readString(data, 'msg_type'));
}
class DerivWS {
    ws = null;
    reqIdCounter = 0;
    pendingRequests = new Map();
    subscriptionHandlers = new Map();
    globalHandlers = [];
    connectionStateHandlers = [];
    reconnectExhaustedHandlers = [];
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectTimeout = null;
    pingInterval = null;
    url;
    isConnecting = false;
    constructor(url){
        this.url = url ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$config$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPublicWsUrl"])();
    }
    /**
   * Register a listener for connection state changes.
   * Called with `true` on connect and `false` on disconnect.
   * Returns an unsubscribe function.
   */ onConnectionStateChange(handler) {
        this.connectionStateHandlers.push(handler);
        return ()=>{
            this.connectionStateHandlers = this.connectionStateHandlers.filter((h)=>h !== handler);
        };
    }
    onReconnectExhausted(handler) {
        this.reconnectExhaustedHandlers.push(handler);
        return ()=>{
            this.reconnectExhaustedHandlers = this.reconnectExhaustedHandlers.filter((h)=>h !== handler);
        };
    }
    notifyConnectionState(connected) {
        for (const handler of this.connectionStateHandlers){
            handler(connected);
        }
    }
    /**
   * Update the URL used for future reconnections without disrupting the current connection.
   * Call this when an OTP URL is refreshed but the live socket is still healthy.
   */ updateUrl(url) {
        this.url = url;
    }
    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        if (this.isConnecting) {
            return new Promise((resolve)=>{
                const check = setInterval(()=>{
                    if (this.ws?.readyState === WebSocket.OPEN) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
        }
        this.isConnecting = true;
        return new Promise((resolve, reject)=>{
            this.ws = new WebSocket(this.url);
            this.ws.onopen = ()=>{
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.startPing();
                this.notifyConnectionState(true);
                resolve();
            };
            this.ws.onmessage = (event)=>{
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            this.ws.onerror = ()=>{
                this.isConnecting = false;
                reject(new Error('WebSocket connection error'));
            };
            this.ws.onclose = ()=>{
                this.isConnecting = false;
                this.stopPing();
                this.subscriptionHandlers.clear();
                this.notifyConnectionState(false);
                this.attemptReconnect();
            };
        });
    }
    /**
   * Send a one-shot request and wait for the response matched by req_id.
   */ send(payload) {
        return new Promise((resolve, reject)=>{
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                return;
            }
            const reqId = ++this.reqIdCounter;
            const message = {
                ...payload,
                req_id: reqId
            };
            this.pendingRequests.set(reqId, {
                resolve: resolve,
                reject
            });
            this.ws.send(JSON.stringify(message));
        });
    }
    /**
   * Send a subscription request. The handler is called for every streamed message.
   * Returns a function to unsubscribe, which resolves once the server has
   * acknowledged the `forget` — await it before re-subscribing to the same
   * stream so the two requests cannot collide with `AlreadySubscribed`.
   */ subscribe(payload, handler) {
        return new Promise((resolve, reject)=>{
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                return;
            }
            const reqId = ++this.reqIdCounter;
            const message = {
                ...payload,
                subscribe: 1,
                req_id: reqId
            };
            this.pendingRequests.set(reqId, {
                resolve: (data)=>{
                    const subscriptionId = this.extractSubscriptionId(data);
                    if (subscriptionId) {
                        this.subscriptionHandlers.set(subscriptionId, handler);
                    }
                    // Also call handler with the initial response
                    handler(data);
                    resolve({
                        subscriptionId,
                        unsubscribe: ()=>{
                            if (!subscriptionId) return Promise.resolve();
                            this.subscriptionHandlers.delete(subscriptionId);
                            // Always resolves: most callers fire this from a React cleanup
                            // without awaiting, so a rejection here would surface as an
                            // unhandled rejection. Callers await it purely for ordering.
                            return this.send({
                                forget: subscriptionId
                            }).then(()=>undefined, ()=>undefined);
                        }
                    });
                },
                reject
            });
            this.ws.send(JSON.stringify(message));
        });
    }
    onMessage(handler) {
        this.globalHandlers.push(handler);
        return ()=>{
            this.globalHandlers = this.globalHandlers.filter((h)=>h !== handler);
        };
    }
    disconnect() {
        this.stopPing();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.pendingRequests.clear();
        this.subscriptionHandlers.clear();
    }
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    handleMessage(data) {
        // Notify global handlers
        for (const handler of this.globalHandlers){
            handler(data);
        }
        const reqId = data.req_id;
        // Check for error
        if (data.error) {
            if (reqId && this.pendingRequests.has(reqId)) {
                const pending = this.pendingRequests.get(reqId);
                this.pendingRequests.delete(reqId);
                pending.reject(toDerivApiError(data));
            }
            return;
        }
        // Check if this is a subscription stream
        const subId = this.extractSubscriptionId(data);
        if (subId && this.subscriptionHandlers.has(subId)) {
            this.subscriptionHandlers.get(subId)(data);
        }
        // Resolve pending one-shot request
        if (reqId && this.pendingRequests.has(reqId)) {
            const pending = this.pendingRequests.get(reqId);
            this.pendingRequests.delete(reqId);
            pending.resolve(data);
        }
    }
    extractSubscriptionId(data) {
        // Subscription ID can be in tick.id, subscription.id, or proposal.id
        if (data.subscription && typeof data.subscription === 'object') {
            return data.subscription.id ?? null;
        }
        if (data.tick && typeof data.tick === 'object') {
            return data.tick.id ?? null;
        }
        return null;
    }
    startPing() {
        this.pingInterval = setInterval(()=>{
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    ping: 1
                }));
            }
        }, 30000);
    }
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            for (const handler of this.reconnectExhaustedHandlers)handler();
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectTimeout = setTimeout(()=>{
            this.connect().catch(()=>{});
        }, delay);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/ws/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$deriv$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/ws/deriv-ws.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$src$2f$ws$2f$stream$2d$family$2d$forget$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/src/ws/stream-family-forget.ts [app-client] (ecmascript)");
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/src/ws/stream-family-forget.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "notifyStreamFamilyForgotten",
    ()=>notifyStreamFamilyForgotten,
    "onStreamFamilyForgotten",
    ()=>onStreamFamilyForgotten
]);
const listeners = new Map();
function onStreamFamilyForgotten(owner, listener) {
    listeners.set(owner, listener);
    return ()=>{
        if (listeners.get(owner) === listener) listeners.delete(owner);
    };
}
function notifyStreamFamilyForgotten(event, origin) {
    // Snapshot: a listener may re-subscribe synchronously, and a failed
    // re-subscription may unregister it.
    for (const [owner, listener] of [
        ...listeners
    ]){
        if (owner === origin) continue;
        listener(event);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_1v4c_ao._.js.map