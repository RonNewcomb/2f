/// import all of tsx-dom

function transferKnownProperties(source: Record<string, any>, target: Record<string, any>): void {
  for (const key of Object.keys(source)) {
    if (key in target) target[key] = source[key];
  }
}

function setAttributes(element: Element, attrs: Record<string, any>): void {
  for (const name of Object.keys(attrs)) {
    const value = attrs[name];
    if (name.startsWith("on")) {
      const finalName = name.replace(/Capture$/, "");
      const useCapture = name !== finalName;
      const eventName = finalName.toLowerCase().substring(2);
      element.addEventListener(eventName, value, useCapture);
    } else if (name === "style" && typeof value !== "string") {
      // Special handler for style with a value of type CSSStyleDeclaration
      transferKnownProperties(value, element.style);
    } else if (name === "dangerouslySetInnerHTML") element.innerHTML = value;
    else if (value === true) element.setAttribute(name, name);
    else if (value || value === 0) element.setAttribute(name, value.toString());
  }
}

function applyChild(element: Element, child: Element | string): void {
  if (child instanceof Element) element.appendChild(child);
  else if (typeof child === "string" || typeof child === "number") element.appendChild(document.createTextNode(child.toString()));
  else console.warn("Unknown type to append: ", child);
}
function applyChildren(element: Element, children: any[]): void {
  for (const child of children) {
    if (!child && child !== 0) continue;
    if (Array.isArray(child)) applyChildren(element, child);
    else applyChild(element, child);
  }
}

function createDomElement(tag: string, attrs: Record<string, any>) {
  const options = (attrs === null || attrs === void 0 ? void 0 : attrs.is) ? { is: attrs.is } : undefined;
  if (attrs === null || attrs === void 0 ? void 0 : attrs.xmlns) return document.createElementNS(attrs.xmlns, tag, options);
  return document.createElement(tag, options);
}

function jsx(tag: Function, props: Record<string, any>): Element {
  if (typeof tag === "function") return tag(props);
  const { children, ...attrs } = props;
  const element = createDomElement(tag, attrs);
  if (attrs) setAttributes(element, attrs);
  applyChildren(element, [children]);
  return element;
}

function createElement(tag: Function | string, attrs: Record<string, any>, ...children: any[]): Element {
  if (typeof tag === "function") return tag({ ...attrs, children });
  const element = createDomElement(tag, attrs);
  if (attrs) setAttributes(element, attrs);
  applyChildren(element, children);
  return element;
}

const foodiv = createElement("div", {});

///////

interface TagName extends String {}

interface RenderedComponent {}

interface Component {
  (...inputs: any[]): RenderedComponent;
}

interface ComponentDefinition {
  closure: Component;
}

interface ComponentInstance {
  definition: ComponentDefinition;
  element: Element;
  originalInnerHTML?: string;
  inputs?: any[];
  privates?: any[];
}

// static data /////////////////////////////////

const innerHtmlRegex = new RegExp("{innerHTML}", "g");
const loadingComponents = new Map<TagName, Promise<Component>>();
const loadedComponents = new Map<TagName, ComponentDefinition>();
export const wait = (milliseconds?: number) => new Promise(r => setTimeout(r, milliseconds));

// initialization /////////////////////////////////////////////////

async function fetchModule(tag: TagName): Promise<Component> {
  const promiseOfModule = import(`./components/${tag}.js`).catch(console.error);
  loadingComponents.set(tag, promiseOfModule);
  const module = await promiseOfModule;
  if (module && module.default) return module.default as Component;
  console.error({ [tag as string]: module, error: `${tag}.js should have a default export function` });
  return (() => "") as Component;
}

async function loadComponent(tagName: TagName): Promise<ComponentDefinition> {
  const promiseOfClosure = loadingComponents.get(tagName) || fetchModule(tagName);
  const closure = await promiseOfClosure;
  const definition: ComponentDefinition = { closure };
  loadedComponents.set(tagName, definition);
  loadingComponents.delete(tagName); // fulfilled promise no longer needed; free the memory
  return definition;
}

// decides if we're going the sync or async route
function isComponentLoaded(tagName: TagName): ComponentDefinition | undefined {
  return loadedComponents.get(tagName);
}

// given a custom element: load from server, cache it, instantiate it,
async function loadAndInstantiateComponent(element: Element): Promise<ComponentInstance> {
  const tagName = element.tagName;
  const definition = isComponentLoaded(tagName) || (await loadComponent(tagName));
  return instantiateComponent(element, definition);
}

function instantiateComponent(element: Element, definition: ComponentDefinition): ComponentInstance {
  const componentInstance: ComponentInstance = { definition, element };
  componentInstance.originalInnerHTML = element.innerHTML;
  render(componentInstance);
  return componentInstance;
}

function render(instance: ComponentInstance): void {
  let html = instance.definition.closure(instance.inputs, instance.privates);
  if (instance.originalInnerHTML) html = html.replace(innerHtmlRegex, instance.originalInnerHTML);
  instance.element.innerHTML = html;
}

// build component tree ///

async function scan(element: Element): Promise<ComponentInstance | undefined> {
  const tagName = element.tagName;
  let instance: ComponentInstance | undefined = undefined;
  if (tagName.includes("-")) {
    const loadedDefinition = isComponentLoaded(tagName);
    if (!loadedDefinition)
      return loadAndInstantiateComponent(element).then(componentInstance => {
        scanChildren(element);
        return componentInstance;
      });
    instance = instantiateComponent(element, loadedDefinition);
  }
  scanChildren(element);
  return instance;
}

function scanChildren(element: Element) {
  const childs = Array.from(element.children).map(scan);
  return Promise.all(childs);
}

// go ///////////

console.log("2if bootstrapping");

wait().then(_ => Array.from(document.getElementsByTagName("f12")).map(scan));
