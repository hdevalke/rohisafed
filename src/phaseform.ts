import { FileService, IPhase } from "./file";
import { IState } from "./state";
import { Store } from "./store";

enum Action {
    Add,
    Update,
    Delete,
}
export class PhaseForm {
    private phase: IPhase;
    private action: Action;
    private readonly name: HTMLInputElement;
    private readonly begin: HTMLInputElement;
    private readonly end: HTMLInputElement;
    private readonly cancel: HTMLInputElement;
    private readonly edit: HTMLInputElement;
    private readonly delete: HTMLInputElement;
    private readonly projects: HTMLSelectElement;

    constructor(private readonly store: Store<IState>,
                private readonly fileService: FileService,
                private readonly form: HTMLFormElement) {
        this.name = form.elements.namedItem("name") as HTMLInputElement;
        this.begin = form.elements.namedItem("begin") as HTMLInputElement;
        this.end = form.elements.namedItem("end") as HTMLInputElement;
        this.cancel = form.elements.namedItem("cancel") as HTMLInputElement;
        this.delete = form.elements.namedItem("delete") as HTMLInputElement;
        this.edit = form.elements.namedItem("edit") as HTMLInputElement;
        this.projects = form.elements.namedItem("project") as HTMLSelectElement;
        form.onsubmit = this.onsubmit;
        this.cancel.onclick = (e) => {
            this.form.parentElement.style.display = "none";
        };
        this.delete.onclick = (e) => {
            this.form.parentElement.style.display = "none";
            this.fileService.deletePhase(this.phase);
        };
    }

    public show(phase: IPhase) {
        this.action = Action.Update;
        this.phase = phase;
        this.projects.parentElement.style.display = "none";
        this.name.value = phase.name ? phase.name : null;
        this.begin.valueAsDate = phase.begin;
        this.end.valueAsDate = phase.end;
        this.form.parentElement.style.display = "block";
    }

    public add() {
        this.action = Action.Add;
        this.phase = null;
        this.name.value = null;
        this.begin.valueAsDate = null;
        this.end.valueAsDate = null;
        this.projects.options.length = 0;
        this.store.state.file.projects
            .map((p) => {
                return new Option(p.name, p.i.toString());
            })
            .forEach((o) => this.projects.options.add(o));
        this.projects.parentElement.style.display = "inline-flex";
        this.form.parentElement.style.display = "block";
    }

    private onsubmit = () => {
        if (this.action === Action.Update) {
            const name = this.name.value;
            const begin = this.begin.valueAsDate;
            const end = this.end.valueAsDate;
            this.fileService.updatePhase(this.phase, {name, begin, end});
        } else if (this.action === Action.Add) {
            const option = this.projects.selectedOptions.item(0);
            const project = this.store.state.file.projects[parseInt(option.value, 10)];
            const begin = this.begin.valueAsDate;
            const end = this.end.valueAsDate;
            const name = this.name.value;
            this.fileService.addPhase(project, {name, begin, end});
        }
        this.form.parentElement.style.display = "none";
        return false;
    }
}
