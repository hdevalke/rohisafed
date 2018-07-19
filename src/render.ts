import * as d3 from "d3";
import { IFile, IPhase, IProject } from "./file";
import { PhaseForm } from "./phaseform";
import { IState } from "./state";
import { Store } from "./store";

export enum Action {
    PhaseDragged = "phase_dragged",
}

export class Renderer {

    private xAxis: d3.Axis<Date>;
    private gXAxis: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private plotGroup: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private phaseHeight: number;
    private dragPhaseOffsetX: number;
    private dragPhaseEnd: boolean;
    private xScale: d3.ScaleTime<number, number>;
    private yScale: d3.ScaleLinear<number, number>;
    private readonly plotMargins = {
        bottom: 30,
        left: 30,
        right: 30,
        top: 30,
    };
    constructor(private readonly store: Store<IState>, private readonly phaseForm: PhaseForm) {
        this.phaseHeight = 30;
    }

    public renderProject(project: IProject) {
        for (const phase of project.phases) {
            this.checkXScale(phase.begin, phase.end);
            const drag = d3.drag()
                .on("start", this.phaseDragStarted)
                .on("drag", this.phaseDragged)
                .on("end", this.phaseDragStopped);
            const phaseGroup = this.plotGroup.append("g")
                .call(drag)
                .datum(phase)
                .classed("phase", true)
                .attr("id", this.generatePhaseId(phase))
                .attr("transform", this.phaseGroupAttr)
                .on("dblclick", (ePhase: IPhase) => {
                    this.phaseForm.show(ePhase);
                    d3.event.stopPropagation();
                })
                .on("mousemove", this.phaseMouseMoved)
                .on("mouseout", this.phaseMouseOut);
            // rect
            phaseGroup.append("rect")
                .attr("width", this.phaseRectWidthAttr)
                .attr("height", this.phaseHeight - 2)
                .attr("fill", project.color);
            // text
            phaseGroup.append("text")
                .text(this.phaseText)
                .attr("y", this.phaseHeight - 2 - 3);
        }
    }

    public render() {
        const width = document.body.clientWidth;
        const height = 480;

        const svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("xmlns", "http://www.w3.org/2000/svg");
        svg.append("style")
            .text(`
        .phase text {
            fill: darkslategray;
            font-size: 1.2em;
            font-family: sans-serif;
        }
        .axis {
            font-size: 1.2em;
        }
        `);
        const zoom = d3.zoom().on("zoom", this.zoomed);
        svg.call(zoom);
        this.plotGroup = svg.append("g")
            .classed("plot", true)
            .attr("transform", `translate(${this.plotMargins.left},${this.plotMargins.top})`);

        const plotWidth = width - this.plotMargins.left - this.plotMargins.right;
        // const plotHeight = height - plotMargins.top - plotMargins.bottom;
        const startDomain = this.store.state.file.projects
            .map((v) => v.phases)
            .reduce((acc, cv) => {
                for (const phase of cv) {
                    if (phase.begin < acc[0]) {
                        acc[0] = phase.begin;
                    }
                    if (phase.end > acc[1]) {
                        acc[1] = phase.end;
                    }
                }
                return acc;
            }, [new Date(8.64e15), new Date(-8.64e15)]);
        this.xScale = d3.scaleTime()
            .range([0, plotWidth])
            .domain(startDomain);
        this.xAxis = d3.axisTop(this.xScale) as d3.Axis<Date>;

        this.gXAxis = this.plotGroup.append("g")
            .classed("x", true)
            .classed("axis", true)
            .call(this.xAxis);

        this.yScale = d3.scaleLinear()
            .domain([this.store.state.file.projects.length, 0])
            .range([this.store.state.file.projects.length * this.phaseHeight, 0]);
        this.store.state.file.projects.forEach(this.renderProject, this);
    }

    public reRenderPhase = (e: CustomEvent) => {
        const phase = e.detail as IPhase;
        this.checkXScale(phase.begin, phase.end);
        const g = d3.select(`#${this.generatePhaseId(phase)}`)
            .attr("transform", this.phaseGroupAttr);
        g.select("rect")
            .attr("width", this.phaseRectWidthAttr);
        g.select("text")
            .text(this.phaseText);
    }

    private generatePhaseId(phase: IPhase) {
        return `${phase.project.name.replace(/[^a-z0-9_-]/ig, "_")}_${phase.i}`;
    }

    private phaseGroupAttr = (phase: IPhase) => {
        return `translate(${this.xScale(phase.begin)}, ${this.yScale(phase.project.i) + 5})`;
    }

    private phaseRectWidthAttr = (phase: IPhase) => {
        return this.xScale(phase.end) - this.xScale(phase.begin);
    }

    private phaseText = (phase: IPhase) => {
        return phase.name
            ? `${phase.project.name} - ${phase.name}`
            : phase.project.name;
    }

    private checkXScale(begin: Date, end: Date) {
        const [beginX, endX] = this.xScale.domain();
        if (begin < beginX || end > endX) {
            this.xScale.domain([
                begin < beginX ? begin : beginX,
                end > endX ? end : endX,
            ]);
            this.gXAxis.call(this.xAxis);
            d3.selectAll(".phase")
                .attr("transform", this.phaseGroupAttr)
                .selectAll("rect")
                .attr("width", this.phaseRectWidthAttr);
        }
    }

    private zoomed = () => {
        this.plotGroup.attr("transform", d3.event.transform);
    }

    private phaseDragStarted = (phase: IPhase, i: number, nodes: SVGGElement[]) => {
        const g = nodes[i];
        g.classList.add("active");
        this.dragPhaseOffsetX = d3.mouse(nodes[i])[0];
        this.dragPhaseEnd = g.getBBox().width - this.dragPhaseOffsetX < 5;
    }

    private phaseDragStopped = (phase: IPhase, i: number, nodes: SVGGElement[]) => {
        nodes[i].classList.remove("active");
    }
    /**
     * Moves the phase when dragged. Snaps to day boundaries.
     * @param this the dragged svg element
     */
    private phaseDragged = (phase: IPhase, i: number, nodes: SVGGElement[]) => {
        // 3 possibilities. drag left, drag right, drag full
        let detail = null;
        const { x } = d3.event;
        if (this.dragPhaseEnd) {
            // move end only
            const endX = x;
            const newDate = this.xScale.invert(endX);
            newDate.setHours(0, 0, 0, 0);
            if (newDate.getTime() !== phase.end.getTime()) {
                if (newDate > phase.begin) {
                    detail = {phase, begin: phase.begin, end: newDate};
                }
            }
        } else {
            const beginX = x - this.dragPhaseOffsetX;
            const newDate = this.xScale.invert(beginX);
            newDate.setHours(0, 0, 0, 0);
            if (newDate.getTime() !== phase.begin.getTime()) {
                const end = this.dragPhaseOffsetX > 5
                    ? new Date(newDate.getTime() + phase.end.getTime() - phase.begin.getTime())
                    : phase.end;
                if (newDate < end) {
                    detail = { phase, begin: newDate, end};
                }
            }
        }
        if (detail !== null) {
            this.store.dispatchEvent(new CustomEvent(Action.PhaseDragged, { detail }));
        }
    }

    private phaseMouseMoved = (phase: IPhase, i: number, nodes: SVGGElement[]) => {
        const g = nodes[i];
        const mx = d3.mouse(g)[0];
        if (mx < 5) {
            g.classList.add("drag_begin");
        } else if (g.getBBox().width - mx < 5) {
            g.classList.add("drag_end");
        } else {
            g.classList.remove("drag_begin", "drag_end");
        }
    }

    private phaseMouseOut = (ePhase: IPhase, i: number, nodes: SVGGElement[]) => {
        nodes[i].classList.remove("drag_begin", "drag_end");
    }
}
