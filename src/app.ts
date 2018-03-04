import { Action, FileService, IFile, IPhase, IProject } from "./file";
import { PhaseForm } from "./phaseform";
import { Renderer } from "./render";
import { IState } from "./state";
import { Store } from "./store";

export class App {
    constructor(private readonly renderer: Renderer,
                private readonly phaseForm: PhaseForm,
                private readonly fileService: FileService,
                private readonly store: Store<IState>) {
    }

    public start(): void {
        function downloadDataUrl(filename: string, dataUrl: string) {
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = filename;
            a.click();
        }

        const download: HTMLInputElement = document.querySelector("#download");
        download.onclick = () => {
            const file = localStorage.getItem("rsFile");
            const dataUrl = `data:application/json,${file}`;
            downloadDataUrl("rsFile.rohisafed", dataUrl);
        };

        const upload: HTMLInputElement = document.querySelector("#upload");
        upload.onchange = (e: Event) => {
            const input = event.target as HTMLInputElement;
            if (input.files[0]) {
                const file = input.files[0];
                this.fileService.openFile(file);
            }
        };
        const saveSvg: HTMLInputElement = document.querySelector("#save_svg");
        saveSvg.onclick = () => {
            const dataUrl = "data:image/svg+xml;utf8,"
                + encodeURIComponent(document.querySelector("svg").outerHTML);
            downloadDataUrl("rsFile.svg", dataUrl);
        };
        const addProjectButton: HTMLInputElement = document.querySelector("#add_project");
        addProjectButton.onclick = (e: Event) => {
            document.querySelector<HTMLDivElement>("#project_form").style.display = "block";
        };
        const addPhaseButton: HTMLInputElement = document.querySelector("#add_phase");
        addPhaseButton.onclick = (e: Event) => {
            this.phaseForm.add();
        };
        this.renderer.render();
    }

    private updateFile() {
        localStorage.setItem("rsFile", JSON.stringify(this.store.state.file));
    }

}
