import { IFile } from "./file";

export class Store<T> extends EventTarget {

    private currentState: T;

    constructor(private initialState: T) {
        super();
        this.currentState = initialState;
    }

    get state(): T {
        return this.currentState;
    }
}
