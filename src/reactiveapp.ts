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

interface AppOptions {
    title?: string,
    template: string
};

export default class ReactiveApp {
    private _title: string;
    private _template: string;
    private _componentsIds: string[];

    constructor(options: AppOptions) {
        this._title = options?.title ?? 'Untitled';
        this._template = options?.template ?? '';
        this._componentsIds = [];

        window.reactiveApp = this;
    }

    mount(rootSel: string) {
        const rootEl: HTMLDivElement = document.querySelector(rootSel) as HTMLDivElement;

        if (!rootEl) {
            throw new Error('There is not root element with given selector!');
        }

        document.title = this._title;
        rootEl.innerHTML = this._template;
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
    private _parentSel: string;
    private _id: string;
    private _name: string;
    private _params: Data;
    private _data: Data;
    private _components: ReactiveComponent[];

    constructor(parentSel: string, name: string, params: Data = {}) {
        this._parentSel = parentSel;
        this._id = window.reactiveApp.registerComponentId(this);
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
        const parentEl: HTMLElement = document.querySelector(this._parentSel) as HTMLElement;
        // TODO: Empty parent container

        parentEl.innerHTML = this._id;

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