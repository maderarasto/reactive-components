export interface Data {
    [key: string]: any
}

export default abstract class ReactiveComponent {
    private _name: string;
    private _params: Data;
    private _data: Data;

    constructor(name: string, params: Data = {}) {
        this._name = name;
        this._params = params;
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

    // Reactive hooks
    beforeMount(): void {}
    afterMount(): void {}
    afterDestroy(): void {}

    protected abstract _template(): string;
    protected abstract _initData(): Data;
}