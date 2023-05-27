import {ReactiveComponent} from '../reactiveapp';
import { ReactiveData, ComponentClass } from '../types';

export default class App extends ReactiveComponent {
    protected _template(): string {
        return `
            <div id="app">
                <h1>${this.data.header}</h1>
            </div>
        `;
    }

    protected _initData(): ReactiveData {
        return {
            header: 'Application'
        }
    }

    protected _usedComponents(): ComponentClass[] {
        return [

        ];
    }

    public afterMount(): void {
        console.log('timeout');
        setTimeout(() => {
            this.data.header = 'New App'
        }, 3000);
    }
}