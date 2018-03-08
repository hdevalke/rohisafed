import { FileService } from "./file";
import { IState } from "./state";
import { Store } from "./store";

export class ProjectEditForm {

    private readonly name: HTMLInputElement;
    private readonly color: HTMLInputElement;
    private readonly cancel: HTMLInputElement;
    private readonly projects: HTMLSelectElement;

    constructor(private readonly store: Store<IState>,
                private readonly fileService: FileService,
                private readonly form: HTMLFormElement) {
        this.name = form.elements.namedItem("name") as HTMLInputElement;
        this.cancel = form.elements.namedItem("cancel") as HTMLInputElement;
        this.color = form.elements.namedItem("color") as HTMLInputElement;
        this.projects = form.elements.namedItem("project") as HTMLSelectElement;
        this.projects.onchange = (ev: Event) => {
            const project = this.store.state.file.projects[this.projects.selectedIndex];
            this.name.value = project.name;
            this.color.value = project.color;
        };
        form.onsubmit = this.onsubmit;
        this.cancel.onclick = (e) => {
            this.form.parentElement.style.display = "none";
        };
    }

    public open() {
        this.projects.options.length = 0;
        // this.projects.options.add(new HTMLOptGroupElement());
        this.store.state.file.projects
            .map((p) => {
                return new Option(p.name, p.i.toString());
            })
            .forEach((o) => this.projects.options.add(o));
        const project = this.store.state.file.projects[this.projects.selectedIndex];
        this.name.value = project.name;
        this.color.value = project.color;
        this.projects.parentElement.style.display = "inline-flex";
        this.form.parentElement.style.display = "block";
    }

    private onsubmit = () => {
        const project = this.store.state.file.projects[parseInt(this.projects.value, 10)];
        this.fileService.editProject(project, this.name.value , this.color.value);
        this.form.parentElement.style.display = "none";
        return false;
    }
}
