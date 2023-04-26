interface AppOptions {
    title?: string,
    template: string
};

export default class ReactiveApp {
    private _title: string;
    private _template: string;

    constructor(options: AppOptions) {
        this._title = options?.title ?? 'Untitled';
        this._template = options?.template ?? '';
    }

    mount(rootSel: string) {
        const rootEl: HTMLDivElement = document.querySelector(rootSel) as HTMLDivElement;

        if (!rootEl) {
            throw new Error('There is not root element with given selector!');
        }

        document.title = this._title;
        rootEl.innerHTML = this._template;
    }
}