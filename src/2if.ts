interface TagName extends String {}

interface Component {
  (...inputs: any[]): JSX.Element | undefined;
}

interface ComponentDefinition {
  tagName: TagName;
  closure: Component;
}

interface ComponentInstance {
  definition: ComponentDefinition;
  element: JSX.Element;
  originalInnerHTML?: string;
  inputs?: any[];
  privates?: any[];
  //children: ComponentInstance[];
  parent: ComponentInstance;
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
  return (() => undefined) as Component;
}

async function loadComponent(tagName: TagName): Promise<ComponentDefinition> {
  const promiseOfClosure = loadingComponents.get(tagName) || fetchModule(tagName);
  const closure = await promiseOfClosure;
  const definition: ComponentDefinition = { tagName, closure };
  loadedComponents.set(tagName, definition);
  loadingComponents.delete(tagName); // fulfilled promise no longer needed; free the memory
  return definition;
}

// decides if we're going the sync or async route
function isComponentLoaded(tagName: TagName): ComponentDefinition | undefined {
  return loadedComponents.get(tagName);
}

function instantiateComponent(element: JSX.Element, definition: ComponentDefinition, parent: ComponentInstance): ComponentInstance {
  const componentInstance: ComponentInstance = { definition, element, parent, inputs: [], privates: [], originalInnerHTML: element.innerHTML };
  //render(componentInstance);
  return componentInstance;
}

function render(instance: ComponentInstance): void {
  let htmlElement = instance.definition.closure(instance.inputs, instance.privates);
  if (instance.originalInnerHTML) htmlElement = htmlElement.replace(innerHtmlRegex, instance.originalInnerHTML);
  instance.element.innerHTML = htmlElement;
}

// build component tree ///

function scan(element: JSX.Element, tree: ComponentInstance): Promise<any> {
  const tagName = element.tagName;
  if (!tagName.includes("-")) return scanChildren(element, tree);
  const definition = isComponentLoaded(tagName);
  if (definition) return instantiateAndScan(element, tree, definition);
  return loadComponent(tagName).then(def => instantiateAndScan(element, tree, def));
}

function instantiateAndScan(element: JSX.Element, tree: ComponentInstance, definition: ComponentDefinition): Promise<any> {
  const newInstance = instantiateComponent(element, definition, tree);
  return scanChildren(element, newInstance);
}

function scanChildren(parentElement: JSX.Element, parentTreeNode: ComponentInstance): Promise<any> {
  return Promise.all(Array.from(parentElement.children).map(htmlEl => scan(htmlEl as HTMLElement, parentTreeNode)));
}

// go ///////////

console.log("2if bootstrapping");

const treeRoot: ComponentInstance = { element: document.body, definition: { tagName: document.body.tagName, closure: () => undefined } } as any;

wait().then(_ => Array.from(document.getElementsByTagName("f12")).map(htmlEl => scan(htmlEl as HTMLElement, treeRoot).then(() => render(treeRoot))));
