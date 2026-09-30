(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/custom/smart-chart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SmartChartWrapper",
    ()=>SmartChartWrapper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@deriv-com/smartcharts-champion/dist/smartcharts.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$smartchart$2d$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/smartchart-constants.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
// In preview deployments the app is served under a basePath, so
// SmartCharts must load its lazy assets from that same prefix.
const smartChartsPublicPath = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BASE_PATH ? `${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BASE_PATH}/` : '/';
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setSmartChartsPublicPath"])(smartChartsPublicPath);
function SmartChartWrapper({ chartId, symbolKey, symbol, isConnectionOpened, isMobile, chartData, getQuotes, subscribeQuotes, unsubscribeQuotes, onSymbolChange, isLive = true, endEpoch, defaultGranularity = 0, barriers, contractsArray }) {
    _s();
    const [chartType, setChartType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('candles');
    const [granularity, setGranularity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(defaultGranularity);
    // Defer SmartChart mounting until this wrapper is committed to the DOM.
    // React 18 concurrent rendering can yield between a component's constructor
    // (which kicks off Flutter's async initializeEngine) and componentDidMount
    // (which appends flutterChartElement to the DOM). When main.dart.js is in
    // the V8 bytecode cache it executes fast enough to win that race, calling
    // initializeEngine with a detached 0×0 element and producing a blank canvas.
    // By gating SmartChart behind a useEffect we guarantee the constructor only
    // runs inside a fresh synchronous task where React will not yield mid-render.
    const [isReadyToMount, setIsReadyToMount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SmartChartWrapper.useEffect": ()=>{
            // Unregister any Flutter standalone-app service worker that may have been
            // left behind by an earlier deployment — it caches chart assets and can
            // serve stale main.dart.js, which is the other trigger for a blank canvas.
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then({
                    "SmartChartWrapper.useEffect": (registrations)=>{
                        registrations.filter({
                            "SmartChartWrapper.useEffect": (r)=>r.active?.scriptURL.includes('flutter_service_worker')
                        }["SmartChartWrapper.useEffect"]).forEach({
                            "SmartChartWrapper.useEffect": (r)=>r.unregister()
                        }["SmartChartWrapper.useEffect"]);
                    }
                }["SmartChartWrapper.useEffect"]).catch({
                    "SmartChartWrapper.useEffect": ()=>{}
                }["SmartChartWrapper.useEffect"]);
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsReadyToMount(true);
        }
    }["SmartChartWrapper.useEffect"], []);
    const { resolvedTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    const chartTheme = (resolvedTheme ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')) === 'dark' ? 'dark' : 'light';
    const chartSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SmartChartWrapper.useMemo[chartSettings]": ()=>({
                language: 'en',
                isHighestLowestMarkerEnabled: false,
                theme: chartTheme
            })
    }["SmartChartWrapper.useMemo[chartSettings]"], [
        chartTheme
    ]);
    const toolbarWidget = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SmartChartWrapper.useCallback[toolbarWidget]": ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToolbarWidget"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartMode"], {
                        onChartType: setChartType,
                        onGranularity: setGranularity
                    }, void 0, false, {
                        fileName: "[project]/components/custom/smart-chart.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    !isMobile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StudyLegend"], {}, void 0, false, {
                        fileName: "[project]/components/custom/smart-chart.tsx",
                        lineNumber: 144,
                        columnNumber: 23
                    }, this),
                    !isMobile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Views"], {
                        onChartType: setChartType,
                        onGranularity: setGranularity
                    }, void 0, false, {
                        fileName: "[project]/components/custom/smart-chart.tsx",
                        lineNumber: 145,
                        columnNumber: 23
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DrawTools"], {}, void 0, false, {
                        fileName: "[project]/components/custom/smart-chart.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    !isMobile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Share"], {}, void 0, false, {
                        fileName: "[project]/components/custom/smart-chart.tsx",
                        lineNumber: 147,
                        columnNumber: 23
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/custom/smart-chart.tsx",
                lineNumber: 142,
                columnNumber: 7
            }, this)
    }["SmartChartWrapper.useCallback[toolbarWidget]"], [
        isMobile
    ]);
    const topWidgets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SmartChartWrapper.useCallback[topWidgets]": ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartTitle"], {
                onChange: onSymbolChange
            }, void 0, false, {
                fileName: "[project]/components/custom/smart-chart.tsx",
                lineNumber: 154,
                columnNumber: 11
            }, this)
    }["SmartChartWrapper.useCallback[topWidgets]"], [
        onSymbolChange
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative h-full min-h-0 w-full overflow-clip",
        children: isReadyToMount && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$deriv$2d$com$2f$smartcharts$2d$champion$2f$dist$2f$smartcharts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SmartChart"], {
            chartControlsWidgets: null,
            chartData: chartData,
            chartStatusListener: ()=>{},
            chartType: chartType,
            clearChart: false,
            feedCall: {
                activeSymbols: false,
                tradingTimes: false
            },
            drawingToolFloatingMenuPosition: isMobile ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$smartchart$2d$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SMART_CHART_DRAWING_TOOL_POSITION"].mobile : __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$smartchart$2d$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SMART_CHART_DRAWING_TOOL_POSITION"].desktop,
            enabledChartFooter: false,
            enabledNavigationWidget: !isMobile,
            getQuotes: getQuotes,
            granularity: granularity,
            id: chartId,
            isConnectionOpened: isConnectionOpened,
            isLive: isLive,
            isMobile: isMobile,
            isVerticalScrollEnabled: false,
            ...endEpoch !== undefined && {
                endEpoch
            },
            maxTick: isMobile ? granularity === 0 ? 8 : 24 : undefined,
            onSettingsChange: ()=>{},
            settings: chartSettings,
            stateChangeListener: ()=>{},
            subscribeQuotes: subscribeQuotes,
            symbol: symbol,
            toolbarWidget: toolbarWidget,
            topWidgets: topWidgets,
            unsubscribeQuotes: unsubscribeQuotes,
            ...barriers && barriers.length > 0 && {
                barriers
            },
            contracts_array: contractsArray ?? []
        }, symbolKey, false, {
            fileName: "[project]/components/custom/smart-chart.tsx",
            lineNumber: 160,
            columnNumber: 26
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/custom/smart-chart.tsx",
        lineNumber: 159,
        columnNumber: 5
    }, this);
}
_s(SmartChartWrapper, "j9jtXQF8UoaP5DTzD/r/mgil/6I=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = SmartChartWrapper;
var _c;
__turbopack_context__.k.register(_c, "SmartChartWrapper");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/rise-fall-chart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RiseFallChart",
    ()=>RiseFallChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$smart$2d$chart$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/custom/smart-chart.tsx [app-client] (ecmascript)");
'use client';
;
;
function RiseFallChart(props) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$custom$2f$smart$2d$chart$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SmartChartWrapper"], {
        chartId: "rise-fall-chart",
        defaultGranularity: 60,
        ...props
    }, void 0, false, {
        fileName: "[project]/components/rise-fall-chart.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_c = RiseFallChart;
var _c;
__turbopack_context__.k.register(_c, "RiseFallChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/rise-fall-chart.tsx [app-client] (ecmascript, next/dynamic entry)", (function(__turbopack_context__){

__turbopack_context__.n(__turbopack_context__.i("[project]/components/rise-fall-chart.tsx [app-client] (ecmascript)"));
}),
"[project]/lib/smartchart-constants.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Positions for SmartCharts floating drawing-tools menu. */ __turbopack_context__.s([
    "SMART_CHART_DRAWING_TOOL_POSITION",
    ()=>SMART_CHART_DRAWING_TOOL_POSITION
]);
const SMART_CHART_DRAWING_TOOL_POSITION = {
    mobile: {
        x: 100,
        y: 100
    },
    desktop: {
        x: 200,
        y: 200
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0rewvng._.js.map