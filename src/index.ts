import { ProjectAddForm } from "./addprojectform";
import { App } from "./app";
import { ProjectEditForm } from "./editprojectform";
import { Action, FileService, fromJson, IFile, IProject, toJson } from "./file";
import "./index.scss";
import { PhaseForm } from "./phaseform";
import { Action as RenderAction, Renderer } from "./render";
import { IState } from "./state";
import { Store } from "./store";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js");
    });
}

const rsFile: IFile = fromJson(localStorage.getItem("rsFile") || "{\"projects\": []}");
const store = new Store<IState>({ file: rsFile });
const fileService = new FileService(store);
const addProjectForm = new ProjectAddForm(store, fileService, document.forms.namedItem("add_project_form"));
const editProjectForm = new ProjectEditForm(store, fileService, document.forms.namedItem("edit_project_form"));
const phaseForm = new PhaseForm(store, fileService, document.forms.namedItem("phase_form"));
const renderer = new Renderer(store, phaseForm);
const appl = new App(renderer, phaseForm, editProjectForm, fileService, store);

const storeFile = () => {
    const json = toJson(store.state.file);
    localStorage.setItem("rsFile", json);
    return json;
};

function addProject(e: CustomEvent<IProject>) {
    renderer.renderProject(e.detail);
    storeFile();
}

const restart = () => {
    store.state.file = fromJson(storeFile());
    document.querySelector("svg").remove();
    appl.start();
};

const fileOpened = (e: CustomEvent<IFile>) => {
    store.state.file = e.detail;
    restart();
};

store.addEventListener(Action.FileOpened, fileOpened);
store.addEventListener(Action.ProjectAdded, addProject);
store.addEventListener(Action.PhaseUpdated, storeFile);
store.addEventListener(Action.ProjectUpdated, restart);
store.addEventListener(Action.PhaseDeleted, restart);
store.addEventListener(Action.PhaseAdded, restart);
store.addEventListener(Action.PhaseUpdated, renderer.reRenderPhase);
store.addEventListener(RenderAction.PhaseDragged, (e: CustomEvent) => {
    const { phase, begin, end } = e.detail;
    fileService.updatePhase(phase, { name: phase.name, begin, end });
});

appl.start();
