import {Data, ReactiveComponent} from '../reactiveapp';

export default class App extends ReactiveComponent {
    protected _template(): string {
        return `
            <div id="app" style="width:100%">
                <h1>${this.data.header}</h1>
            </div>
        `;
    }

    protected _initData(): Data {
        return {
            header: 'Application'
        }
    }

    protected _usedComponents(): ReactiveComponent[] {
        return [

        ];
    }

}