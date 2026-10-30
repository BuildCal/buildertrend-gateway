// In-page DOM readers. Plain JS strings, never functions: tsx/esbuild wraps
// compiled functions with a `__name` helper that does not exist in the page.
// They read labels and control types only, never field values.

export interface FieldInfo {
  label: string;
  type: string;
  /** name / id attribute with digits templated, when present. */
  name?: string;
}

/** Visible modal / drawer / dropdown roots, innermost last. */
export const OVERLAY_SELECTOR =
  ".ant-modal-wrap:not([style*='display: none']) .ant-modal, .ant-drawer-open .ant-drawer-content, .ant-popover:not(.ant-popover-hidden)";

const scopeExpr = (scope: string | null) =>
  scope ? `([...document.querySelectorAll(${JSON.stringify(scope)})].pop() || null)` : "document";

/** Form controls in a scope: label + type (+ templated name). */
export function fieldsJs(scope: string | null): string {
  return `(() => {
  const root = ${scopeExpr(scope)};
  if (!root) return [];
  const vis = (e) => !!(e.offsetParent || e.getClientRects().length);
  const clean = (t) => (t || "").replace(/\\s+/g, " ").replace(/[*:]+$/, "").trim().slice(0, 80);
  const labelOf = (e) => {
    const item = e.closest(".ant-form-item, .form-group, [class*='FormItem'], [class*='form-item']");
    const l = item && item.querySelector(".ant-form-item-label, label, [class*='label' i]");
    if (l && clean(l.textContent)) return clean(l.textContent);
    if (e.id) { const f = document.querySelector('label[for="' + CSS.escape(e.id) + '"]'); if (f && clean(f.textContent)) return clean(f.textContent); }
    return clean(e.getAttribute("aria-label") || e.getAttribute("placeholder") || e.getAttribute("title") || e.getAttribute("name") || "");
  };
  const typeOf = (e) => {
    if (e.closest(".ant-select")) return "select";
    if (e.closest(".ant-picker")) return "date";
    if (e.closest(".ant-checkbox-wrapper, .ant-switch") || e.type === "checkbox") return "checkbox";
    if (e.type === "radio" || e.closest(".ant-radio-group")) return "radio";
    if (e.isContentEditable || e.closest(".ql-editor, .fr-element, [contenteditable=true]")) return "richtext";
    if (e.tagName === "TEXTAREA") return "textarea";
    if (e.closest(".ant-input-number")) return "number";
    if (e.closest(".ant-upload")) return "file";
    return (e.getAttribute("type") || "text").toLowerCase();
  };
  const seen = new Set();
  const out = [];
  const els = root.querySelectorAll("input:not([type=hidden]), textarea, .ant-select, .ant-switch, [contenteditable=true]");
  for (const e of els) {
    if (e.closest("header, nav, .JobPickerContainer, #reactJobPicker")) continue;
    const el = e.classList && e.classList.contains("ant-select") ? (e.querySelector("input") || e) : e;
    if (!vis(e)) continue;
    const label = labelOf(el);
    const type = typeOf(el);
    if (!label) continue;
    const name = (el.getAttribute("name") || el.id || "").replace(/\\d+/g, "{n}").slice(0, 60) || undefined;
    const key = label + "|" + type;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, type, name });
  }
  // Grid / line-item table column headers are data points too.
  for (const th of root.querySelectorAll("th, [role=columnheader]")) {
    if (!vis(th) || th.closest("header, nav, .JobPickerContainer")) continue;
    const label = clean(th.innerText || th.getAttribute("title") || "");
    if (!label || label.length > 60 || seen.has(label + "|column")) continue;
    seen.add(label + "|column");
    out.push({ label, type: "column" });
  }
  return out.slice(0, 400);
})()`;
}

/** Labels of every visible clickable control in a scope (buttons, triggers, menu items). */
export function buttonLabelsJs(scope: string | null): string {
  return `(() => {
  const root = ${scopeExpr(scope)};
  if (!root) return [];
  const vis = (e) => !!(e.offsetParent || e.getClientRects().length);
  const out = [];
  for (const e of root.querySelectorAll("button, [role=button], .ant-dropdown-trigger, a.BTLink:not([href^='/app/']):not([href^='http'])")) {
    if (!vis(e) || e.disabled || e.closest("header, nav, .ant-menu, [role=tablist], .JobPickerContainer, #reactJobPicker")) continue;
    const t = (e.innerText || e.getAttribute("aria-label") || e.getAttribute("title") || "").replace(/\\s+/g, " ").trim().slice(0, 60);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 120);
})()`;
}

/** Options of the currently open ant-select dropdown (labels only). */
export const OPEN_SELECT_OPTIONS_JS = `(() => {
  const dd = [...document.querySelectorAll(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")].pop();
  if (!dd) return null;
  return [...dd.querySelectorAll(".ant-select-item-option, .ant-select-tree-treenode, [role=option]")]
    .map((o) => (o.innerText || o.getAttribute("title") || "").replace(/\\s+/g, " ").trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 60);
})()`;

/** Items of the currently open action dropdown ("…" menus). */
export const OPEN_MENU_ITEMS_JS = `(() => {
  const dd = [...document.querySelectorAll(".ant-dropdown:not(.ant-dropdown-hidden)")].pop();
  if (!dd) return [];
  return [...dd.querySelectorAll("[role=menuitem], .ant-dropdown-menu-item")]
    .map((o) => (o.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 60))
    .filter(Boolean);
})()`;

/** Generic error / not-found phrases. Only the matched phrase leaves the page. */
export const ERROR_PAGE_PATTERN =
  "page not found|something went wrong|an error (?:has )?occurred|does(?:n't| not) exist|has been deleted|no longer (?:exists|available)|could not (?:be )?(?:found|load)|unable to (?:load|find)|you (?:do not|don't) have (?:access|permission)|not authori[sz]ed|invalid (?:url|link|request)";

/** The error phrase the page shows (main content only), or "". */
export const ERROR_PAGE_JS = `(() => {
  const root = document.querySelector("main, [role=main], #root") || document.body;
  const text = (root.innerText || "").slice(0, 4000);
  const m = text.match(new RegExp(${JSON.stringify(ERROR_PAGE_PATTERN)}, "i"));
  return m ? m[0].toLowerCase() : "";
})()`;

export const OVERLAY_COUNT_JS = `[...document.querySelectorAll(${JSON.stringify(OVERLAY_SELECTOR)})].length`;

/**
 * Label for every `.ant-select:not(.ant-select-disabled)` in the scope, in DOM
 * order (matches Playwright's nth()). Empty string when no label is found.
 */
export function selectLabelsJs(scope: string | null): string {
  return `(() => {
  const root = ${scopeExpr(scope)};
  if (!root) return [];
  const clean = (t) => (t || "").replace(/\\s+/g, " ").replace(/[*:]+$/, "").trim().slice(0, 80);
  return [...root.querySelectorAll(".ant-select:not(.ant-select-disabled)")].map((e) => {
    const item = e.closest(".ant-form-item, .form-group, [class*='FormItem'], [class*='form-item']");
    const l = item && item.querySelector(".ant-form-item-label, label");
    if (l && clean(l.textContent)) return clean(l.textContent);
    const input = e.querySelector("input");
    if (input && input.id) { const f = document.querySelector('label[for="' + CSS.escape(input.id) + '"]'); if (f && clean(f.textContent)) return clean(f.textContent); }
    const ph = e.querySelector(".ant-select-selection-placeholder");
    return clean((ph && ph.textContent) || e.getAttribute("aria-label") || (input && input.getAttribute("aria-label")) || "");
  });
})()`;
}
