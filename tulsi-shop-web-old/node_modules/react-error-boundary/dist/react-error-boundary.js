"use client";
import { createContext as l, useMemo as h, createElement as i, Component as y, useContext as p, useState as E, forwardRef as B } from "react";
const f = l(null);
function m({
  children: r,
  didCatch: e,
  error: t,
  resetErrorBoundary: o
}) {
  const n = h(
    () => ({ didCatch: e, error: t, resetErrorBoundary: o }),
    [e, t, o]
  );
  return i(f.Provider, { value: n }, r);
}
const d = {
  didCatch: !1,
  error: null
};
class C extends y {
  constructor(e) {
    super(e), this.resetErrorBoundary = this.resetErrorBoundary.bind(this), this.state = d;
  }
  static getDerivedStateFromError(e) {
    return { didCatch: !0, error: e };
  }
  resetErrorBoundary(...e) {
    const { didCatch: t } = this.state;
    t && (this.props.onReset?.({
      args: e,
      reason: "imperative-api"
    }), this.setState(d));
  }
  componentDidCatch(e, t) {
    this.props.onError?.(e, t);
  }
  componentDidUpdate(e, t) {
    const { didCatch: o } = this.state, { resetKeys: n } = this.props;
    o && t.didCatch && g(e.resetKeys, n) && (this.props.onReset?.({
      next: n,
      prev: e.resetKeys,
      reason: "keys"
    }), this.setState(d));
  }
  render() {
    const { children: e, fallbackRender: t, FallbackComponent: o, fallback: n } = this.props, { didCatch: s, error: a } = this.state;
    let c = e;
    if (s) {
      const u = {
        error: a,
        resetErrorBoundary: this.resetErrorBoundary
      };
      if (typeof t == "function")
        c = t(u);
      else if (o)
        c = i(o, u);
      else if ("fallback" in this.props)
        c = n;
      else
        throw a;
    }
    return i(
      m,
      {
        didCatch: s,
        error: a,
        resetErrorBoundary: this.resetErrorBoundary
      },
      c
    );
  }
}
function g(r = [], e = []) {
  return r.length !== e.length || r.some((t, o) => !Object.is(t, e[o]));
}
function x(r) {
  return r !== null && typeof r == "object" && "didCatch" in r && typeof r.didCatch == "boolean" && "error" in r && "resetErrorBoundary" in r && typeof r.resetErrorBoundary == "function";
}
function b(r) {
  if (!x(r))
    throw new Error("ErrorBoundaryContext not found");
}
function S() {
  const r = p(f);
  b(r);
  const { error: e, resetErrorBoundary: t } = r, [o, n] = E({
    error: null,
    hasError: !1
  }), s = h(
    () => ({
      error: e,
      resetBoundary: () => {
        t(), n({ error: null, hasError: !1 });
      },
      showBoundary: (a) => n({
        error: a,
        hasError: !0
      })
    }),
    [e, t]
  );
  if (o.hasError)
    throw o.error;
  return s;
}
function w(r) {
  switch (typeof r) {
    case "object": {
      if (r !== null && "message" in r && typeof r.message == "string")
        return r.message;
      break;
    }
    case "string":
      return r;
  }
}
function R(r, e) {
  const t = B(
    (n, s) => i(
      C,
      e,
      i(r, { ...n, ref: s })
    )
  ), o = r.displayName || r.name || "Unknown";
  return t.displayName = `withErrorBoundary(${o})`, t;
}
export {
  C as ErrorBoundary,
  f as ErrorBoundaryContext,
  w as getErrorMessage,
  S as useErrorBoundary,
  R as withErrorBoundary
};
//# sourceMappingURL=react-error-boundary.js.map
