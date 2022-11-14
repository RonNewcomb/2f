export interface TsxConfig {
  [s: string]: boolean;
}

// Returns TIF if T is specified as true in TsxConfig, otherwise TELSE
type IfTsxConfig<T extends string, TIF, TELSE> = TsxConfig[T] extends false ? TELSE : TIF;

type IntrinsicElementsCombined = IfTsxConfig<"html", IntrinsicElementsHTML, unknown> & IfTsxConfig<"svg", IntrinsicElementsSVG, unknown>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // @ts-ignore // Return type of jsx syntax
    type Element = IfTsxConfig<"html", HTMLElement, never> | IfTsxConfig<"svg", SVGElement, never>;

    // The property name to use
    interface ElementAttributesProperty {
      props: unknown;
    }

    // The children name to use
    interface ElementChildrenAttribute {
      children: unknown;
    }

    // The available string tags
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface IntrinsicElements extends IntrinsicElementsCombined {}
  }
}

import type { EventAttributes, StyleAttributes, SVGAttributes, HTMLAttributes } from "tsx-dom-types";

export type ComponentChild = ComponentChild[] | JSX.Element | string | number | boolean | undefined | null;
export type ComponentChildren = ComponentChild | ComponentChild[];
export interface BaseProps {
  children?: ComponentChildren;
}
export type Component = (props: BaseProps) => JSX.Element;
export type ComponentAttributes = {
  [s: string]: string | number | boolean | undefined | null | StyleAttributes | EventListenerOrEventListenerObject;
};

export interface HTMLComponentProps extends BaseProps {
  dangerouslySetInnerHTML?: string;
}

export type SVGAndHTMLElementKeys = keyof SVGElementTagNameMap & keyof HTMLElementTagNameMap;
export type SVGOnlyElementKeys = Exclude<keyof SVGElementTagNameMap, SVGAndHTMLElementKeys>;
export type IntrinsicElementsHTML = {
  [TKey in keyof HTMLElementTagNameMap]?: HTMLAttributes & HTMLComponentProps & EventAttributes<HTMLElementTagNameMap[TKey]>;
};
export type IntrinsicElementsSVG = {
  [TKey in SVGOnlyElementKeys]?: SVGAttributes & HTMLComponentProps & EventAttributes<SVGElementTagNameMap[TKey]>;
};

export type IntrinsicElementsHTMLAndSVG = IntrinsicElementsHTML & IntrinsicElementsSVG;

function applyChild(element: JSX.Element, child: ComponentChild) {
  if (child instanceof Element) element.appendChild(child);
  else if (typeof child === "string" || typeof child === "number") element.appendChild(document.createTextNode(child.toString()));
  else console.warn("Unknown type to append: ", child);
}

export function applyChildren(element: JSX.Element, children: ComponentChild[]) {
  for (const child of children) {
    if (!child && child !== 0) continue;
    if (Array.isArray(child)) applyChildren(element, child);
    else applyChild(element, child);
  }
}

export function createDomElement(tag: string, attrs: ComponentAttributes | null) {
  const options = attrs?.is ? { is: attrs.is as string } : undefined;
  if (attrs?.xmlns) return document.createElementNS(attrs.xmlns as string, tag, options) as SVGElement;
  return document.createElement(tag, options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transferKnownProperties(source: any, target: any) {
  for (const key of Object.keys(source)) {
    if (key in target) target[key] = source[key];
  }
}

export function setAttributes(element: JSX.Element, attrs: ComponentAttributes) {
  for (const name of Object.keys(attrs)) {
    // Ignore some debug props that might be added by bundlers
    if (name === "__source" || name === "__self") continue;
    const value = attrs[name];
    if (name.startsWith("on")) {
      const finalName = name.replace(/Capture$/, "");
      const useCapture = name !== finalName;
      const eventName = finalName.toLowerCase().substring(2);
      element.addEventListener(eventName, value as EventListenerOrEventListenerObject, useCapture);
    } else if (name === "style" && typeof value !== "string") {
      // Special handler for style with a value of type CSSStyleDeclaration
      transferKnownProperties(value, element.style);
    } else if (name === "dangerouslySetInnerHTML") element.innerHTML = value as string;
    else if (value === true) element.setAttribute(name, name);
    else if (value || value === 0) element.setAttribute(name, value.toString());
  }
}

export function createElement(tag: string | Component, attrs: null | ComponentAttributes, ...children: ComponentChild[]): JSX.Element {
  if (typeof tag === "function") return tag({ ...attrs, children });
  const element = createDomElement(tag, attrs);
  if (attrs) setAttributes(element, attrs as ComponentAttributes);
  applyChildren(element, children);
  return element;
}

export const h = createElement;

// function jsxs means props.children is an array; otherwise, non-array
export function jsx(tag: string | Component, props: BaseProps): JSX.Element {
  if (typeof tag === "function") return tag(props);
  const { children, ...attrs } = props;
  const element = createDomElement(tag, attrs as ComponentAttributes);
  if (attrs) setAttributes(element, attrs as ComponentAttributes);
  applyChildren(element, [children]);
  return element;
}

export { jsx as jsxs, jsx as jsxDEV };
