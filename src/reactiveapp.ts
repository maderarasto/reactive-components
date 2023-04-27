declare global {
    interface Window {
        reactiveApp: ReactiveApp;
    }
}

function generateIdNumber(): string {
    const minId = 1000;
    const maxId = 9999;

    return Math.floor(minId + (maxId - minId) * Math.random()).toString();
}

type ComponentClass = { 
    new (
        parentEl: HTMLElement,
        name: string,
        params: Data,
    ): ReactiveComponent
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

        this._rootComponent = new this._rootComponentCls(rootEl, this._rootComponentCls.name, {});
        this._rootComponent.render();

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

export interface Data {
    [key: string]: any
}

export abstract class ReactiveComponent {
    private _parentEl: HTMLElement;
    //private _id: string;
    private _name: string;
    private _params: Data;
    private _data: Data;
    private _components: ReactiveComponent[];

    constructor(parentEl: HTMLElement, name: string, params: Data = {}) {
        this._parentEl = parentEl;
        //this._id = window.reactiveApp.registerComponentId(this);
        this._name = name;
        this._params = params;
        this._components = [];
        this._data = new Proxy(this._initData(), {
            get(target: Data, prop: string | symbol): boolean {
                return Reflect.get(target, prop);
            },

            set(target: Data, prop: string | symbol, value: any): boolean {
                console.log('re-render');
                return Reflect.set(target, prop, value);
            }
        });
    }

    public get name(): string {
        return this._name;
    }

    public get params(): Data {
        return this._params;
    }

    protected get data(): Data {
        return this._data;
    }

    public render(): void {
        const htmlDoc = new DOMParser().parseFromString(this._template(), 'text/html');
        let elements: HTMLCollection = htmlDoc.body.children;

        // let current = 0;
        while (elements.length > 0) {
            // const element: HTMLElement = elements.item(current) as HTMLElement;
        }

        this._components.forEach((component: ReactiveComponent) => {
            component.render();
        });
    }

    // Reactive hooks
    beforeMount(): void {}
    afterMount(): void {}
    afterDestroy(): void {}

    protected abstract _template(): string;
    protected abstract _initData(): Data;
    protected abstract _usedComponents(): ReactiveComponent[];
}