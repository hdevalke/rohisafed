import { Action, FileService, IPhase, IProject } from "./file";
import { IState } from "./state";
import { Store } from "./store";

export class ProjectAddForm {

    private readonly name: HTMLInputElement;
    private readonly begin: HTMLInputElement;
    private readonly color: HTMLInputElement;
    private readonly end: HTMLInputElement;
    private readonly cancel: HTMLInputElement;

    constructor(private readonly store: Store<IState>,
                private readonly fileService: FileService,
                private readonly form: HTMLFormElement) {
        this.name = form.elements.namedItem("name") as HTMLInputElement;
        this.begin = form.elements.namedItem("begin") as HTMLInputElement;
        this.end = form.elements.namedItem("end") as HTMLInputElement;
        this.cancel = form.elements.namedItem("cancel") as HTMLInputElement;
        this.color = form.elements.namedItem("color") as HTMLInputElement;
        form.onsubmit = this.onsubmit;
        this.cancel.onclick = (e) => {
            this.form.parentElement.style.display = "none";
        };
    }

    public clearValues() {
        this.name.value = null;
        this.begin.value = null;
        this.end.value = null;
    }

    private onsubmit = () => {
        const phase = {
            begin: this.begin.valueAsDate,
            end: this.end.valueAsDate,
        };
        this.fileService.addProject(this.store.state.file, this.name.value, this.color.value, [phase]);
        this.form.parentElement.style.display = "none";
        this.clearValues();
        return false;
    }
}
