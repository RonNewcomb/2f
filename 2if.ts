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
  const promiseOfModule = import(`./components/${tag}.js`).catch(_ => undefined);
  loadingComponents.set(tag, promiseOfModule);
  const module = await promiseOfModule;
  if (module && module.default) return module.default as Component;
  console.error(`${tag}.js should have a default export function`);
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

wait().then(_ => Array.from(document.getElementsByTagName("2f")).map(scan));
