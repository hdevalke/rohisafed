import { IState } from "./state";
import { Store } from "./store";

export interface IPhase {
    i: number;
    name?: string;
    begin: Date;
    end: Date;
    project: IProject;
}

export interface IProject {
    i: number;
    name: string;
    phases: IPhase[];
}

export interface IFile {
    projects: IProject[];
}

export enum Action {
    FileOpened = "file_open",
    ProjectAdded = "project_add",
    ProjectDel = "project_del",
    PhaseAdded = "phase_add",
    PhaseDeleted = "phase_delete",
    PhaseUpdated = "phase_update",
}

export class FileService {

    constructor(private readonly store: Store<IState>) { }

    public openFile(file: File) {
        const reader = new FileReader();
        // TODO emit event and act upon it.
        reader.onload = () => {
            const detail = fromJson(reader.result);
            this.store.dispatchEvent(new CustomEvent(Action.FileOpened, { detail }));
        };
        reader.readAsText(file);
    }

    public addPhase(project: IProject, newPhase: { name?: string, begin: Date, end: Date }) {
        const phase: IPhase = {
            ...newPhase,
            i: project.phases.length,
            project,
        };
        this.store.dispatchEvent(new CustomEvent(Action.PhaseAdded, { detail: phase }));
    }

    public updatePhase(phase: IPhase, params: { name?: string, begin?: Date, end?: Date }) {
        phase.name = params.name;
        phase.begin = params.begin;
        phase.end = params.end;
        this.store.dispatchEvent(new CustomEvent(Action.PhaseUpdated, { detail: phase }));
    }

    public deletePhase(phase: IPhase) {
        const project = phase.project;
        project.phases.splice(phase.i, 1);
        project.phases.forEach((p, i) => {
            p.i = i;
        });
        this.store.dispatchEvent(new CustomEvent(Action.PhaseDeleted, { detail: phase }));
    }

    public addProject(file: IFile, name: string, phases?: Array<{ name?: string, begin: Date, end: Date }>) {
        const project: IProject = {
            i: file.projects.length,
            name,
            phases: [],
        };
        if (phases) {
            phases.map((p, i) => {
                return {
                    ...p,
                    i,
                    project,
                };
            }).forEach((p) => project.phases.push(p));
        }
        file.projects.push(project);
        this.store.dispatchEvent(new CustomEvent(Action.ProjectAdded, { detail: project }));
    }
}

export const fromJson = (json: string) => {
    return JSON.parse(json, (k, v) => {
        if (k === "projects") {
            const projects = v as IProject[];
            let i = 0;
            for (const project of projects) {
                project.i = i;
                let j = 0;
                for (const phase of project.phases) {
                    phase.i = j;
                    phase.project = project;
                    phase.begin = new Date(phase.begin);
                    phase.end = new Date(phase.end);
                    j++;
                }
                i++;
            }
        }
        return v;
    });
};

export const toJson = (file: IFile) => {
    const json = JSON.stringify(file,
        (k, v) => {
            if (k === "project" || k === "i") {
                return undefined;
            }
            return v;
        }, 2);
    return json;
};
