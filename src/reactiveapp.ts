import { BaseComponent, ComponentClass, ReactiveData } from "./types";

declare global {
    interface Window {
        reactiveApp: ReactiveApp;
    }
}

interface AppOptions {
    title?: string,
    rootComponentCls: ComponentClass
};

export default class ReactiveApp {
    private _title: string;
    private _rootComponentCls: ComponentClass;
    private _rootComponent: ReactiveComponent | null;
    private _componentsIds: string[];

    constructor(options: AppOptions) {
        this._title = options?.title ?? 'Untitled';
        this._rootComponentCls = options?.rootComponentCls;
        this._rootComponent = null;
        this._componentsIds = [];

        window.reactiveApp = this;
    }

    mount(rootSel: string) {
        const rootEl: HTMLDivElement = document.querySelector(rootSel) as HTMLDivElement;

        if (!rootEl) {
            throw new Error('There is not root element with given selector!');
        }

        this._rootComponent = new this._rootComponentCls(rootEl, this._rootComponentCls.name, {}) as ReactiveComponent;
        this._rootComponent.beforeMount();
        this._rootComponent.render();
        this._rootComponent.afterMount();

        document.title = this._title;
    }

    registerComponentId(component: ReactiveComponent) {
        let componentId = '';
        const componentNameCapitals = [...component.name.match(/[A-Z]/g) as RegExpMatchArray];
        const componentAbbSlug = componentNameCapitals.join('').toLowerCase();

        do {
            componentId = componentAbbSlug + '-' + generateIdNumber();
            
            if (this._componentsIds.includes(componentId)) {
                componentId = '';
            }
        } while (!componentId)

        this._componentsIds.push(componentId);
        return componentId;
    }
}

export abstract class ReactiveComponent implements BaseComponent {
    private _parentEl: HTMLElement;
    private _componentEl?: HTMLElement;
    private _id: string;
    private _name: string;
    private _params: ReactiveData;
    private _data: ReactiveData;
    private _components: Map<string, ReactiveComponent>;

    constructor(parentEl: HTMLElement, name: string, params: ReactiveData = {}) {
        const self = this;

        this._parentEl = parentEl;
        this._name = name;
        this._params = params;
        this._components = new Map();
        this._id = window.reactiveApp.registerComponentId(this);
        this._data = new Proxy(this._initData(), {
            get(target: ReactiveData, prop: string | symbol): boolean {
                return Reflect.get(target, prop);
            },

            set(target: ReactiveData, prop: string | symbol, value: any): boolean {
                self.update();
                return Reflect.set(target, prop, value);
            }
        });
    }

    public get name(): string {
        return this._name;
    }

    public get params(): ReactiveData {
        return this._params;
    }

    protected get data(): ReactiveData {
        return this._data;
    }

    protected update(): void {
        
    }

    // RENDER - PROCESS NODES
    //  ✅ process children of current node
    //    - check if current node is not registered component
    //        - ✅ create new node with given attributes
    //        - ✅ appand to target parent node
    //        - ✅ process current iteration of node with new created node as its target parent
    //        - ✅ exit process
    //    - initialize component params
    //    - create instante of component
    //    - run pre-render hooks
    //    - render component
    //    - run post-render hooks

    // UPDATE - PROCESS NODES
    //  ✅ process children of current node
    //    - check if current node is not marked as component
    //        - create new node with given attributes
    //        - check if current node is root
    //            -  prepend new node before current component root
    //        - otherwise append to target parent node
    //        - process current iteration of node with new created node as its target parent
    //        - exit process
    //    - find component instance by its id
    //    - update coponent
    //    - run post-update hook

    private renderTemplateNodes(currentNode: ChildNode, targetParentNode: ChildNode) {
        currentNode.childNodes.forEach((childNode: ChildNode) => {
            const componentCls: ComponentClass = this._usedComponents().find((cls: ComponentClass) => {
                return cls.name.toLowerCase() === childNode.nodeName.toLowerCase();
            }) as ComponentClass;

            if (!componentCls) {
                const newNode: ChildNode = this._createTemplateNode(childNode);
                targetParentNode.appendChild(newNode);
                this.renderTemplateNodes(childNode, newNode);
                return 
            }

            // Parsig HTML node attributes
            const nodeAttributes: NamedNodeMap = (childNode as HTMLElement).attributes;
            const componentParams: ReactiveData = {};
            
            for (let i = 0; i < nodeAttributes.length; i++) {
                const attr: Attr | null = nodeAttributes.item(i);
                
                if (attr) {
                    componentParams[attr.localName] = attr.value;
                }
            }

            // Initializing a new component instance
            const component: ReactiveComponent = new componentCls(
                targetParentNode as HTMLElement,
                componentCls.name,
                componentParams
            ) as ReactiveComponent;

            component.beforeMount();
            component.render();
            component.afterMount();

            this._components.set(component._id, component);
        });
    } 

    // <div class="app" data-cid="a-0001"></div>
    private updateTemplateNodes(currentNode: ChildNode, targetParentNode: ChildNode) {
        currentNode.childNodes.forEach((childNode: ChildNode) => {
            const componentId: string = (childNode as HTMLElement).getAttribute('data-cid') as string;
            const component: ReactiveComponent = this._components.get(componentId) as ReactiveComponent;

            if (!component) {
                const newNode: ChildNode = this._createTemplateNode(childNode);
                targetParentNode.appendChild(newNode);
                this.renderTemplateNodes(childNode, newNode);
                return 
            }

            component.update();
            component.afterUpdate();
        });
    }


    public render(): void {
        const parser = new DOMParser();
        const template = this._template().trim();
        const htmlDoc = parser.parseFromString(template, 'text/html');

        if (htmlDoc.body.childNodes.length > 1) {
            throw new Error('There should be just one root element!');
        }      
        
        if (htmlDoc.childNodes.item(0).nodeType === Node.TEXT_NODE) {
            throw new Error('Root element cannot be a text node!');
        }

        const componentRoot: HTMLElement = htmlDoc.body.childNodes.item(0) as HTMLElement;
        componentRoot.setAttribute('data-cid', this._id);
        
        this._processTemplateNodes(htmlDoc.body, this._parentEl, true);
    }

    private _createTemplateNode(templateNode: ChildNode): ChildNode {
        let node: ChildNode;

        if (templateNode.nodeType !== Node.TEXT_NODE) {
            const htmlNode: HTMLElement = templateNode as HTMLElement;
            const htmlEl: HTMLElement = document.createElement(htmlNode.localName);
            
            Object.keys(htmlNode.attributes).forEach((attrKey: string) => {
                const attr: Attr = htmlNode.attributes[parseInt(attrKey)];
                htmlEl.setAttribute(attr.name, attr.value);
            });

            node = htmlEl;
        } else {
            node = document.createTextNode(templateNode.textContent as string);
        }

        return node;
    }

    private _processTemplateNode(processedNode: ChildNode, targetParentNode: ChildNode, action: 'UPDATE' | 'RENDER', isRoot: boolean = false): void {
        processedNode.childNodes.forEach((currentNode: ChildNode) => {
            const componentCls: ComponentClass = this._usedComponents().find((cls: ComponentClass) => {
                return cls.name.toLowerCase() === currentNode.nodeName.toLowerCase();
            }) as ComponentClass;

            if (!componentCls) {
                const newNode: ChildNode = this._createTemplateNode(currentNode);

                if (isRoot && action === 'UPDATE') {
                    this._componentEl?.prepend(newNode);
                } else {
                    targetParentNode.appendChild(newNode);
                }

                this._processTemplateNode(currentNode, newNode, action);
                return;
            }

            // Process a component element
            let component: ReactiveComponent;

            if (action === 'UPDATE') {
                
            }
        })
    }

    // private _processTemplateNodes(traversedNode: ChildNode, targetParentNode: ChildNode, isRoot: boolean = false): void {
    //     const componentInParent = this._parentEl.querySelector(`[data-cid="${this._id}"]`);

    //     traversedNode.childNodes.forEach((node: ChildNode) => {
    //         const componentCls: ComponentClass | undefined = this._usedComponents().find((cls: ComponentClass) => {
    //             return cls.name.toLowerCase() === node.nodeName.toLowerCase();
    //         });
    
    //         if (!componentCls) {
    //             const newNode: ChildNode = this._createTemplateNode(node);

    //             if (isRoot) {
    //                 this._componentEl = newNode as HTMLElement;
    //             }

    //             if (isRoot && componentInParent) {
    //                 componentInParent.prepend(newNode);
    //                 componentInParent.remove();
    //             } else {
    //                 targetParentNode.appendChild(newNode);
    //             }
                
    //             this._processTemplateNodes(node, newNode);
    //             return;
    //         }
    
    //         // match with used components
    //         const nodeAttributes: NamedNodeMap = (node as HTMLElement).attributes;
    //         const componentParams: ReactiveData = {};
            
    //         for (let i = 0; i < nodeAttributes.length; i++) {
    //             const attr: Attr | null = nodeAttributes.item(i);
                
    //             if (attr) {
    //                 componentParams[attr.localName] = attr.value;
    //             }
    //         }
    
    //         const component: ReactiveComponent = new componentCls(
    //             targetParentNode as HTMLElement, 
    //             componentCls.name, 
    //             componentParams
    //         ) as ReactiveComponent;
    
    //         this._components.push(component);
    
    //         // Rendering and calling component hooks
    //         component.beforeMount();
    //         component.render();
    //         component.afterMount();
    //     });
    // }

    // Reactive hooks
    public beforeMount(): void {}
    public afterMount(): void {}
    public afterUpdate(): void {}
    public afterDestroy(): void {}

    protected abstract _template(): string;
    protected abstract _initData(): ReactiveData;
    protected abstract _usedComponents(): ComponentClass[];
}

function generateIdNumber(): string {
    const minId = 1000;
    const maxId = 9999;

    return Math.floor(minId + (maxId - minId) * Math.random()).toString();
}