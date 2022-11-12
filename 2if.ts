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
}

// static data /////////////////////////////////

const innerHtmlRegex = new RegExp(`{innerHTML}`, "g");
const loadingComponents = new Map<TagName, Promise<Component>>();
const loadedComponents = new Map<TagName, ComponentDefinition>();
export const wait = (milliseconds?: number) => new Promise(r => setTimeout(r, milliseconds));

// initialization /////////////////////////////////////////////////

async function fetchModule(tag: TagName): Promise<Component> {
  const exported = await import(`./components/${tag}.js`).catch(_ => undefined);
  if (!exported || !exported.default) console.error(`${tag}.js should have a default export function`);
  return exported.default || (() => "");
}

async function load(tag: TagName) {
  const promiseOfModule = fetchModule(tag);
  loadingComponents.set(tag, promiseOfModule);
  return promiseOfModule;
}

async function loadComponent(tagName: TagName): Promise<ComponentDefinition> {
  const promiseOfClosure = loadingComponents.get(tagName) || load(tagName);
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

function render(component: ComponentInstance): void {
  const inputs: any[] = [];
  const privateInputs: any[] = [];
  let html = component.definition.closure(inputs, privateInputs);
  if (component.originalInnerHTML) html = html.replace(innerHtmlRegex, component.originalInnerHTML);
  component.element.innerHTML = html;
}

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

interface ComponentInstanceTree {
  instance: ComponentInstance;
  inputs: any[];
  privates: any[];
}

let portals: ComponentInstanceTree[] = [];
wait().then(_ => {
  portals = Array.from(document.getElementsByTagName("2f"));
  return portals.map(scan);
});
