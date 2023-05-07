export interface ReactiveData {
    [key: string]: any
}

export interface BaseComponent {
    // getter functions
    get name(): string;
    get params(): ReactiveData;

    render(): void;
};

export type ComponentClass = { 
    new (
        parentEl: HTMLElement,
        name: string,
        params: ReactiveData,
    ): BaseComponent
};